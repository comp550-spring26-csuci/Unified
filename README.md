#  UNIFIED

Unified is a scalable, role-based community management system built using the **MERN stack (MongoDB, Express, React, Node.js)**.  
It allows users to create communities, manage memberships, post content, organize events, and administer platform-wide operations securely.

---
##  Project Overview

Unified is designed as a **community-driven platform** where:

- **Users** can register and authenticate securely.
- **Communities** can be created and managed.
- **Membership** approval workflows are enforced.
- **Posts and comments** are organized by community.
- **Events** can be created inside communities.
- **Admins** control moderation and approvals.
- **Super Admin** manages the entire platform.

The system emphasizes:
-  **Security**: JWT-based protection and hashed passwords.
-  **Modular architecture**: Easy to maintain and scale.
-  **Scalable backend**: Controller-Service pattern for clean logic.
-  **Clean separation**: Strict decoupling of Frontend and Backend.

---

##  Architecture

The application follows a standard decoupled architecture:

**Client (React + Vite)**

&nbsp;&nbsp;&nbsp;&nbsp;↓ 

**REST API (Express Server)** 

&nbsp;&nbsp;&nbsp;&nbsp;↓  

**MongoDB (Mongoose ODM)**


### Frontend
- **React with Vite** for fast builds and hot module replacement.
- **Feature-based folder structure** to keep components and logic organized.
- **Centralized API state handling** for consistent data fetching.

### Backend
- **RESTful API design** following standard HTTP methods.
- **Controller-Service pattern** to separate routing from business logic.
- **Middleware-based authentication** for role checks and JWT verification.
- **MongoDB with Mongoose** for flexible yet structured data modeling.

---

##  Tech Stack

### Frontend
- **React**: UI Library
- **Vite**: Modern Build Tool
- **React Router**: Client-side navigation
- **Context API**: Global state management
- **Modern CSS**: Responsive layout system

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework for Node.js
- **MongoDB**: NoSQL Document Database
- **Mongoose**: Object Data Modeling (ODM)
- **JWT**: Secure authentication tokens
- **Multer**: Multi-part form data / File uploads

---

##  Core Features

###  Authentication
- Secure user registration and login.
- JWT-based authentication with protected frontend and backend routes.
- Role-based authorization (RBAC) to restrict sensitive actions.

###  Communities
- User-driven community creation.
- Detailed community profiles and join request system.

###  Membership System
- Workflow for Admins to approve or reject member requests.
- Real-time tracking of user membership status across different groups.

###  Posts & Comments
- Community-specific feeds for discussions.
- Full CRUD functionality for posts and threaded comments.

###  Events
- Integrated calendar events within specific communities.
- Automated visibility based on community membership.

###  Admin Controls
- Global moderation tools for Super Admins.
- Community-level moderation for designated Admins.

---

## Role System

| Role | Permissions |
| :--- | :--- |
| **User** | Join communities, create posts, comment, and RSVP to events. |
| **Admin** | Approve memberships, manage community content, and edit details. |
| **SuperAdmin** | Full platform authority: manage all users, communities, and settings. |

**Access Enforcement:**
- `auth.js`: Verifies the validity of the JWT in the request header.
- `roles.js`: Middleware that checks if the user's role matches the required permission level.

---

##  Folder Structure

### Root Directory
```text
Unified/
├── client/          # Frontend React application
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components (buttons, cards, etc.)
│   ├── scenes/      # Page-level components (auth, admin, profile)
│   ├── state/       # API communication & state management logic
│   ├── utils/       # Global helper functions and constants
│   ├── App.jsx      # Main routing configuration
│   └── main.jsx     # Application entry point
├── package.json
└── vite.config.js
├── server/          # Backend Express API
│ ├── config/          # DB connection and environment configs
│ ├── controllers/     # Business logic and request handlers
│ ├── middleware/      # Auth, Logging, and Role verification
│ ├── models/          # Mongoose data schemas
│ ├── routes/          # API endpoint definitions
│ ├── seed/            # Scripts to initialize Super Admin/Default data
│ ├── uploads/         # Local storage for uploaded files
│ └── utils/           # Backend utility functions
└── README.md        # Project documentation

