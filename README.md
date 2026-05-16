# Team Task Manager

A full-stack collaborative task management application built with Node.js, Express, MySQL, and React.

## 🚀 Features
- **User Authentication**: Secure Login and Signup using JWT and bcrypt.
- **Project Management**: Create, edit, and delete projects.
- **Kanban Board**: Drag-and-drop style task status updates.
- **Member Management**: Add/remove team members and manage roles (Admin/Member).
- **Internationalization**: Support for multiple languages (English, Hindi, etc.).
- **Dark Mode**: Sleek UI with theme toggle support.

## 🛠 Tech Stack
- **Frontend**: React, Vite, Material UI (MUI), i18next, Axios.
- **Backend**: Node.js, Express, MySQL, JSON Web Tokens.
- **Database**: MySQL.

## 📦 Installation & Setup

### 1. Database Setup
- Create a MySQL database named `team_task_manager`.
- Run the [schema.sql](schema.sql) file to create the tables.
- (Optional) Run `node backend/seed.js` to populate sample data.

### 2. Backend Configuration
- Navigate to the `backend` folder.
- Copy `env.example` to `.env`.
- Update your database credentials in `.env`.
- Run `npm install`.
- Start the server: `npm start`.

### 3. Frontend Configuration
- Navigate to the `frontend` folder.
- Run `npm install`.
- Start the development server: `npm run dev`.

## 📂 Project Structure
- `backend/`: Express server, routes, and controllers.
- `frontend/`: React application with MUI components.
- `schema.sql`: Database schema definition.

## 📄 License
ISC
