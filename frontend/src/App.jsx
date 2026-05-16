import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import Layout from './components/Layout';
// Removed redundant import

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                            <Route index element={<Dashboard />} />
                            <Route path="projects" element={<Projects />} />
                            <Route path="projects/:id" element={<ProjectDetail />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>
                    </Routes>
                </AuthProvider>
            </Router>
        </>
    );
}

export default App;
