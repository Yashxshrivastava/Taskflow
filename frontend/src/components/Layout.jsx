import { Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, Container, Avatar, Tooltip } from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    Folder as FolderIcon, 
    ExitToApp as LogoutIcon, 
    Menu as MenuIcon,
    Settings as SettingsIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';
import Notifications from './Notifications';

const drawerWidth = 260;

const Layout = () => {
    const { t } = useTranslation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const { darkMode, setDarkMode } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: t('Dashboard'), icon: <DashboardIcon />, path: '/' },
        { text: t('Projects'), icon: <FolderIcon />, path: '/projects' },
        { text: t('Settings'), icon: <SettingsIcon />, path: '/settings' },
    ];

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    {t('Task Manager')}
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton 
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={logout}>
                        <ListItemIcon><LogoutIcon /></ListItemIcon>
                        <ListItemText primary={t('Logout')} />
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'background.paper', color: 'text.primary', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>
                        TaskFlow
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Notifications />
                        <Tooltip title={darkMode ? t('Switch to Light Mode') : t('Switch to Dark Mode')}>
                            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                            </IconButton>
                        </Tooltip>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5 }} />
                        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, mr: 1, fontWeight: 500 }}>
                            {user?.name}
                        </Typography>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                            {user?.name?.charAt(0)}
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', backgroundColor: 'background.default' }}>
                <Toolbar />
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;
