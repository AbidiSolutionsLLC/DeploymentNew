if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require("express");
const cors = require("cors");
require("./conn/conn");
const cookieParser = require("cookie-parser");
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const path = require("path");


const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'", 
          "data:", 
          "https://cdn-icons-png.flaticon.com", 
          "https://learn.microsoft.com",
          "https://data3262.blob.core.windows.net"
        ],
        "connect-src": ["'self'", "https://login.microsoftonline.com", "https://abidipro.abidisolutions.com"],
        "frame-src": ["'self'", "https://login.microsoftonline.com"],
      },
    },
  })
);
app.use(mongoSanitize());

const corsOptions = {
  origin: ['https://abidipro.abidisolutions.com', 'http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000', "http://localhost:5174","http://localhost:5175" , "http://192.168.100.91:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10000, message: "Too many requests from this IP, please try again later" });
app.use('/api/v1/auth', authLimiter);

// Serve static files from uploads directory
app.use("/uploads/receipts", express.static(path.join(__dirname, "uploads/receipts")));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', require('./routes/webRoutesMount'));

// Add this route WITHOUT isLoggedIn middleware
app.get('/api/v1/test-auth', async (req, res) => {
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

// EMERGENCY CLEANUP ROUTE (Temporary)
app.get('/api/v1/fix-aug14-now', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const TimeTracker = require('./models/timeTrackerSchema');
    const Holiday = require('./models/holidaySchema');

    const startOfDay = new Date('2026-08-13T00:00:00Z');
    const endOfDay = new Date('2026-08-15T23:59:59Z');

    const records = await TimeTracker.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('user', 'name');
    
    let deletedCount = 0;
    let resetCount = 0;
    
    for (const record of records) {
      if ((record.status === 'Holiday' || record.status === 'Absent') && record.totalHours === 0 && (!record.checkIns || record.checkIns.length === 0)) {
        await TimeTracker.deleteOne({ _id: record._id });
        deletedCount++;
      } else if ((record.status === 'Holiday' || record.status === 'Absent') && record.totalHours > 0) {
        await TimeTracker.updateOne({ _id: record._id }, { $set: { status: 'Present' } });
        resetCount++;
      }
    }

    // Also fix any corrupted checkOutTime values (e.g. from July) on August 14th records
    const todayStartEST = new Date('2026-08-14T04:00:00Z');
    await TimeTracker.updateMany(
      { date: todayStartEST, checkOutTime: { $lt: new Date('2026-08-13T00:00:00Z') } },
      { $unset: { checkOutTime: "" } }
    );

    res.json({
      message: 'Cleanup successful!',
      deletedPlaceholders: deletedCount,
      resetToPresent: resetCount
    });
  } catch (error) {
    console.error(error);
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

const CronJobs = require('./cronjobs');
new CronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down cron jobs...');
  process.exit(0);
});