import { useState, useEffect } from 'react';
import { 
    IconButton, 
    Badge, 
    Menu, 
    MenuItem, 
    Typography, 
    Box, 
    List, 
    ListItem, 
    ListItemText, 
    Divider, 
    Button, 
    CircularProgress,
    Tooltip
} from '@mui/material';
import { Notifications as NotificationsIcon, DeleteSweep as ClearIcon } from '@mui/icons-material';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (id) => {
        try {
            await axios.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Clear all notifications?')) return;
        try {
            await axios.delete('/notifications/clear');
            setNotifications([]);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const handleRequest = async (requestId, action, notificationId) => {
        setLoading(true);
        try {
            await axios.post(`/notifications/requests/${requestId}/handle`, { action });
            // Successfully handled: Refresh everything
            await fetchNotifications();
            handleClose();
            // RELOAD page to ensure all components see the database change
            window.location.reload(); 
        } catch (error) {
            console.error('Error handling request:', error);
            alert('Action failed. Please check if you are an Admin of this project.');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = (n) => {
        if (n.project_id) {
            const path = `/projects/${n.project_id}${n.task_id ? `#task-${n.task_id}` : ''}`;
            navigate(path);
            handleClose();
            
            if (window.location.pathname.includes(`/projects/${n.project_id}`)) {
                const element = document.getElementById(`task-${n.task_id}`);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        if (!n.is_read) {
            handleMarkAsRead(n.id);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <Box>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 350, maxHeight: 450, mt: 1.5, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Notifications</Typography>
                    {notifications.length > 0 && (
                        <Tooltip title="Clear All">
                            <IconButton size="small" onClick={handleClearAll} color="primary">
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                <Divider />
                <List sx={{ p: 0 }}>
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    {notifications.length === 0 ? (
                        <MenuItem disabled>
                            <Typography variant="body2" sx={{ py: 2, textAlign: 'center', width: '100%' }}>No notifications yet</Typography>
                        </MenuItem>
                    ) : (
                        notifications.map((n) => (
                            <ListItem 
                                key={n.id} 
                                button
                                onClick={() => handleNotificationClick(n)}
                                sx={{ 
                                    flexDirection: 'column', 
                                    alignItems: 'flex-start',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: n.is_read ? 'transparent' : alpha('#1976d2', 0.05),
                                    transition: 'background 0.2s',
                                    '&:hover': { bgcolor: 'action.hover' },
                                    px: 2, py: 1.5
                                }}
                            >
                                <ListItemText 
                                    primary={n.message}
                                    secondary={timeAgo(n.created_at)}
                                    primaryTypographyProps={{ 
                                        variant: 'body2', 
                                        fontWeight: n.is_read ? 400 : 700,
                                        color: n.type.includes('overdue') ? 'error.main' : 'text.primary'
                                    }}
                                    secondaryTypographyProps={{ variant: 'caption', mt: 0.5 }}
                                />
                                {n.type === 'self_assignment_request' && !n.is_read && (
                                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, width: '100%' }}>
                                        <Button 
                                            size="small" 
                                            variant="contained" 
                                            color="primary"
                                            fullWidth
                                            disabled={loading}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRequest(JSON.parse(n.data).requestId, 'accept', n.id);
                                            }}
                                            sx={{ fontWeight: 700 }}
                                        >
                                            Accept
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            color="error"
                                            fullWidth
                                            disabled={loading}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRequest(JSON.parse(n.data).requestId, 'decline', n.id);
                                            }}
                                            sx={{ fontWeight: 700 }}
                                        >
                                            Decline
                                        </Button>
                                    </Box>
                                )}
                            </ListItem>
                        ))
                    )}
                </List>
            </Menu>
        </Box>
    );
};

const alpha = (color, opacity) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default Notifications;
