# Restaurant Bazi API

โปรเจคจบ ทำร้านอาหารแนะนำเมนูผ่าน Lineliff

## Features

- การลงทะเบียนผู้ใช้พร้อมการคำนวณดวงชะตา
- การทำนายดวงรายวันโดยใช้ AI
- การบริหารจัดการร้านอาหาร

---

## Tech Stack

- **Node.js** + **Express.js** - Backend framework
- **MySQL** - Database
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **Groq AI** - Fortune predictions
- **Thailand Bazi API** - Birth chart calculations

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- MySQL 8+ installed and running
- API keys for Bazi and Groq services

### 2.Install

### Backend
- **Node.js** (v20+) - Runtime Environment
- **Express.js** (v5.2.1) - Web Framework
- **PostgreSQL** - Database Management System
- **Socket.IO** (v4.8.3) - Real-time Communication
- **JWT** - Authentication & Authorization
- **Cloudinary** - Image Upload & Storage

### Security & Validation
- **Express Validator** - Input Validation & Sanitization
- **Express Rate Limit** - API Rate Limiting
- **Helmet** - Security Headers
- **CORS** - Cross-Origin Resource Sharing

### Development Tools
- **Nodemon** - Development Server
- **Morgan** - HTTP Request Logging
- **Dotenv** - Environment Variables
- **Multer** - File Upload Handling

## System Architecture

### API Structure
```
/api/
├── /auth/          # User Authentication & Profile
├── /restaurant/    # Restaurant Management
├── /admin/         # Admin Management
└── /               # Health Check & Server Info
```

### Authentication Flow
1. **User Registration**: LINE UID + Birth Details → Bazi Calculation
2. **Login**: Email/Password → JWT Access Token + Refresh Token
3. **Token Refresh**: Refresh Token → New Access Token
4. **Logout**: Token Revocation (Blacklist)

## API Documentation

### Authentication Routes (`/api/auth/`)

#### POST /auth/lineUIDCheck
Check user registration with LINE UID
```json
{
  "lineUid": "user_line_uid"
}
```

#### POST /auth/register
Register new user with birth information
```json
{
  "lineUid": "user_line_uid",
  "name": "User Name",
  "gender": "male|female|other",
  "phone": "0812345678",
  "birth_date": "1990-01-01",
  "birth_time": "14:30",
  "birth_place": "Bangkok, Thailand"
}
```

#### POST /auth/prediction
Get daily prediction
```json
{
  "topic": "career|love|health|finance"
}
```

#### POST /auth/menu
View menu with element filtering
```json
{
  "page": 1,
  "elements": ["Fire", "Earth"],
  "sortBy": "price_asc|price_desc"
}
```

#### POST /auth/coupon/add
Create coupon for promotion
```json
{
  "promotion_id": 123
}
```

### Restaurant Routes (`/api/restaurant/`)

#### POST /restaurant/login
Restaurant login
```json
{
  "email": "restaurant@example.com",
  "password": "password123"
}
```

#### POST /restaurant/menu
Manage restaurant menu
```json
{
  "page": 1,
  "status": "AVAILABLE|UNAVAILABLE"
}
```

#### POST /restaurant/promotion/create
Create new promotion
```json
{
  "name": "Special Promotion",
  "element": ["Fire", "Earth"],
  "description": "Promotion for customers with Fire and Earth elements",
  "discount_value": 20.00,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

### Admin Routes (`/api/admin/`)

#### POST /admin/login
Admin login
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

#### POST /admin/restaurant
View all restaurants and customers
```json
{
  "page": 1,
  "limit": 10
}
```

## Database Design
![ER Diagram](docs/database/er-diagram.png)
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

## Installation & Setup

### 1. Install Dependencies
```bash
# Install dependencies
npm install
```

### 2. Set Environment Variables
Copy `.env.example` to `.env` and fill in the data:

### 3. Run Database Migration
```bash
# For PostgreSQL
psql -U your_user -d your_database -f scripts/Database.sql

# For MySQL
mysql -u your_user -p your_database < scripts/Database.sql
```

### 4. Start Development Server
```bash
# Development Mode
npm run dev

# Production Mode
npm start
```

### 5. Test API
```bash
# Health Check
curl http://localhost:3000/api/health

# Server Info
curl http://localhost:3000/api/
```

## Challenges & What I Learned

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

## Author

**Muad2003** - Developer of Bazi Restaurant API

This project is part of Project Course Year 3 Semester 3 at Rajamangala University of Technology

### Contact
- GitHub: [anuphapth](https://github.com/anuphapth)
- Email: anuphap2003118@gmail.com

### Development Information
- **Programming Language**: JavaScript (Node.js)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Development Period**: 1 Semester
- **Objective**: Combine Chinese astrology science with modern restaurant technology

---