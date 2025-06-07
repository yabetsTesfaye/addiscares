# AddisCare - Hazard Management System (Frontend)

This is the React frontend for the AddisCare hazard management system. It provides interfaces for all three user roles:

1. **Reporters** - Citizens who can submit hazard reports, vote on urgency, provide feedback, and track progress
2. **Government Officials** - Officials who can manage hazards, update statuses, generate statistics, and send notifications
3. **System Admins** - Administrators who can manage users, roles, reports, and system-wide notifications

## Getting Started

### Prerequisites

- Node.js and npm installed
- Backend server running on http://localhost:5000

### Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The application will open in your browser at http://localhost:3000.

## Features

### Reporter Features
- Dashboard with report statistics
- Submit new hazard reports with images
- View and filter personal reports
- Vote on report urgency
- Add comments and track progress
- Receive notifications

### Government Official Features
- Dashboard with hazard overview
- Manage and update hazard reports
- Change status and assign to officials
- Generate and view statistics
- Send notifications to reporters

### Admin Features
- System-wide dashboard
- User management (add, edit, delete)
- Role assignments
- Report monitoring
- System statistics
- Send individual and bulk notifications

## Technology Stack

- React
- React Router for navigation
- Bootstrap for UI components
- Chart.js for statistics visualization
- Axios for API communication

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Main page components organized by user role
- `/src/context` - Context providers for state management
- `/src/utils` - Utility functions and constants
