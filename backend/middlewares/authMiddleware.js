const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/userSchema');
const { UnauthorizedError, ForbiddenError } = require('../utils/ExpressError');

const Company = require('../models/companySchema');

const clients = {};

function getJwksClient(tenantId) {
  if (!clients[tenantId]) {
    clients[tenantId] = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      timeout: 30000,
      cache: true,
      cacheMaxAge: 86400000
    });
  }
  return clients[tenantId];
}

function getKey(tenantId) {
  return function(header, callback) {
    if (!header || !header.kid) {
      console.error("JWT header or kid is missing");
      return callback(new Error("JWT header or kid is missing"));
    }

    const client = getJwksClient(tenantId);
    client.getSigningKey(header.kid, function (err, key) {
      if (err) {
        console.error("JWKS error:", err.message || err);
        return callback(err);
      }
      
      if (!key) {
        const errorMsg = `Signing key not found for kid: ${header.kid}`;
        console.error(errorMsg);
        return callback(new Error(errorMsg));
      }

      try {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      } catch (keyError) {
        console.error("Error getting public key:", keyError.message);
        callback(keyError);
      }
    });
  }
}

const isLoggedIn = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.query.token;

  if (!token) {
    return next(new UnauthorizedError("No token provided."));
  }

  // Decode unverified to get tenant ID for dynamic JWKS lookup
  const unverifiedDecoded = jwt.decode(token, { complete: true });
  if (!unverifiedDecoded || !unverifiedDecoded.payload) {
    return next(new UnauthorizedError("Invalid token format"));
  }

  // Determine if it's a local JWT or Azure JWT. Local JWTs usually lack 'tid'
  const isAzureToken = !!unverifiedDecoded.payload.tid;
  
  if (!isAzureToken) {
     // Local JWT validation (email/password login)
     jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
       if (err) return next(new UnauthorizedError("Invalid or expired local token"));
       try {
         const user = await User.findById(decoded.id || decoded._id);
         if (!user) return next(new UnauthorizedError("User not found"));
         
         req.user = {
            id: user.id, _id: user._id, azureId: user.azureId, name: user.name,
            email: user.email, role: user.role, company: user.company,
            department: user.department, isTechnician: user.isTechnician, avatar: user.avatar
         };
         if (req.user.role === 'Global Reader' && req.method !== 'GET') {
            return next(new ForbiddenError("Global Readers have read-only access."));
         }
         req.token = token;
         return next();
       } catch (dbErr) {
         return next(new UnauthorizedError("Auth DB Error"));
       }
     });
     return;
  }

  // Azure SSO validation
  const tid = unverifiedDecoded.payload.tid;
  
  // Validate that this Tenant ID actually belongs to a registered company, or is the Master Tenant
  const masterClientId = process.env.AZURE_CLIENT_ID;
  let allowedAudiences = [
    masterClientId,
    `api://${masterClientId}`
  ];

  if (tid !== process.env.AZURE_TENANT_ID) {
     const company = await Company.findOne({ azureTenantId: tid });
     if (!company) {
        return next(new UnauthorizedError("Unregistered Azure Tenant"));
     }
     if (company.azureClientId && company.azureClientId !== masterClientId) {
        allowedAudiences.push(company.azureClientId);
        allowedAudiences.push(`api://${company.azureClientId}`);
     }
  }

  const verifyOptions = {
    audience: allowedAudiences,
    issuer: [
      `https://login.microsoftonline.com/${tid}/v2.0`,
      `https://sts.windows.net/${tid}/`
    ],
    algorithms: ['RS256']
  };

  jwt.verify(token, getKey(tid), verifyOptions, async (err, decoded) => {
    if (err) {
      console.error("--- TOKEN VERIFICATION FAILED ---");
      return next(new UnauthorizedError("Invalid or expired token"));
    }

    try {
      // 1. Try to find user by their Azure ID (Best match)
      let user = await User.findOne({ azureId: decoded.oid });

      // 2. If not found, try to find by Email (Invitation match)
      if (!user) {
        const email = decoded.upn || decoded.preferred_username || decoded.email;

        if (!email) {
          return next(new UnauthorizedError("Token does not contain an email address"));
        }

        user = await User.findOne({ email: email });

        // If exact email match fails, try toggling the first letter's case
        if (!user && email) {
          const firstChar = email.charAt(0);
          const toggledFirstChar = firstChar === firstChar.toUpperCase() 
            ? firstChar.toLowerCase() 
            : firstChar.toUpperCase();
          const alternativeEmail = toggledFirstChar + email.slice(1);
          
          user = await User.findOne({ email: alternativeEmail });
          if (user) console.log(`Matched user with alternative email case: ${alternativeEmail}`);
        }

        if (user) {
          // Found them via invite! Link their Azure ID
          if (user.azureId !== decoded.oid) {
            try {
              user.azureId = decoded.oid;
              await User.updateOne({ _id: user._id }, { $set: { azureId: decoded.oid } });
              console.log(`Mapped existing user ${user.email} to Azure ID`);
            } catch (err) {
              if (err.code === 11000) {
                console.log(`Concurrent mapping caught and ignored for ${user.email}`);
              } else {
                throw err;
              }
            }
          } else {
            console.log(`User ${user.email} already mapped to Azure ID`);
          }
        } else {
          // --- SECURITY: REJECT UNINVITED USERS ---
          console.warn(`Blocked login attempt from uninvited email: ${email}`);
          return next(new UnauthorizedError("Access Denied: You must be invited to the portal by an Admin."));
        }
      }

      // --- AUTO-ACTIVATE USER ON JOIN ---
      if (user.empStatus === 'Pending') {
        console.log(`🚀 Activating user ${user.email} on first login!`);
        user.empStatus = 'Active';
        if (!user.azureId) user.azureId = decoded.oid;
        try {
          await User.updateOne({ _id: user._id }, { $set: { empStatus: 'Active', azureId: user.azureId } });
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }
      // --------------------------------

      // 3. Attach user to request
      req.user = {
        id: user.id,
        _id: user._id,
        azureId: user.azureId,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        isTechnician: user.isTechnician,
        avatar: user.avatar
      };

      // --- GLOBAL READER WRITE PROTECTION ---
      if (req.user.role === 'Global Reader' && req.method !== 'GET') {
        return next(new ForbiddenError("Global Readers have read-only access and cannot perform this action."));
      }

      req.token = token;
      next();
      
    } catch (dbError) {
      console.error("User mapping error:", dbError);
      return next(new UnauthorizedError("Authentication failed during user mapping"));
    }
  });
};
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }

    // Normalize user role and allowed roles (remove spaces, lowercase)
    const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
    const allowedRoles = roles.map(role => role.replace(/\s+/g, '').toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }
    next();
  };
};

const isMasterAdmin = async (req, res, next) => {
  if (!req.user || !req.user.company) {
    return next(new ForbiddenError("No company assigned to this user."));
  }
  const company = await Company.findById(req.user.company);
  if (!company || !company.isMasterTenant) {
    return next(new ForbiddenError("Access Denied. Only Master Tenant Super Admins can access this route."));
  }
  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  if (userRole !== 'superadmin' && userRole !== 'admin') {
    return next(new ForbiddenError("Access Denied. Master Admin required."));
  }
  next();
};

module.exports = { isLoggedIn, restrictTo, isMasterAdmin };