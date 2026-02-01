if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require("express");
const cors = require("cors");
require("./conn/conn");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const CronJobs = require('./cronjobs');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ['https://abidipro.abidisolutions.com', 'http://localhost:5173', 'http://localhost:3000', "http://localhost:5174","http://localhost:5175" , "http://192.168.100.91:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', require('./routes/allRoutes'));
app.use('/api/web', require('./routes/webRoutesMount'));

// Add this route WITHOUT isLoggedIn middleware
app.get('/api/web/test-auth', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(400).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');
  
  try {
    // Decode without verifying to see the token contents
    const decoded = jwt.decode(token, { complete: true });
    
    res.json({
      message: 'Token received',
      header: decoded?.header,
      payload: {
        aud: decoded?.payload?.aud,
        iss: decoded?.payload?.iss,
        oid: decoded?.payload?.oid,
        upn: decoded?.payload?.upn,
        exp: decoded?.payload?.exp,
        expiresIn: decoded?.payload?.exp ? new Date(decoded.payload.exp * 1000).toISOString() : null
      },
      envVars: {
        hasTenantId: !!process.env.AZURE_TENANT_ID,
        hasClientId: !!process.env.AZURE_CLIENT_ID,
        expectedAudience: [
          process.env.AZURE_CLIENT_ID,
          `api://${process.env.AZURE_CLIENT_ID}`
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next(); // let API fail properly
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.all("*", (req, res, next) => {
  const { ExpressError } = require("./utils/ExpressError");
  next(new ExpressError(404, "Page not Found"));
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  new CronJobs();
});

process.on('SIGINT', async () => {
  console.log('Shutting down cron jobs...');
  process.exit(0);
});
