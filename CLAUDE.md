# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive employee management portal consisting of:
- Backend: Node.js/Express.js API with MongoDB
- Frontend: React/Vite application with Azure AD authentication
- Features include user management, time tracking, leave management, attendance, tickets, projects, and admin dashboards

## Architecture

### Backend Structure
- **Location**: `/backend`
- **Framework**: Express.js with MongoDB/Mongoose
- **Authentication**: Azure Active Directory (Azure AD) integration
- **Environment**: Uses `.env` file for configuration
- **Models**: Located in `/backend/models/` - includes User, Department schemas
- **Controllers**: Located in `/backend/controllers/` - handles business logic
- **Routes**: Located in `/backend/routes/` - API endpoints defined in `allRoutes.js`
- **Validation**: JOI schema validation in `/backend/JoiSchema/`
- **Middlewares**: Error handling, authentication in `/backend/middlewares/`

### Frontend Structure
- **Location**: `/frontend`
- **Framework**: React 19 with Vite
- **Authentication**: Azure MSAL for Azure AD integration
- **Styling**: Tailwind CSS with Material UI components
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM with role-based navigation
- **API Calls**: Axios with interceptors for auth handling

## Key Features

### API Endpoints
- `/api/users` - User management (CRUD operations)
- `/api/projects` - Project management
- `/api/tasks` - Task management
- `/api/tickets` - Ticket system for support
- `/api/timetrackers` - Time tracking functionality
- `/api/leaves` - Leave request management
- `/api/companies` - Company management

### Authentication & Authorization
- Azure Active Directory (Azure AD) integration
- RBAC (Role-Based Access Control) with roles: Super Admin, Admin, HR, Manager, Technician, Employee
- Permission system with write protection for sensitive fields
- Self-edit restrictions (users can't edit sensitive fields like salary, role, etc.)

### Database Models
- **User Schema**: Comprehensive user profiles with role, department, reporting structure, leave allocations, dashboard cards
- **Department Model**: Department management with member associations
- **Project, Task, Ticket, Leave models**: Core business entities

## Development Commands

### Backend
- `npm start` or `npm run start` - Start the backend server with nodemon
- Server runs on `PORT` environment variable (defaults to 3000)
- CORS configured for local development and production domains

### Frontend
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Key Technologies

### Backend Dependencies
- Express.js, Mongoose, MongoDB
- Azure Communication Email, Azure Storage Blob, Azure Identity
- Passport-Azure-AD for authentication
- JOI for validation
- Bcryptjs for password hashing
- JSON Web Tokens (JWT)
- Winston for logging
- Node-cron for scheduled jobs

### Frontend Dependencies
- React 19, React Router DOM
- Redux Toolkit, React Redux
- Azure MSAL for authentication
- Material UI, Ant Design, Tailwind CSS
- React Hook Form
- Axios for API calls
- React Toastify for notifications

## Important Configuration Files

### Environment Variables
- Backend `.env` file contains:
  - MONGODB_URI
  - AZURE AD configuration variables
  - Email service configuration
  - Various API keys and secrets

### Frontend Configuration
- `authConfig.js` - Azure AD client configuration
- `axios.js` - API client with Azure AD token handling
- `routeConfig.jsx` - Navigation configuration with role-based access

## Common Patterns

### Error Handling
- Custom ExpressError utility with error codes and messages
- Global error handler middleware
- Async wrapper (catchAsync) for promise handling

### File Uploads
- Multer for handling multipart forms
- Support for Azure Blob Storage or local storage

### RBAC Implementation
- Role-based permissions for different user types
- Write permission checks with escalation rules
- Self-edit restrictions for sensitive fields

## Development Guidelines

### Backend Controllers
- Use `catchAsync` wrapper for async route handlers
- Implement proper permission checks using `checkWritePermission`
- Follow RESTful API conventions
- Validate inputs using JOI schemas

### Frontend Components
- Use PrivateRoute and PublicRoute for authentication protection
- Leverage MSAL context for Azure AD integration
- Follow the component structure in `/frontend/src/Components/`
- Use Redux for global state management

### API Security
- All endpoints should respect RBAC permissions
- Sensitive operations require proper role verification
- User data access follows reporting hierarchy where applicable