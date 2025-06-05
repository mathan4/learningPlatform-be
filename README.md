# Learning Management System Architecture

## Admin Credentials

master@gmail.com
123 

## System Overview

This Learning Management System (LMS) is designed to connect students with tutors for online learning. The platform facilitates scheduling, payment processing, lesson management, video conferencing, and feedback mechanisms.

## Tech Stack

1. **Frontend**:
   - React.js
   - TailwindCSS for styling
   - Redux for state management
   - Axios for API requests

2. **Backend**:
   - Node.js with Express.js
   - MongoDB with Mongoose ODM
   - JWT for authentication

3. **Integrations**:
   - Video Conferencing
   - Payment Processing
   - File Storage


---

## 📦 API Routes

### 🔐 Auth Routes (`/api/auth`)

| Method | Endpoint   | Description              |
|--------|------------|--------------------------|
| POST   | /register  | Register a new user      |
| POST   | /login     | User login               |
| POST   | /logout    | Logout authenticated user |
| GET    | /me        | Get current user info    |

> Protected routes use middleware: `verifyToken`

---

### 📚 Lessons Routes (`/api/lessons`)

| Method | Endpoint     | Role     | Description               |
|--------|--------------|----------|---------------------------|
| GET    | /student     | student  | Get student's lessons     |
| GET    | /mentor      | mentor   | Get mentor's lessons      |
| POST   | /book        | student  | Book a lesson             |
| DELETE | /:id         | student  | Cancel a booked lesson    |

> Uses: `verifyToken`, `allowRoles`

---

### 👨‍🏫 Mentor Routes (`/api/mentors`)

| Method | Endpoint     | Role           | Description                  |
|--------|--------------|----------------|------------------------------|
| GET    | `/`          | admin, student | Browse mentors               |
| GET    | /earnings    | mentor         | Mentor's earnings report     |

---

### 💳 Payment Routes (`/api/payments`)

| Method | Endpoint              | Role     | Description                    |
|--------|-----------------------|----------|--------------------------------|
| POST   | /checkout-session     | student  | Start Stripe checkout session  |

> Handles metadata like `studentId`, `mentorId`, `lessonId`. Saves payment with status `pending`.

---

### 🧑‍🏫 Zoom Meeting Routes (`/api/meetings`)

| Method | Endpoint                            | Description                                |
|--------|-------------------------------------|--------------------------------------------|
| POST   | /schedule-lesson/:lessonId          | Schedule a Zoom meeting                    |
| POST   | /update-recording/:lessonId         | Update Zoom recording link to the lesson   |

---

### 📝 Review Routes (`/api/reviews`)

| Method | Endpoint                   | Role             | Description                   |
|--------|----------------------------|------------------|-------------------------------|
| POST   | `/`                        | student          | Submit a review for a mentor  |
| GET    | /tutor/:tutorId            | student, admin   | View reviews for a tutor      |
| GET    | /student/:studentId        | admin            | View reviews by a student     |

---

### 👥 User Routes (`/api/users`)

| Method | Endpoint                         | Role     | Description                             |
|--------|----------------------------------|----------|-----------------------------------------|
| PUT    | /updateProfile                   | Auth     | Update user profile & photo             |
| POST   | /mentorRequest                   | Auth     | Submit request to become a mentor       |
| GET    | `/`                              | admin    | Get all users                           |
| GET    | /mentorRequest                   | admin    | View all mentor requests                |
| PATCH  | /mentorRequestUpdate/:id         | admin    | Approve or reject a mentor request      |
| DELETE | /:id                             | admin    | Delete a user                           |

---

## 🔐 Middleware

- **verifyToken** – JWT token validation  
- **allowRoles(roles)** – Role-based access control  
- **uploadDocuments** – Multer middleware for file handling

---

## 🔧 Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://your-user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000

STRIPE_SECRET_KEY=your_stripe_secret
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret
