# Role CRUD Backend

A secure, full-featured Node.js backend API for managing **roles** and **users** with Role-Based Access Control (RBAC).

Built with Express.js, MongoDB (Mongoose + GridFS), JWT authentication, password recovery, profile media upload, and more.

## Features

- **User Authentication**
  - Register (`POST /api/auth/register`)
  - Login (`POST /api/auth/login`)
  - Logout with token revocation
  - Forgot Password (reset link via email)
  - Change Password (authenticated)
  - Protected profile (`GET /api/profile`)

- **Role Management (CRUD)**
  - Create, Read, Update, Delete roles
  - Only **admin** can create/update/delete
  - **admin** and **manager** can list roles
  - Flexible role names and permissions

- **User Profile with Media**
  - Upload profile image and video
  - Stored securely in MongoDB using GridFS
  - View/stream directly in browser

- **Security**
  - JWT authentication
  - Role-based authorization (`admin`, `manager`, `user`)
  - Token blacklist on logout
  - Password hashing with bcrypt

- **Email Testing**
  - Password reset using Nodemailer + Ethereal (test emails)

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT
- bcrypt
- Multer + GridFS (for image/video upload)
- Nodemailer (email)

## Project Structure


## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or cloud like MongoDB Atlas)
- Postman (for testing)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/ijc3093/role-crud-backend-postman.git
   cd role-crud-backend-postman

2. Install dependencies
    Bashnpm install

3. Create .env file

    env
        PORT=3000
        MONGO_URI=mongodb://localhost:27017/rolesdb
        JWT_SECRET=your_very_strong_secret_here
        JWT_EXPIRES_IN=24h

4. Start the server
    Bash
    node server.js
    Server.js running at Server runs at http://localhost:3000

## API Endpoints
### Auth
#### Step....
- POST /api/auth/register → Register user
- POST /api/auth/login → Login & get JWT

After login, get token from body for jwt
Then, Header:
Key: Authorization 
Value: Bearer {{jwt}}

- POST /api/auth/logout → Revoke token
- POST /api/auth/forgot-password → Send reset link
- POST /api/auth/reset-password/:token → Reset password
- POST /api/auth/change-password → Change password (authenticated)

### Profile

- GET /api/profile → Current user profile (with image/video URLs)
- POST /api/user-media/image → Upload profile image
- POST /api/user-media/video → Upload profile video

### Roles

- GET /api/roles → List all roles (admin/manager)
- POST /api/roles → Create role (admin)
- PUT /api/roles/:id → Update role (admin)
- DELETE /api/roles/:id → Delete role (admin)

### Protected Home

- GET /home → Welcome message for authenticated users

### Testing with Postman

1. Register → Login → Copy token
2. Use Authorization: Bearer <token> header for protected routes
3. Use {{jwt}} variable for auto-token (setup in collection Scripts)

### Future Improvements

- Email verification on registration
- Refresh tokens
- Deploy to Render/Vercel
- React frontend
- Role assignment to users

![Screenshot](https://github.com/ijc3093/role-crud-backend-postman/blob/master/Screens_Postman/Create_New_Role.PNG)
