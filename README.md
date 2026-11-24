# 🌉 SkillsBridge – Student Networking Platform

**SkillsBridge** is a full-stack web application designed to help students connect, collaborate, showcase their skills, manage projects, and explore opportunities.

It provides a common platform where students can build their professional network and showcase their technical growth.

## 🚀 Live Demo

[Visit SkillsBridge](https://skillsbridge-frontend.onrender.com)

## ✨ Features

- **User Authentication:** Student registration and login.
- **Dashboard:** Personalized student workspace.
- **My Skills:** Add and manage technical skills.
- **Student Connections:** Discover students and send, accept, or reject connection requests.
- **Project Management:** Add, edit, delete, and showcase projects.
- **Opportunities:** Dedicated section to explore opportunities.
- **Database Integration:** Store and retrieve user data using MongoDB.
- **Responsive Interface:** Simple and user-friendly design.

## 🛠️ Tech Stack

**Frontend**
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB Atlas
- Mongoose

**Deployment**
- Render
- GitHub

## 📂 Project Structure

```text
SkillsBridge/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    ├── public/
    ├── index.html
    └── package.json
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ishita27Shrivastava/SkillsBridge.git
```

### 2. Navigate to the Project

```bash
cd SkillsBridge
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend:

```bash
npm start
```

### 4. Setup Frontend

Open a new terminal:

```bash
cd SkillsBridge/frontend
npm install
npm run dev
```

Open the local URL displayed in your terminal.

**Note:** For local development, configure the frontend API base URL to use `http://localhost:5000` instead of the deployed backend URL.

## 🔐 Security

- Environment variables are used for sensitive configuration.
- Database credentials and secret keys should never be committed to GitHub.
- Keep your `.env` file private.

## 🎯 Project Objective

The main objective of SkillsBridge is to create a student-focused networking platform where students can connect with peers, manage their technical skills, showcase their projects, and grow professionally.

## 👩‍💻 Developer

**Ishita Shrivastava**

B.Tech – Computer Science and Engineering

## 📄 License

This project is developed for educational and learning purposes.
