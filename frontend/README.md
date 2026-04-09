# 🚀 ABIDI Pro - Frontend

## Overview

**ABIDI Pro Frontend** is a modern React application built with Vite, Redux, and Tailwind CSS. It provides a comprehensive user interface for the ABIDI Pro HRM and Project Management system.

## Tech Stack

- **React** v19.2.3 - UI Framework
- **Vite** v6.3.1 - Build tool and dev server
- **Redux Toolkit** v2.8.2 - State management
- **Tailwind CSS** v3.4.1 - Styling
- **Material-UI** v7.1.0 - Component library
- **Axios** v1.9.0 - HTTP client
- **React Router** v7.5.3 - Client-side routing
- **Azure MSAL** v3.0.24 - Azure AD authentication

## Quick Start

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file with necessary variables
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── Components/          # Reusable UI components (55+)
├── Pages/              # Full-page components
├── slices/             # Redux state slices
├── Store/              # Redux store configuration
├── api/                # API service modules
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── styles/             # Global styles
├── assets/             # Static assets
├── axios.js            # Centralized API client
├── authConfig.js       # Azure AD configuration
└── routeConfig.jsx     # Route definitions
```

## Key Features

- ✅ **User Management** - Create and manage users with roles
- ✅ **Project Management** - Create and track projects
- ✅ **Task Management** - Assign and monitor tasks
- ✅ **Time Tracking** - Log working hours
- ✅ **Leave Management** - Request and approve leaves
- ✅ **Expense Management** - Track and manage expenses
- ✅ **Ticket System** - Support ticket management
- ✅ **Dashboard & Analytics** - Real-time data visualization
- ✅ **Azure AD Integration** - Enterprise SSO

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AZURE_TENANT_ID=your_tenant_id
VITE_AZURE_CLIENT_ID=your_client_id
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_APP_NAME=ABIDI Pro
```

## Component Guidelines

- **PascalCase** naming for component files (e.g., `UserProfile.jsx`)
- **camelCase** for directories (e.g., `src/Components/`)
- Always use the centralized `axios` instance from `src/axios.js`
- Use Redux for global state management
- Use Tailwind CSS for styling

## Redux Structure

Redux state is organized by feature slices:

```javascript
{
  auth: { user, token, isAuthenticated },
  user: { profile, settings },
  attendance: { records, loading },
  notifications: { list, unread }
}
```

## API Integration

All API calls use the centralized Axios instance:

```javascript
import api from "../axios";

// GET request
const response = await api.get("/endpoint");

// POST request
const response = await api.post("/endpoint", data);
```

## Authentication

The application supports both JWT and Azure AD authentication:

- JWT tokens are stored in Redux
- Azure AD integration via MSAL
- Automatic token refresh on expiry
- Protected routes via `PrivateRoute.jsx`

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Troubleshooting

### Vite Port Already in Use

```bash
npm run dev -- --port 5174
```

### Clear node_modules and reinstall

```bash
rm -rf node_modules package-lock.json
npm install
```

### CORS Issues

Ensure the backend CORS_ORIGIN environment variable includes your frontend URL.

## Contributing

Follow the existing code structure and naming conventions. Ensure all new components are properly documented.

## Support

For issues or questions, refer to the main project documentation at `../COMPREHENSIVE_DOCUMENTATION.md`
