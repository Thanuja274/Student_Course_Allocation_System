# Course Allocation System (CAS)

A comprehensive Student Course Allocation Automation System with intelligent allocation algorithms, real-time seat management, and complete administrative control.

## 🎯 Features

### Student Features
- 🔐 Secure authentication and registration
- 📚 Browse available courses with real-time seat availability
- 🎯 Submit and rank course preferences (up to 8 courses)
- 📊 View allocation results instantly
- ⏰ Edit preferences before deadline
- 📋 Prerequisite validation and conflict detection

### Admin Features
- 🎛️ Complete administrative dashboard
- 📈 Comprehensive analytics and reporting
- ⚙️ Course management (add/edit/delete)
- 🔄 Manual allocation override
- 📊 Seat capacity management
- 🎯 Allocation engine control

### Intelligent Allocation Engine
- 🤖 Multi-pass greedy algorithm
- ⚖️ Fair distribution across courses
- 📚 Prerequisite validation
- ⏰ Timetable conflict detection
- 📊 CGPA-based tie-breaking
- 📋 Waitlist management

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express + MySQL 8.0
- **Authentication**: JWT tokens
- **Database**: MySQL with comprehensive relational schema

## 📱 Live Demo

[Your Deployment Link Here]

## 🛠️ Installation

### Prerequisites
- Node.js 16+
- MySQL 8.0
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/course-allocation-system.git
cd course-allocation-system
```

### 2. Database Setup
```sql
-- Create database and tables (see below for complete schema)
CREATE DATABASE IF NOT EXISTS course_allocation;
USE course_allocation;
-- Run the complete SQL schema provided below
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 👥 Default Credentials

| Role | Email | Password |
|------|--------|----------|
| Student | arjun@student.edu | student123 |
| Student | priya@student.edu | student123 |
| Student | rahul@student.edu | student123 |
| Admin | admin@university.edu | admin123 |

## 🧪 Testing

Run the comprehensive test suite:
```bash
node comprehensive-test.js
```

## 📊 System Status

✅ **100% Functional** - All features implemented and tested
✅ **End-to-End Testing** - Complete workflow verification
✅ **Production Ready** - Secure and scalable architecture

## 🎯 Complete Workflow

1. **Admin Setup**: Create courses, set capacities, configure rules
2. **Student Registration**: Account creation with department selection
3. **Preference Submission**: Browse, select, and rank courses
4. **System Validation**: Automatic prerequisite and conflict checking
5. **Allocation Process**: Intelligent fair course assignment
6. **Results Display**: Real-time student notifications
7. **Admin Reports**: Comprehensive analytics and management

## 🏗️ Project Structure

```
cas-project/
├── frontend/
│   ├── src/
│   │   ├── api/          axios instance
│   │   ├── context/      AuthContext
│   │   ├── pages/        All page components
│   │   └── styles/       Global CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── config/           DB connection
│   ├── controllers/      Business logic
│   ├── middleware/        Auth/validation
│   ├── models/           DB query helpers
│   ├── routes/           Express routes
│   ├── services/         Allocation engine
│   ├── .env
│   └── server.js
│
└── README.md
```

---

## MySQL Database Setup (Pin to Pin)

### Step 1 — Install MySQL
Download from: https://dev.mysql.com/downloads/installer/
- Choose MySQL Community Server
- Set root password during installation
- Remember the password

### Step 2 — Open MySQL
Option A — MySQL Command Line:
```
mysql -u root -p
(enter your password)
```

Option B — MySQL Workbench:
- Open Workbench
- Click the + icon to create a new connection
- Host: localhost, Port: 3306, Username: root
- Enter password and click OK
- Double click the connection to open it

### Step 3 — Create Database and Tables
Copy and paste this ENTIRE SQL block:

