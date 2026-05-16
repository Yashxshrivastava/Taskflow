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
    CircularProgress 
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import axios from '../api/axios';

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

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
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

    const handleRequest = async (requestId, action, notificationId) => {
        try {
            await axios.post(`/notifications/requests/${requestId}/handle`, { action });
            await handleMarkAsRead(notificationId);
            fetchNotifications();
        } catch (error) {
            console.error('Error handling request:', error);
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
                    sx: { width: 320, maxHeight: 400, mt: 1.5 }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Notifications</Typography>
                    {loading && <CircularProgress size={20} />}
                </Box>
                <Divider />
                <List sx={{ p: 0 }}>
                    {notifications.length === 0 ? (
                        <MenuItem disabled>
                            <Typography variant="body2">No notifications</Typography>
                        </MenuItem>
                    ) : (
                        notifications.map((n) => (
                            <ListItem 
                                key={n.id} 
                                sx={{ 
                                    flexDirection: 'column', 
                                    alignItems: 'flex-start',
                                    bgcolor: n.is_read ? 'transparent' : 'action.hover'
                                }}
                            >
                                <ListItemText 
                                    primary={n.message}
                                    secondary={timeAgo(n.created_at)}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: n.is_read ? 400 : 600 }}
                                />
                                {n.type === 'self_assignment_request' && !n.is_read && (
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        <Button 
                                            size="small" 
                                            variant="contained" 
                                            color="primary"
                                            onClick={() => handleRequest(JSON.parse(n.data).requestId, 'accept', n.id)}
                                        >
                                            Accept
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            color="error"
                                            onClick={() => handleRequest(JSON.parse(n.data).requestId, 'decline', n.id)}
                                        >
                                            Decline
                                        </Button>
                                    </Box>
                                )}
                                {!n.is_read && n.type !== 'self_assignment_request' && (
                                    <Button size="small" onClick={() => handleMarkAsRead(n.id)}>Mark as read</Button>
                                )}
                            </ListItem>
                        ))
                    )}
                </List>
            </Menu>
        </Box>
    );
};

export default Notifications;
