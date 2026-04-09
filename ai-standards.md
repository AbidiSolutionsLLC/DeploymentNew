# 🎯 AI Coding Standards & Project Guidelines

> **Purpose**: This document defines all strict coding rules, architectural patterns, UI paradigms, and error-handling standards discovered from this project. Use this to maintain consistency across all AI-generated code.

---

## 📋 Table of Contents
1. [Tech Stack & Versions](#tech-stack--versions)
2. [Naming Conventions](#naming-conventions)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [UI Component Paradigms](#ui-component-paradigms)
6. [State Management (Redux)](#state-management-redux)
7. [Error Handling Standards](#error-handling-standards)
8. [Authentication & Security](#authentication--security)

---

## Tech Stack & Versions

### Frontend
```json
{
  "react": "^19.2.3",
  "react-router-dom": "^7.5.3",
  "vite": "^6.3.1",
  "@reduxjs/toolkit": "^2.8.2",
  "react-redux": "^9.2.0",
  "redux-persist": "^6.0.0",
  "tailwindcss": "^3.4.1",
  "@mui/material": "^7.1.0",
  "@mui/icons-material": "^7.1.0",
  "antd": "^5.25.3",
  "@material-tailwind/react": "^2.1.10",
  "axios": "^1.9.0",
  "react-hook-form": "^7.56.3",
  "react-toastify": "^11.0.5",
  "framer-motion": "^12.10.5",
  "@azure/msal-react": "^3.0.24",
  "@azure/msal-browser": "^4.29.0",
  "lucide-react": "^0.508.0",
  "react-icons": "^5.5.0",
  "chart.js": "^4.4.9",
  "react-chartjs-2": "^5.3.0",
  "react-circular-progressbar": "^2.2.0",
  "react-datepicker": "^8.3.0",
  "react-grid-layout": "^1.5.1",
  "react-resizable": "^3.0.5",
  "react-zoom-pan-pinch": "^3.7.0",
  "moment-timezone": "^0.5.43",
  "dotenv": "^17.3.1",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.0",
  "@heroicons/react": "^2.2.0",
  "@iconify/react": "^6.0.0",
  "motion": "^12.11.0"
}
```

### Backend
```json
{
  "express": "^4.21.2",
  "mongoose": "^8.10.1",
  "mongodb": "^6.16.0",
  "joi": "^17.13.3",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.2",
  "dotenv": "^16.4.7",
  "nodemailer": "^8.0.0",
  "multer": "^1.4.5-lts.2",
  "@azure/storage-blob": "^12.30.0",
  "@azure/communication-email": "^1.1.0",
  "@azure/identity": "^4.13.0",
  "@azure/core-auth": "^1.10.1",
  "@azure-rest/ai-document-intelligence": "^1.1.0",
  "node-cron": "^3.0.3",
  "passport": "^0.7.0",
  "passport-azure-ad": "^4.3.5",
  "jwks-rsa": "^3.2.0",
  "winston": "^3.17.0",
  "cors": "^2.8.5",
  "cookie-parser": "^1.4.7",
  "axios": "^1.13.2",
  "moment-timezone": "^0.6.0",
  "ejs": "^3.1.10",
  "html-to-text": "^9.0.5",
  "streamifier": "^0.1.1",
  "xlsx": "^0.18.5",
  "@ngrok/ngrok": "^1.5.1",
  "nodemon": "^3.1.10",
  "crypto": "^1.0.1",
  "path": "^0.12.7"
}
```

---

## Naming Conventions

### Frontend Files & Components

| Entity | Pattern | Example |
|--------|---------|---------|
| **React Components (Files)** | PascalCase, `.jsx` extension | `AddHolidayModal.jsx`, `NavBarVertical.jsx`, `UserDetailModal.jsx` |
| **Directories** | camelCase or lowercase with hyphens | `src/Components/`, `src/slices/`, `src/utils/`, `src/Pages/` |
| **Hook Files** | Custom hooks use `use` prefix, `.js` extension | `attendanceTimer.js` |
| **Slice/Redux Files** | camelCase, append `Slice.js` | `authSlice.js`, `userSlice.js`, `projectSlice.js` |
| **API/Service Files** | camelCase, append `Api.js` | `holidayApi.js` |
| **Utility Functions** | camelCase, `.js` extension | `dateUtils.js` |
| **Context Files** | camelCase, `.jsx` extension | `context/someContext.jsx` |

### Backend Files & Functions

| Entity | Pattern | Example |
|--------|---------|---------|
| **Controller Files** | camelCase, append `Controller.js` | `userController.js`, `authController.js`, `taskController.js` |
| **Route Files** | camelCase, append with context | `allRoutes.js`, `webRoutesMount.js` |
| **Model/Schema Files** | camelCase or combined, append `Schema.js` | `userSchema.js`, `taskSchema.js`, `departemt.js` |
| **Middleware Files** | camelCase, append `Middleware.js` | `authMiddleware.js`, `errorMiddleware.js`, `validationMiddleware.js` |
| **Utility/Helper Files** | camelCase, `.js` extension | `catchAsync.js`, `emailService.js`, `token.js` |
| **Joi Validation Schema** | camelCase, append `JoiSchema.js` | `UserJoiSchema.js`, `LogJoiSchema.js` |
| **Function Names** | camelCase | `getCurrentUser()`, `createTask()`, `getAllProjects()` |

### Variable & Property Names

- **Constants**: `UPPER_SNAKE_CASE` (e.g., `CORS_OPTIONS`, `DEFAULT_TIMEOUT`)
- **Variables**: `camelCase` (e.g., `isOpen`, `userEmail`, `formData`)
- **Object Keys in DB**: `camelCase` (e.g., `firstName`, `lastName`, `empID`)
- **Mongoose Schema Fields**: `camelCase` (e.g., `azureId`, `empType`, `empStatus`)

---

## Frontend Architecture

### Directory Structure
```
src/
├── Components/          # Reusable UI components (NOT pages)
│   ├── home/           # Home page sub-components
│   ├── project/        # Project feature components
│   ├── ui/             # Primitive UI components (ModernDatePicker, ModernSelect)
│   ├── tabs/           # Tab-related components
│   ├── navbar.jsx      # Top navigation
│   ├── NavBarVertical.jsx
│   ├── AddHolidayModal.jsx
│   └── ...
├── Pages/              # Page-level components (full-page views)
├── slices/             # Redux toolkit slices
│   ├── authSlice.js
│   ├── userSlice.js
│   ├── projectSlice.js
│   └── ...
├── Store/              # Redux store configuration
│   └── index.js
├── api/                # API/service modules
│   └── holidayApi.js
├── Hooks/              # Custom React hooks
├── utils/              # Utility functions
├── styles/             # Global CSS/theme
├── context/            # React Context providers
├── assets/             # Images, icons
└── main.jsx            # Entry point
```

### Component Structure Pattern
```jsx
// Components follow this structure:
import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../axios"; // Centralized API instance
import ModernSelect from "./ui/ModernSelect";
import { toast } from "react-toastify";

const MyComponent = ({ prop1, prop2, onCallback }) => {
  // 1. State management
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({});
  
  // 2. Redux hooks
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // 3. Refs (for DOM manipulation)
  const modalRef = useRef(null);
  
  // 4. Effects (if needed)
  // useEffect(() => { ... }, []);
  
  // 5. Handlers
  const handleChange = (e) => { ... };
  const handleSubmit = async (e) => { ... };
  
  // 6. Render
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

### API Integration Pattern
```jsx
// Use centralized axios instance (src/axios.js)
// Never create new axios instances in components
import api from "../axios";

const data = await api.get("/endpoint");
const response = await api.post("/endpoint", payload);
```

### Form Handling Pattern
```jsx
// Use uncontrolled or React Hook Form for larger forms
import { useForm } from "react-hook-form";

const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: { fieldName: "" }
});

const onSubmit = async (data) => {
  try {
    await api.post("/endpoint", data);
    toast.success("Success!");
  } catch (err) {
    toast.error(err.response?.data?.message || "Error");
  }
};
```

---

## Backend Architecture

### Directory Structure
```
backend/
├── controllers/        # Business logic for each feature
│   ├── userController.js
│   ├── authController.js
│   ├── taskController.js
│   └── ...
├── routes/             # API route definitions
│   ├── allRoutes.js    # Main route file
│   └── webRoutesMount.js
├── models/             # Mongoose schemas
│   ├── userSchema.js
│   ├── projectSchema.js
│   └── ...
├── middlewares/        # Express middleware
│   ├── authMiddleware.js
│   ├── validationMiddleware.js
│   ├── errorMiddleware.js
│   └── ...
├── JoiSchema/          # Joi validation schemas (separate from models)
│   ├── UserJoiSchema.js
│   ├── LogJoiSchema.js
│   ├── ExpenseJoiSchema.js
│   ├── DepartmentJoiSchema.js
│   ├── HolidayJoiSchema.js
│   ├── LeaveJoiSchema.js
│   ├── TicketJoiSchema.js
│   ├── TimeLogJoiSchema.js
│   ├── TimesheetJoiSchema.js
│   └── resetPasswordSchema.js
├── utils/              # Helper functions and utilities
│   ├── catchAsync.js   # Error handler wrapper
│   ├── ExpressError.js # Custom error classes
│   ├── token.js        # JWT utilities
│   ├── emailService.js # Email sending
│   ├── logger.js       # Winston logger
│   ├── azureMulterStorage.js # Azure storage integration
│   ├── azureDocumentIntelligence.js # Document intelligence
│   ├── azureDownload.js # Azure download utilities
│   ├── cronScheduler.js # Cron job scheduling
│   ├── dateUtils.js    # Date utilities
│   ├── getCurrentDate.js # Current date helper
│   ├── rbac.js         # Role-based access control
│   ├── sseManager.js   # Server-sent events
│   ├── notificationService.js # Notifications
│   └── hierarchy.js    # Hierarchy utilities
├── config/             # Configuration files
├── conn/               # Database connection
├── logs/               # Log files (Winston)
├── index.js            # Server entry point
└── .env                # Environment variables
```

### Route Pattern
```javascript
// routes/allRoutes.js or webRoutesMount.js
const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn } = require("../middlewares/authMiddleware");

const userController = require("../controllers/userController");

// Route pattern: HTTP_METHOD("/path", middleware, catchAsync(handler))
router.post("/users", catchAsync(userController.createUser));
router.get("/users", isLoggedIn, catchAsync(userController.getAllUsers));
router.get("/users/:id", isLoggedIn, catchAsync(userController.getUserById));
router.put("/users/:id", isLoggedIn, catchAsync(userController.updateUser));
router.delete("/users/:id", isLoggedIn, catchAsync(userController.deleteUser));

module.exports = router;
```

### Controller Pattern
```javascript
// controllers/userController.js
const User = require("../models/userSchema");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");

// ALWAYS use async/await, wrapped by catchAsync middleware
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  // 1. Validate input
  if (!id) {
    throw new BadRequestError("User ID is required");
  }

  // 2. Fetch data
  const user = await User.findById(id);
  
  if (!user) {
    throw new NotFoundError("User");
  }

  // 3. Return response
  res.status(200).json({
    status: "success",
    message: "User retrieved successfully",
    user: user
  });
};

// CREATE pattern
exports.createUser = async (req, res) => {
  const { email, name, role } = req.body;
  
  const user = new User({ email, name, role });
  await user.save();
  
  res.status(201).json({
    status: "success",
    message: "User created successfully",
    user: user
  });
};

// UPDATE pattern
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
  
  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    user: updatedUser
  });
};

