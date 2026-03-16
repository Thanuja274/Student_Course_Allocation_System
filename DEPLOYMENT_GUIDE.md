# 🚀 GitHub Deployment Guide

## Step 1: Prepare Your Repository

### 1.1 Add all changes to Git
```bash
git add .
```

### 1.2 Commit your changes
```bash
git commit -m "Complete Course Allocation System - Production Ready"
```

### 1.3 Push to GitHub
```bash
git push origin main
```

## Step 2: Create GitHub Repository

If you haven't already created a repository on GitHub:

1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name it: `course-allocation-system`
4. Add a description: "A comprehensive Student Course Allocation Automation System"
5. Choose "Public" or "Private"
6. Don't initialize with README (we already have one)
7. Click "Create repository"

## Step 3: Connect Local Repository to GitHub

```bash
# If you haven't set the remote yet
git remote add origin https://github.com/yourusername/course-allocation-system.git

# Push to GitHub
git push -u origin main
```

## Step 4: Deploy Options

### Option 1: GitHub Pages (Frontend Only)
For frontend deployment on GitHub Pages:

1. **Install gh-pages** (in frontend directory):
```bash
cd frontend
npm install --save-dev gh-pages
```

2. **Update package.json** (add these scripts):
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist",
    "build": "vite build"
  }
}
```

3. **Deploy to GitHub Pages**:
```bash
npm run deploy
```

### Option 2: Vercel (Full Stack)
For full-stack deployment with backend:

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (for frontend)
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install` (for both frontend and backend)

### Option 3: Heroku (Full Stack)
For full-stack deployment on Heroku:

1. **Create Procfile** in root:
```bash
echo "web: npm start" > Procfile
```

2. **Update package.json** (add start script):
```json
{
  "scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd backend && npm start",
    "client": "cd frontend && npm start"
  }
}
```

3. **Deploy to Heroku**:
```bash
heroku create your-app-name
git push heroku main
```

## Step 5: Environment Variables

For production deployment, set these environment variables:

### Backend Environment Variables:
- `DB_HOST` - Database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `PORT` - Server port (usually 5000)

### Frontend Environment Variables:
- `VITE_API_URL` - Backend API URL

## Step 6: Database Setup for Production

### Option 1: Cloud Database (Recommended)
- **AWS RDS**
- **Google Cloud SQL**
- **MongoDB Atlas** (if migrating to MongoDB)
- **PlanetScale**

### Option 2: Docker Database
```bash
# Using Docker for MySQL
docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=course_allocation -p 3306:3306 -d mysql:8.0
```

## Step 7: Update README.md

Update the repository link in README.md:
```markdown
git clone https://github.com/yourusername/course-allocation-system.git
```

## Step 8: Add License

Create a `LICENSE` file:
```bash
echo "MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE." > LICENSE
```

## Step 9: Final Push

```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

## 🎯 Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] README.md updated with correct repository link
- [ ] Environment variables configured
- [ ] Database set up for production
- [ ] Frontend deployed (GitHub Pages/Vercel)
- [ ] Backend deployed (Vercel/Heroku/Railway)
- [ ] LICENSE file added
- [ ] .gitignore properly configured
- [ ] All tests passing in production

## 🚀 Quick Deploy Commands

```bash
# Add all files
git add .

# Commit changes
git commit -m "Production ready Course Allocation System"

# Push to GitHub
git push origin main

# Deploy frontend (if using GitHub Pages)
cd frontend
npm run deploy
```

## 📱 Live Demo Setup

Once deployed, update the README.md with your live demo link:

```markdown
## 📱 Live Demo

[🚀 Live Demo](https://your-app-url.com)
```

---

**🎓 Your Course Allocation System is now ready for GitHub deployment!**