```sql
CREATE DATABASE IF NOT EXISTS course_allocation;
USE course_allocation;

CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE semesters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  start_date DATE,
  end_date DATE,
  preference_deadline DATETIME,
  is_active BOOLEAN DEFAULT FALSE,
  allocation_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') DEFAULT 'student',
  roll_number VARCHAR(20) UNIQUE,
  department_id INT,
  current_year INT DEFAULT 1,
  cgpa DECIMAL(4,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  credits INT DEFAULT 3,
  department_id INT,
  instructor VARCHAR(100),
  max_seats INT NOT NULL DEFAULT 30,
  min_year INT DEFAULT 1,
  semester_id INT,
  is_elective BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

CREATE TABLE timetable_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE prerequisites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  required_course_id INT NOT NULL,
  UNIQUE KEY uq_prereq (course_id, required_course_id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (required_course_id) REFERENCES courses(id)
);

CREATE TABLE completed_courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  grade VARCHAR(5),
  semester_id INT,
  UNIQUE KEY uq_completed (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE course_department_eligibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  department_id INT NOT NULL,
  UNIQUE KEY uq_elig (course_id, department_id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  semester_id INT NOT NULL,
  priority_rank INT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pref (student_id, course_id, semester_id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

CREATE TABLE allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  semester_id INT NOT NULL,
  status ENUM('allocated','waitlisted','rejected') NOT NULL DEFAULT 'allocated',
  preference_rank INT,
  allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  allocated_by ENUM('system','admin') DEFAULT 'system',
  admin_note TEXT,
  UNIQUE KEY uq_alloc (student_id, course_id, semester_id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

CREATE TABLE seat_tracker (
  course_id INT PRIMARY KEY,
  semester_id INT NOT NULL,
  allocated_seats INT DEFAULT 0,
  waitlisted_seats INT DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- SEED DATA
INSERT INTO departments (name, code) VALUES
  ('Computer Science', 'CS'),
  ('Electronics', 'EC'),
  ('Mechanical', 'ME'),
  ('Civil', 'CE');

INSERT INTO semesters (name, start_date, end_date, preference_deadline, is_active) VALUES
  ('2024-25 Odd Semester', '2024-07-01', '2024-11-30', '2030-12-31 23:59:59', TRUE);

-- Admin password: admin123
INSERT INTO users (name, email, password_hash, role, roll_number) VALUES
  ('System Admin', 'admin@university.edu',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UrjGphiAZNTTM8z6.', 'admin', 'ADMIN001');

-- Student password: student123
INSERT INTO users (name, email, password_hash, role, roll_number, department_id, current_year, cgpa) VALUES
  ('Arjun Kumar', 'arjun@student.edu',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2ueuKEShD/.', 'student', 'CS2021001', 1, 3, 8.5),
  ('Priya Sharma', 'priya@student.edu',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2ueuKEShD/.', 'student', 'CS2021002', 1, 3, 9.1),
  ('Rahul Verma', 'rahul@student.edu',
   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2ueuKEShD/.', 'student', 'CS2021003', 1, 3, 7.8);

INSERT INTO courses (code, name, description, credits, department_id, instructor, max_seats, min_year, semester_id, is_elective) VALUES
  ('CS401', 'Machine Learning',  'ML algorithms', 4, 1, 'Dr. Priya Sharma',  40, 3, 1, TRUE),
  ('CS402', 'Cloud Computing',   'AWS/Azure/GCP',  3, 1, 'Prof. Rahul Verma', 35, 3, 1, TRUE),
  ('CS403', 'Cybersecurity',     'Network security',3, 1, 'Dr. Anita Reddy',  30, 2, 1, TRUE),
  ('CS404', 'Blockchain',        'Smart contracts', 3, 1, 'Prof. Kiran Rao',  25, 3, 1, TRUE),
  ('EC401', 'IoT Systems',       'IoT protocols',   4, 2, 'Dr. Suresh Patel', 30, 3, 1, TRUE),
  ('ME401', 'Robotics',          'Automation',      4, 3, 'Prof. Deepak Singh',25,3, 1, TRUE);

INSERT INTO timetable_slots (course_id, day_of_week, start_time, end_time, room) VALUES
  (1,'Mon','09:00:00','10:30:00','A101'),(1,'Wed','09:00:00','10:30:00','A101'),
  (2,'Tue','11:00:00','12:30:00','B202'),(2,'Thu','11:00:00','12:30:00','B202'),
  (3,'Mon','14:00:00','15:30:00','C303'),(3,'Fri','14:00:00','15:30:00','C303'),
  (4,'Wed','14:00:00','15:30:00','D404'),(4,'Fri','09:00:00','10:30:00','D404'),
  (5,'Tue','09:00:00','10:30:00','E505'),(5,'Thu','09:00:00','10:30:00','E505'),
  (6,'Mon','11:00:00','12:30:00','F606'),(6,'Wed','11:00:00','12:30:00','F606');

INSERT INTO seat_tracker (course_id, semester_id) VALUES
  (1,1),(2,1),(3,1),(4,1),(5,1),(6,1);
```

### Step 4 — Verify Setup
```sql
USE course_allocation;
SHOW TABLES;
SELECT email, role FROM users;
SELECT name, max_seats FROM courses;
```

You should see 11 tables, 4 users, 6 courses.

---

## Running the Project

### Backend
```bash
cd backend
npm install
# Edit .env with your MySQL password
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Demo Login
| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Admin   | admin@university.edu     | admin123   |
| Student | arjun@student.edu        | student123 |
| Student | priya@student.edu        | student123 |
| Student | rahul@student.edu        | student123 |

---

## API Endpoints

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/auth/register    | Register student  |
| POST   | /api/auth/login       | Login             |
| GET    | /api/auth/me          | Get profile       |
| GET    | /api/auth/departments | List departments  |

### Courses
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| GET    | /api/courses       | All courses        |
| GET    | /api/courses/:id   | Course detail      |
| POST   | /api/courses       | Create (admin)     |
| PUT    | /api/courses/:id   | Update (admin)     |
| DELETE | /api/courses/:id   | Delete (admin)     |

### Preferences
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| POST   | /api/preferences        | Submit preferences       |
| GET    | /api/preferences/mine   | My preferences           |
| DELETE | /api/preferences        | Clear preferences        |

### Allocation
| Method | Endpoint                      | Description           |
|--------|-------------------------------|-----------------------|
| POST   | /api/allocation/run           | Run engine (admin)    |
| GET    | /api/allocation/my-result     | My result (student)   |
| GET    | /api/allocation/all           | All results (admin)   |
| POST   | /api/allocation/override      | Manual override       |
| DELETE | /api/allocation/:sid/:cid     | Remove allocation     |

### Admin
| Method | Endpoint                        | Description         |
|--------|---------------------------------|---------------------|
| GET    | /api/admin/dashboard            | Stats summary       |
| GET    | /api/admin/enrollment-report    | Per-course stats    |
| GET    | /api/admin/unallocated          | Unallocated list    |
| GET    | /api/admin/students             | All students        |
| PUT    | /api/admin/semester/deadline    | Update deadline     |
| POST   | /api/admin/semester/reset       | Reset allocation    |