// DELETE pattern
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  
  res.status(200).json({
    status: "success",
    message: "User deleted successfully"
  });
};
```

### Mongoose Schema Pattern
```javascript
// models/userSchema.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // String fields
    email: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    
    // Enum fields with defaults
    role: {
      type: String,
      enum: ["Super Admin", "Admin", "HR", "Manager", "Employee"],
      required: true,
      default: "Employee"
    },
    
    // Number fields
    salary: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Boolean fields with defaults
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Reference to another schema
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null
    },
    
    // Dates
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true  // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("User", userSchema);
```

---

## UI Component Paradigms

### Tailwind + MUI + Ant Design Integration

**Philosophy**: 
- **Tailwind** for layout, spacing, flexbox, responsive design, and custom utilities
- **Material-UI** for complex components (Buttons, Modals, Icons, Cards)
- **Ant Design** for data-heavy components (Tables, Dropdowns, Forms)
- **Heroicons** for consistent icons throughout

### Common Component Patterns

#### Modal Pattern (Tailwind + React)
```jsx
const AddHolidayModal = ({ isOpen, setIsOpen, onHolidayAdded }) => {
  const [formData, setFormData] = useState({ holidayName: "", date: "" });
  const modalRef = useRef(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-all"
        >
          ×
        </button>

        {/* Header */}
        <div className="px-6 py-6 border-b border-slate-50">
          <h2 className="text-lg font-black text-slate-800 uppercase">
            ADD HOLIDAY
          </h2>
        </div>

        {/* Form */}
        <form className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
              HOLIDAY NAME*
            </label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="Enter holiday name"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
```

#### Button Styles (Tailwind Standardization)
```jsx
// Primary Button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Click Me
</button>

// Secondary Button
<button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
  Cancel
</button>

// Icon Button (from MUI/Heroicons)
<IconButton color="primary" onClick={handleClick}>
  <BellIcon className="w-6 h-6" />
</IconButton>
```

#### Input & Form Fields Pattern
```jsx
// Text Input
<input
  type="text"
  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// Select Dropdown (Use MUI Select or Custom ModernSelect)
import ModernSelect from "./ui/ModernSelect";

<ModernSelect 
  label="Choose Option"
  options={[{ value: "1", label: "Option 1" }]}
  value={selected}
  onChange={setSelected}
/>
```

#### Card Components Pattern
```jsx
// Simple Card with Tailwind
<div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-lg font-bold text-slate-800 mb-4">Card Title</h3>
  <p className="text-sm text-slate-600">Card content here</p>
</div>

// Card with MUI
import { Card, CardContent, CardHeader, CardTitle } from "@mui/material";

<Card>
  <CardHeader title="Card Title" />
  <CardContent>Content</CardContent>
</Card>
```

#### Table Pattern (Ant Design for Data Tables)
```jsx
import { Table, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    render: (text) => <a>{text}</a>
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <Space>
        <Button type="primary" icon={<EditOutlined />}>Edit</Button>
        <Button danger icon={<DeleteOutlined />}>Delete</Button>
      </Space>
    )
  }
];

