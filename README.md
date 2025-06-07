# AddisCare - Hazard Management System

AddisCare is a web-based hazard management system built using the MERN stack (MongoDB, Express, React, Node.js). The system facilitates communication between citizens, government officials, and system administrators to report, track, and resolve hazards.

## System Roles

1. **Reporter** - Citizens who can:
   - Submit hazard reports
   - Vote on urgency
   - Provide feedback
   - Receive notifications
   - Search and track reports

2. **Government Official** - Officials who can:
   - Search and track hazards
   - Resolve and escalate issues
   - Generate statistical reports
   - Send notifications

3. **System Admin** - Administrators who can:
   - Manage users
   - Grant roles
   - Generate reports
   - Send notifications

## Backend Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb+srv://yabets:<db_password>@addiscare.cihweqx.mongodb.net/?retryWrites=true&w=majority&appName=Addiscare
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   ```
4. Seed the database with initial data:
   ```bash
   npm run seed
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user data

### Reports
- `POST /api/reports` - Create a new report
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get a single report
- `PUT /api/reports/:id/status` - Update report status (Government Officials only)
- `POST /api/reports/:id/comment` - Add a comment to a report
- `PUT /api/reports/:id/vote` - Vote on report urgency (Reporters only)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get a single user (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `PUT /api/users/:id/status` - Update user status (Admin only)
- `DELETE /api/users/:id` - Delete a user (Admin only)

### Notifications
- `GET /api/notifications` - Get all notifications for the current user
- `PUT /api/notifications/:id/read` - Mark a notification as read
- `POST /api/notifications` - Send a notification (Government Officials and Admin only)
- `POST /api/notifications/bulk` - Send a notification to all users with a specific role (Admin only)

### Statistics
- `GET /api/statistics` - Get statistics (Government Officials and Admin only)

## Test Users

The database is seeded with the following test users:

1. **Admin User**
   - Email: admin@addiscare.com
   - Password: password123
   - Role: admin

2. **Government Official**
   - Email: government@addiscare.com
   - Password: password123
   - Role: government

3. **Reporter User**
   - Email: reporter@addiscare.com
   - Password: password123
   - Role: reporter
