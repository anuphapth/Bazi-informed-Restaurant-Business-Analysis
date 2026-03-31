# Bazi informed Restaurant Business Analysis

![Project Banner](https://img.shields.io/badge/BaziinformedRestaurantBusinessAnalysis%20Restaurant-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![React](https://img.shields.io/badge/React-19+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-lightgrey)

**Bazi Restaurant** is a restaurant management system that combines traditional Chinese Bazi astrology with modern technology. It allows users to register their birth information to calculate their personal elements and receive daily predictions based on authentic Chinese astrological principles, while connecting them with restaurant promotions that align with their favorable elements.

## Project Overview

Final year project for Year 3 at Rajamangala University of Technology, developed to help restaurants manage and recommend menu items to customers based on Chinese astrological principles.

### Core Concepts
- Use birth information (date, time, place) to calculate personal elements according to Bazi principles
- Provide daily predictions using AI (Groq API) written in Thai fortune-telling style
- Match restaurant menus and promotions with users' compatible elements
- Multi-level restaurant management system (Admin, Restaurant, User)

## Key Features

### Astrology and Predictions
- **User Registration**: Record birth information (date, time, place) to calculate elements
- **Automatic Element Calculation**: System calculates main element and compatible/incompatible elements
- **Daily Predictions**: Use AI to generate Thai-style daily predictions
- **Element-based Menu Filtering**: Display menus that align with user's compatible elements

### Multi-Level Authentication System
- **Admin Level**: Restaurant management and system-wide user oversight
- **Restaurant Level**: Menu management, promotion creation, and customer management
- **User Level**: Personalized experience with LINE UID integration
- **JWT Authentication**: Token-based authentication with refresh token rotation

### Restaurant Management
- **Restaurant CRUD**: Create, edit, delete restaurant information
- **Menu Management**: Add, edit, delete menu items with element tagging
- **Promotion System**: Create promotions with discounts and validity periods
- **Coupon System**: Distribute personalized coupons with unique codes

### Intelligent Matching System
- **Element-based Menu Filtering**: Show only menus compatible with user's elements
- **Targeted Promotions**: Send promotions to users with compatible elements
- **Real-time Notifications**: Use WebSocket for real-time promotion alerts

## Technology Stack

### Frontend (React + Vite)
- **React 19** - UI library for building SPA
- **Vite** - Build tool & dev server
- **Zustand** - Global state management
- **React Router DOM** - Client-side routing for SPA
- **Axios** - HTTP client for backend API communication
- **LINE LIFF SDK** - @line/liff for LINE integration
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Socket.IO Client** - Real-time communication
- **QR Code Scanner** - @yudiel/react-qr-scanner for QR scanning
- **Framer Motion** - Animation library

### Backend (Node.js + Express)
- **Node.js (v20+)** - Runtime Environment
- **Express.js (v5.2.1)** - Web Framework
- **PostgreSQL** - Database Management System
- **Socket.IO (v4.8.3)** - Real-time communication
- **JWT** - Authentication & Authorization
- **Cloudinary** - Image upload & storage

### Security & Validation
- **Express Validator** - Input validation & sanitization
- **Express Rate Limit** - API rate limiting
- **Helmet** - Security headers
- **CORS** - Cross-Origin Resource Sharing

### Development Tools
- **Nodemon** - Development server
- **Morgan** - HTTP request logging
- **Dotenv** - Environment variables
- **Multer** - File upload handling

### AI & External APIs
- **Groq AI** - For prediction generation
- **Thailand Bazi API** - For birth chart calculations
- **LINE API** - For authentication and LIFF

## System Architecture

### Frontend Architecture
```
src/
├── component/          # General UI components
├── layout/            # Layouts for different roles
│   ├── layoutadmin.jsx     # Admin layout
│   ├── layoutrestaurent.jsx # Restaurant layout
│   ├── layoutuser.jsx      # User layout
│   └── layoutdashbord.jsx  # Dashboard layout
├── pages/             # Page components
│   ├── adminpages/    # Admin pages
│   ├── restaurentpages/ # Restaurant pages
│   └── userpages/     # User pages
├── routes/            # Route definitions
├── store/             # Zustand stores
│   ├── useAdmin.jsx   # Admin state
│   ├── useUser.jsx    # User state
│   └── bazi.jsx       # Bazi data state
└── utils/             # Utility functions
    ├── api.js         # API calls for users
    ├── apiAdmin.js    # API calls for admin
    ├── apiRestaurant.js # API calls for restaurants
    └── socket.js      # Socket.IO connection
```

### Backend Architecture
```
Backend/
├── controllers/       # Request handling controllers
├── services/          # Business logic
├── repositories/      # Database access layer
├── routes/            # API route definitions
├── middleware/        # Various middleware
│   ├── auth.js        # Authentication
│   ├── validation.js  # Data validation
│   ├── rateLimiter.js # Rate limiting
│   └── errorHandler.js # Error handling
├── lib/               # Libraries and utilities
│   ├── db.js          # Database connection
│   ├── jwt.js         # JWT management
│   └── constants.js   # Constants
└── utils/             # Utility functions
    ├── cloudinary.js  # Cloudinary management
    └── multer.js      # File upload handling
```

### API Structure
```
/api/
├── /auth/          # Authentication and user profile
├── /restaurant/    # Restaurant management
├── /admin/         # Admin management
└── /               # Health check and server info
```

## Installation

### Prerequisites
- Node.js (v20+)
- PostgreSQL (v14+)
- npm or yarn

### 1. Download Project
```bash
git clone https://github.com/anuphapth/Bazi.git
cd Bazi
```

### 2. Setup Backend
```bash
cd Backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env file according to your requirements
```

### 3. Setup Frontend
```bash
cd Frontend

# Install dependencies
npm install

# Setup environment variables (if needed)
cp .env.example .env
# Edit .env file according to your requirements
```

### 4. Setup Database
```bash
# For PostgreSQL
psql -U your_user -d your_database -f Backend/scripts/Database.sql

# Or for MySQL
mysql -u your_user -p your_database < Backend/scripts/Database.sql
```

### 5. Start Development

#### Start Backend Server And Build Fronted
```bash
cd Frontend
npm run build
cd ../Backend 
npm run deploy:front
npm run start
```

### 6. Test API
```bash
# Health Check
curl http://localhost:3000/api/health

# Server Info
curl http://localhost:3000/api/
```

## Database Schema

### Core Tables

#### users
- `id`: Primary Key
- `line_uid`: LINE User ID (Unique per Restaurant)
- `restaurant_id`: Foreign Key to Restaurant
- `birth_date`, `birth_time`, `birth_place`: For Bazi Calculation

#### user_elements
- `user_id`: Foreign Key to User
- `main_element`: Main Element (Wood, Fire, Earth, Metal, Water)
- `favorable_elements`: JSON Array of Compatible Elements
- `unfavorable_elements`: JSON Array of Incompatible Elements

#### menu
- `restaurant_id`: Foreign Key to Restaurant
- `element`: JSON Array of Menu Elements
- `price`: Menu Price
- `image_url`: Cloudinary Image URL

#### promotion_groups
- `restaurant_id`: Foreign Key to Restaurant
- `discount_value`: Discount Percentage (0-100)
- `start_date`, `end_date`: Validity Period
- `status`: AVAILABLE|UNAVAILABLE|EXPIRED

#### coupons
- `user_id`: Foreign Key to User
- `promotion_id`: Foreign Key to Promotion
- `code`: Unique Coupon Code
- `status`: UNUSED|USED|EXPIRED

## Usage

### For Users
1. Open LINE LIFF Application
2. Register with LINE UID and birth information
3. Receive daily predictions
4. View menus that align with your elements
5. Receive and use promotion coupons

### For Restaurants
1. Login with email and password
2. Manage restaurant information
3. Add/edit/delete menu items with element tagging
4. Create promotions for customers with specific elements
5. View customer data and usage statistics

### For Admins
1. Login with admin email and password
2. Manage all restaurants
3. View system-wide user data
4. View reports and usage statistics

## Development

### Adding New Features

#### 1. Add API Endpoint
```javascript
// Backend/routes/newFeature.js
import express from 'express';
const router = express.Router();

router.get('/data', async (req, res) => {
  // Business logic
});

export default router;
```

#### 2. Add Frontend Component
```jsx
// Frontend/src/pages/NewFeature.jsx
import React from 'react';

const NewFeature = () => {
  return (
    <div>
      {/* Component UI */}
    </div>
  );
};

export default NewFeature;
```

#### 3. Add State Management
```javascript
// Frontend/src/store/newFeature.js
import { create } from 'zustand';

const useNewFeature = create((set) => ({
  // State and actions
}));

export default useNewFeature;
```

### Testing
```bash
# Test Frontend
cd Frontend
npm run lint
npm run build

# Test Backend
cd Backend
npm run dev
# Use Postman or curl for API testing
```

## Challenges & Learnings

### Main Challenges

#### 1. Bazi Calculation According to Chinese Astrology
- **Problem**: Converting birth information (date, time, place) into accurate Bazi data
- **Solution**: Use external API (BAZI_API_KEY) to calculate elements and components
- **Learned**: Complexity of Chinese astrology and its digital application

#### 2. Multi-Level JWT Token Management
- **Problem**: Support 3-level authentication (Admin, Restaurant, User) with token rotation
- **Solution**: Design JWT system with Refresh Token and Token Blacklist
- **Learned**: Security of Authentication systems and Session management

#### 3. Database Design for Element-based Matching
- **Problem**: Store and search element data as Array/JSON
- **Solution**: Use PostgreSQL JSONB type with Index for efficient searching
- **Learned**: Database design for complex relational data

#### 4. AI Integration for Prediction Generation
- **Problem**: Generate natural and accurate predictions according to astrology
- **Solution**: Use Groq API with specially designed Prompt Engineering
- **Learned**: Using AI for specialized Content creation

### Additional Learnings
- Designing APIs for real restaurant usage
- File Upload and Storage management with Cloudinary
- WebSocket usage for real-time notifications
- Rate Limiting design to prevent overuse
- Middleware usage for Validation and Security

## Future Improvements

### 1. Recommendation Engine
- Develop more sophisticated menu recommendation algorithms
- Add learning from user ordering behavior
- Feedback Loop system to improve recommendation accuracy

### 2. Data Analytics
- Dashboard for restaurants to view usage statistics
- Customer behavior analysis by element
- Sales and promotion reporting system

### 3. Bazi Feature Expansion
- Compatibility analysis between customers
- Monthly/yearly predictions
- Detailed love and career predictions

### 4. Mobile Application Development
- Develop mobile app for users
- QR Code scanning for coupons
- Push notification for promotions

### 5. POS System Integration
- Connect with restaurant POS systems
- Automatic inventory management
- Real-time sales analysis

## Developer

**Tar8508** - Frontend Developer

**anuphapth** - Backend Developer

This project is part of Project Course Year 3 Semester 3 at Rajamangala University of Technology

### Development Information
- **Programming Language**: JavaScript (Node.js)
- **Framework**: Express.js + React
- **Database**: PostgreSQL
- **Development Period**: 1 Semester
- **Objective**: Combine Chinese Bazi science with modern restaurant technology

---