<Table columns={columns} dataSource={data} />
```

#### Responsive Design Pattern
```jsx
// Use Tailwind responsive prefixes: sm:, md:, lg:, xl:, 2xl:
<div className="px-4 sm:px-6 md:px-8 lg:px-12">
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
    Responsive Title
  </h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {items.map((item) => (
      <div key={item.id} className="p-4 bg-white rounded-lg">
        {item.name}
      </div>
    ))}
  </div>
</div>
```

---

## State Management (Redux)

### Redux Slice Pattern
```javascript
// slices/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../axios";

// Async thunk for API calls
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error fetching user");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    data: null,
    loading: false,
    error: null
  },
  reducers: {
    // Synchronous actions
    setUser: (state, action) => {
      state.data = action.payload;
    },
    clearUser: (state) => {
      state.data = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
```

### Redux Store Configuration
```javascript
// Store/index.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "../slices/authSlice";
import userReducer from "../slices/userSlice";
import projectReducer from "./projectSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  projects: projectReducer
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "user"] // Only persist these slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

const persistor = persistStore(store);

export { store, persistor };
```

### Using Redux in Components
```jsx
import { useDispatch, useSelector } from "react-redux";
import { setUser, fetchUser } from "../slices/userSlice";

const MyComponent = () => {
  const dispatch = useDispatch();
  const { data: user, loading } = useSelector(state => state.user);

  useEffect(() => {
    dispatch(fetchUser(userId));
  }, [userId, dispatch]);

  const handleUpdateUser = (newData) => {
    dispatch(setUser(newData));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => handleUpdateUser(newData)}>Update</button>
    </div>
  );
};
```

### State Structure Best Practices
- **Keep state flat and normalized**: Avoid deeply nested objects
- **Separate concerns**: Authentication → `auth` slice, User data → `user` slice, Projects → `projects` slice
- **Only persist necessary slices**: Use `whitelist` to control what gets stored in localStorage
- **Use async thunks for API calls**: Never make API calls directly in reducers

---

## Error Handling Standards

### Backend Error Handling

#### Custom Error Classes
```javascript
// utils/ExpressError.js
class ExpressError extends Error {
  constructor(status, message) {
    super();
    this.status = status;
    this.message = message;
  }
}

