# 🎓 Course Allocation System - Manual Testing Guide

## ✅ System Status
- **Backend**: Running on http://localhost:5000
- **Frontend**: Running on http://localhost:3000
- **Database**: Connected to MySQL

## 🧪 Manual Testing Checklist

### 1. Landing Page (http://localhost:3000)
- [ ] Page loads correctly
- [ ] Navigation buttons work: Home, Register, Students, Admin Login
- [ ] "Get Started" button navigates to student login
- [ ] "Register" button navigates to register page

### 2. Student Registration (http://localhost:3000/register)
- [ ] Page loads without errors
- [ ] Department dropdown shows options (Computer Science, Electronics, Mechanical, Civil)
- [ ] All form fields work: Name, Email, Password, Confirm Password, Roll Number, Department, Year, CGPA
- [ ] Form validation works:
  - [ ] Password mismatch shows error
  - [ ] Short password shows error
  - [ ] Required fields validation
- [ ] Successful registration redirects to dashboard
- [ ] Error handling works for duplicate emails/roll numbers

### 3. Student Login (http://localhost:3000/student-login)
- [ ] Page loads correctly
- [ ] Login form works with valid credentials
- [ ] Error handling for invalid credentials
- [ ] Successful login redirects to dashboard
- [ ] Demo credentials are displayed

### 4. Admin Login (http://localhost:3000/admin-login)
- [ ] Page loads correctly
- [ ] Login form works with admin credentials
- [ ] Error handling for invalid credentials
- [ ] Successful login redirects to admin dashboard

### 5. Student Dashboard (http://localhost:3000/dashboard)
- [ ] User info displays correctly
- [ ] Tab navigation works: Courses, Preferences, Results
- [ ] Courses tab shows available courses
- [ ] Can add courses to preferences
- [ ] Preferences tab shows selected courses
- [ ] Can reorder preferences with up/down arrows
- [ ] Can remove courses from preferences
- [ ] Can submit preferences successfully
- [ ] Results tab shows allocation results

### 6. Admin Dashboard (http://localhost:3000/admin)
- [ ] Dashboard loads with statistics
- [ ] Can view enrollment reports
- [ ] Can run allocation engine
- [ ] Can view unallocated students
- [ ] Can manage students list
- [ ] Can update semester deadline

## 🔧 Test Accounts

### Student Accounts
| Email | Password | Department | Year |
|--------|----------|-------------|------|
| arjun@student.edu | student123 | Computer Science | 3 |
| priya@student.edu | student123 | Computer Science | 3 |
| rahul@student.edu | student123 | Computer Science | 3 |
| john@test.edu | password123 | Computer Science | 2 |

### Admin Account
| Email | Password |
|--------|----------|
| admin@university.edu | admin123 |

## 🐛 Common Issues & Solutions

### Department Dropdown Not Showing
1. Check browser console for errors
2. Verify backend is running on port 5000
3. Check CORS configuration
4. Verify API endpoint: http://localhost:5000/api/auth/departments

### Registration Not Working
1. Check form validation errors
2. Verify all required fields are filled
3. Check network requests in browser dev tools
4. Verify department is selected

### Login Not Working
1. Verify credentials are correct
2. Check if user was registered successfully
3. Check for network errors
4. Verify JWT token is being stored

### Dashboard Not Loading
1. Verify user is logged in
2. Check authentication token in localStorage
3. Verify API endpoints are accessible
4. Check for JavaScript errors

## 📱 Testing URLs
- Landing: http://localhost:3000
- Register: http://localhost:3000/register
- Student Login: http://localhost:3000/student-login
- Admin Login: http://localhost:3000/admin-login
- Student Dashboard: http://localhost:3000/dashboard
- Admin Dashboard: http://localhost:3000/admin

## 🔍 Debug Information
Check browser console (F12) for:
- API request errors
- JavaScript errors
- Network request status
- Authentication token issues

## 📊 Backend API Endpoints
- GET /api/auth/departments - List departments
- POST /api/auth/register - Register student
- POST /api/auth/login - Login user
- GET /api/courses - List courses (requires auth)
- POST /api/preferences - Submit preferences (requires auth)
- GET /api/preferences/mine - Get user preferences (requires auth)
- POST /api/allocation/run - Run allocation (admin only)