class NotFoundError extends ExpressError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

class BadRequestError extends ExpressError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

class UnauthorizedError extends ExpressError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

class ForbiddenError extends ExpressError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

module.exports = { ExpressError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError };
```

#### CatchAsync Wrapper (Eliminates Try-Catch Boilerplate)
```javascript
// utils/catchAsync.js
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

// Usage in controller:
router.post("/users", catchAsync(userController.createUser));

// This automatically catches any errors and passes to global error handler
exports.createUser = async (req, res) => {
  // If anything throws, it's caught automatically
  const user = await User.create(req.body);
  res.status(201).json({ status: "success", user });
};
```

#### Global Error Handler Middleware
```javascript
// middlewares/globalErrorHandler.js
const { BadRequestError } = require("../utils/ExpressError");

const globalErrorHandler = (err, req, res, next) => {
  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(", ");
    err = new BadRequestError(message);
  }

  // Handle Mongoose cast errors
  if (err.name === "CastError") {
    err = new BadRequestError(`Invalid ${err.path}: ${err.value}`);
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    err = new BadRequestError(`This ${field} is already registered: ${value}`);
  }

  const statusCode = err.status || 500;
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

module.exports = globalErrorHandler;
```

#### Proper Error Throwing in Controllers
```javascript
// GOOD: Throw custom errors which are caught by global handler
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  
  if (!id) throw new BadRequestError("User ID is required");
  
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User");
  
  res.status(200).json({ status: "success", user });
};

// BAD: Using generic Error or res.status directly
// ❌ Don't do this:
// if (!user) {
//   return res.status(404).json({ error: "Not found" });
// }
```

### Frontend Error Handling

#### Using React Toastify for User Feedback
```jsx
import { toast } from "react-toastify";

try {
  const response = await api.post("/users", userData);
  toast.success("User created successfully!");
} catch (error) {
  // Toast automatically shows error message
  toast.error(error.response?.data?.message || "An error occurred");
  console.error(error);
}
```

#### Axios Interceptor Error Handling
```javascript
// axios.js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // Handle 401 Unauthorized
    if (status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/auth/login");
      return Promise.reject(error);
    }

    // Handle other errors
    return Promise.reject(error);
  }
);
```

---

## Authentication & Security

### Azure AD Authentication Flow
```javascript
// Backend: authMiddleware.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/userSchema');
const { UnauthorizedError } = require('../utils/ExpressError');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  timeout: 30000,
  cache: true
});

const isLoggedIn = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return next(new UnauthorizedError("No token provided."));
  }

  const verifyOptions = {
    audience: [process.env.AZURE_CLIENT_ID, `api://${process.env.AZURE_CLIENT_ID}`],
    issuer: [
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
      `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`
    ],
    algorithms: ['RS256']
  };

  jwt.verify(token, (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
      callback(null, key.getPublicKey());
    });
  }, verifyOptions, async (err, decoded) => {
    if (err) return next(new UnauthorizedError("Invalid or expired token"));

    // User mapping logic
    let user = await User.findOne({ azureId: decoded.oid });
    if (!user) {
      user = await User.findOne({ email: decoded.upn || decoded.email });
      if (user) user.azureId = decoded.oid;
    }

    if (!user) {
      return next(new UnauthorizedError("User not found"));
    }

    req.user = user; // Attach to request
    next();
  });
};

module.exports = { isLoggedIn };
```

### Security Best Practices

| Rule | Implementation |
|------|-----------------|
| **Never commit secrets** | Use `.env` file, never hardcode API keys |
| **Validate all inputs** | Use Joi schemas on backend, form validation on frontend |
| **Use HTTPS** | All production URLs use HTTPS |
| **CORS Configuration** | Whitelist specific origins, never use `*` in production |
| **Password Hashing** | Use `bcryptjs` with `hashSync()` before saving to DB |
| **Token Expiration** | JWT tokens should have reasonable expiration times |
| **Secure Headers** | Set appropriate response headers (CSP, X-Frame-Options, etc.) |
| **Input Sanitization** | Sanitize all user inputs to prevent XSS and injection attacks |
| **Rate Limiting** | Implement rate limiting on sensitive endpoints (login, register) |

---

## Code Quality & Practices

### Commenting Standards
- **Only comment WHY, not WHAT**
- ✅ Good: `// Retry on 429 (Too Many Requests)`
- ❌ Bad: `// Loop through users` (obvious from code)
- Use comments for business logic, edge cases, or non-obvious decisions

### Imports Organization
```javascript
// Order imports as: external → relative
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import api from "../axios";
import ModernSelect from "./ui/ModernSelect";
import { setUser } from "../slices/userSlice";
```

### Consistent Response Format (Backend)
```javascript
// Always follow this format for consistency
{
  "status": "success" | "failure",
  "message": "Human-readable message",
  "user": { /* data */ },
  "data": { /* data */ }
}
```

### Async/Await Over Promises
```javascript
// ✅ Good: Use async/await
const data = await fetchData();

// ❌ Avoid: Promise chains
fetchData().then(data => console.log(data));
```

---

## Summary

This document is the single source of truth for AI agents working on this project. **Every new file, component, or function must comply with these standards.**

**Key Takeaways:**
1. **Frontend**: PascalCase for components, Redux with slices, Tailwind + MUI + Ant Design
2. **Backend**: CatchAsync wrapper eliminates try-catch, custom error classes, global error handler
3. **Authentication**: Azure AD JWT validation, user mapping on login
4. **State**: Redux Toolkit with redux-persist for auth & user data
5. **Errors**: Always throw custom errors, let global handler respond

---

*Last Updated: 2026-03-30*
*Versioning: 1.0*
