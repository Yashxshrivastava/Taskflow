import { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Grid, Paper, Divider, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    MenuItem, Chip, CircularProgress, Alert, IconButton, Tabs, Tab,
    Card, CardHeader, CardContent, InputAdornment, FormControl, InputLabel,
    Select, List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip, ListItemIcon,
    alpha
} from '@mui/material';
import { 
    Add as AddIcon, 
    PersonAdd as MemberIcon, 
    Search as SearchIcon,
    ViewList as ListIcon,
    ViewKanban as BoardIcon,
    Delete as DeleteIcon,
    Shield as AdminIcon,
    Person as UserIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useTranslation } from 'react-i18next';

const ProjectDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewTab, setViewTab] = useState(0); // 0 for List, 1 for Board
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    
    // Dialogs
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [memberDialogOpen, setMemberDialogOpen] = useState(false);
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);

    // Edit Project State
    const [editData, setEditData] = useState({ name: '', description: '' });

    // New Task State
    const [taskData, setTaskData] = useState({
        title: '', description: '', due_date: '', priority: 'Medium', assigned_to: ''
    });

    // New Member State
    const [memberEmail, setMemberEmail] = useState('');
    const [memberRole, setMemberRole] = useState('Member');

    const fetchData = async () => {
        try {
            const [projRes, tasksRes] = await Promise.all([
                API.get(`/projects/${id}`),
                API.get(`/tasks/project/${id}`)
            ]);
            setProject(projRes.data);
            setTasks(tasksRes.data);
        } catch (err) {
            setError('Failed to fetch project data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleCreateTask = async () => {
        try {
            await API.post('/tasks', { ...taskData, project_id: id });
            setTaskDialogOpen(false);
            setTaskData({ title: '', description: '', due_date: '', priority: 'Medium', assigned_to: '' });
            fetchData();
        } catch (err) {
            setError('Failed to create task');
        }
    };

    const handleAddMember = async () => {
        try {
            await API.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
            setMemberDialogOpen(false);
            setMemberEmail('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add member');
        }
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            await API.patch(`/tasks/${taskId}/status`, { status: newStatus });
            fetchData();
        } catch (err) {
            setError('Failed to update status');
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await API.patch(`/projects/${id}/members/${userId}/role`, { role: newRole });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm(t('Are you sure you want to remove this member?'))) return;
        try {
            await API.delete(`/projects/${id}/members/${userId}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove member');
        }
    };

    const handleUpdateProject = async () => {
        try {
            await API.put(`/projects/${id}`, editData);
            setProjectDialogOpen(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update project');
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm(t('Are you sure you want to delete this project? This action cannot be undone.'))) return;
        try {
            await API.delete(`/projects/${id}`);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete project');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (!project) return (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>{t('Project not found')}</Alert>
            <Button variant="contained" onClick={() => navigate('/')}>{t('Back to Dashboard')}</Button>
        </Box>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>{project.name}</Typography>
                    <Typography variant="body1" color="textSecondary">{project.description}</Typography>
                    <Chip label={project.role} sx={{ mt: 1 }} color="primary" />
                </Box>
                <Box>
                    {project.role === 'Admin' && (
                        <>
                            <Button 
                                variant="outlined" 
                                startIcon={<EditIcon />} 
                                onClick={() => {
                                    setEditData({ name: project.name, description: project.description });
                                    setProjectDialogOpen(true);
                                }} 
                                sx={{ mr: 1 }}
                            >
                                {t('Edit Project')}
                            </Button>
                            <Button variant="outlined" startIcon={<MemberIcon />} onClick={() => setMemberDialogOpen(true)} sx={{ mr: 1 }}>
                                {t('Add Member')}
                            </Button>
                        </>
                    )}
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setTaskDialogOpen(true)}>
                        {t('New Task')}
                    </Button>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Tabs value={viewTab} onChange={(e, v) => setViewTab(v)}>
                    <Tab icon={<ListIcon />} label={t('List View')} />
                    <Tab icon={<BoardIcon />} label={t('Board View')} />
                </Tabs>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder={t('Search tasks')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        label={t('Priority')}
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        sx={{ width: 120 }}
                    >
                        <MenuItem value="All">{t('All')}</MenuItem>
                        <MenuItem value="Low">{t('Low')}</MenuItem>
                        <MenuItem value="Medium">{t('Medium')}</MenuItem>
                        <MenuItem value="High">{t('High')}</MenuItem>
                    </TextField>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {project.role === 'Admin' && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ 
                            p: 3, 
                            borderRadius: 4, 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, fontWeight: 700 }}>
                                <MemberIcon sx={{ color: 'primary.main' }} /> {t('Manage Members')}
                            </Typography>
                            <List sx={{ width: '100%' }}>
                                {project.members.map((member) => (
                                    <ListItem 
                                        key={member.id} 
                                        divider 
                                        sx={{ 
                                            borderRadius: 2, 
                                            mb: 1, 
                                            px: 2,
                                            '&:last-child': { mb: 0, borderBottom: 'none' },
                                            transition: 'background 0.2s',
                                            '&:hover': { bgcolor: 'action.hover' },
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 45 }}>
                                            {member.role === 'Admin' ? <AdminIcon color="primary" /> : <UserIcon />}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={<Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{member.name}</Typography>} 
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" color="textSecondary">{member.email}</Typography>
                                                    <Chip label={t(member.role)} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                                                </Box>
                                            }
                                            secondaryTypographyProps={{ component: 'div' }} 
                                        />
                                        <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                                            {member.role === 'Member' ? (
                                                <Tooltip title={t('Upgrade to Admin')}>
                                                    <IconButton size="small" onClick={() => handleUpdateRole(member.id, 'Admin')} sx={{ color: 'primary.main', bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                                                        <AdminIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title={t('Demote to Member')}>
                                                    <IconButton size="small" onClick={() => handleUpdateRole(member.id, 'Member')} sx={{ bgcolor: 'action.selected' }}>
                                                        <UserIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title={t('Remove')}>
                                                <IconButton size="small" onClick={() => handleRemoveMember(member.id)} sx={{ color: 'error.main', bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'white' }, ml: 0.5 }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ 
                            p: 3, 
                            borderRadius: 4, 
                            height: '100%', 
                            border: '1px solid', 
                            borderColor: 'error.light',
                            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.05)' : 'rgba(211, 47, 47, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DeleteIcon /> {t('Danger Zone')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                {t('Once you delete a project, there is no going back. Please be certain.')}
                            </Typography>
                            <Button 
                                variant="contained" 
                                color="error" 
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteProject}
                                sx={{ 
                                    py: 1.5, 
                                    fontWeight: 700,
                                    boxShadow: '0 4px 14px 0 rgba(211, 47, 47, 0.39)'
                                }}
                            >
                                {t('Delete Project')}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {viewTab === 0 ? (
                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('Title')}</TableCell>
                                <TableCell>{t('Assignee')}</TableCell>
                                <TableCell>{t('Due Date')}</TableCell>
                                <TableCell>{t('Priority')}</TableCell>
                                <TableCell>{t('Status')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTasks.map((task) => (
                                <TableRow key={task.id} hover>
                                    <TableCell>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{task.title}</Typography>
                                        <Typography variant="caption" color="textSecondary">{task.description}</Typography>
                                    </TableCell>
                                    <TableCell>{task.assignee_name || 'Unassigned'}</TableCell>
                                    <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip label={task.priority} size="small" color={
                                            task.priority === 'High' ? 'error' : 
                                            task.priority === 'Medium' ? 'warning' : 'success'
                                        } />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            size="small"
                                            value={task.status}
                                            onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                                            sx={{ width: 130 }}
                                        >
                                            <MenuItem value="To Do">{t('To Do')}</MenuItem>
                                            <MenuItem value="In Progress">{t('In Progress')}</MenuItem>
                                            <MenuItem value="Done">{t('Done')}</MenuItem>
                                        </TextField>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredTasks.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="textSecondary">{t('No tasks found matching your criteria.')}</Typography>
                        </Box>
                    )}
                </TableContainer>
            ) : (
                <Grid container spacing={3}>
                    {['To Do', 'In Progress', 'Done'].map(status => (
                        <Grid item xs={12} md={4} key={status}>
                            <Box sx={{ 
                                p: 3, 
                                pt: 4,
                                borderRadius: 5,
                                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                border: '1px solid',
                                borderColor: 'divider',
                                minHeight: 600,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2.5
                            }}>
                                <Typography variant="h6" sx={{ 
                                    mb: 2, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    fontWeight: 800, 
                                    px: 1,
                                    color: 'text.primary',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {t(status)}
                                    <Chip 
                                        label={getTasksByStatus(status).length} 
                                        size="small" 
                                        sx={{ 
                                            fontWeight: 700, 
                                            bgcolor: 'primary.main', 
                                            color: 'white',
                                            height: 24,
                                            minWidth: 24
                                        }} 
                                    />
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {getTasksByStatus(status).map(task => (
                                        <Card key={task.id} sx={{ 
                                            borderRadius: 4, 
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            border: '1px solid',
                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': { 
                                                transform: 'translateY(-6px)', 
                                                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                                                borderColor: 'primary.main'
                                            }
                                        }}>
                                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{task.title}</Typography>
                                                    <Chip 
                                                        label={t(task.priority)} 
                                                        size="small" 
                                                        sx={{ 
                                                            height: 20, 
                                                            fontSize: '0.65rem', 
                                                            fontWeight: 800,
                                                            bgcolor: task.priority === 'High' ? alpha('#f44336', 0.1) : task.priority === 'Medium' ? alpha('#ff9800', 0.1) : alpha('#4caf50', 0.1),
                                                            color: task.priority === 'High' ? '#f44336' : task.priority === 'Medium' ? '#ff9800' : '#4caf50',
                                                            border: '1px solid',
                                                            borderColor: 'currentColor'
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="textSecondary" sx={{ mb: 3, fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                    {task.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                        {task.assignee_name || t('Unassigned')}
                                                    </Typography>
                                                    <TextField
                                                        select
                                                        size="small"
                                                        variant="standard"
                                                        value={task.status}
                                                        onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                                                        InputProps={{ disableUnderline: true }}
                                                        SelectProps={{ 
                                                            sx: { py: 0.5, fontSize: '0.8rem', fontWeight: 700 }
                                                        }}
                                                    >
                                                        <MenuItem value="To Do">{t('To Do')}</MenuItem>
                                                        <MenuItem value="In Progress">{t('In Progress')}</MenuItem>
                                                        <MenuItem value="Done">{t('Done')}</MenuItem>
                                                    </TextField>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {getTasksByStatus(status).length === 0 && (
                                        <Box sx={{ 
                                            py: 4, 
                                            textAlign: 'center', 
                                            border: '2px dashed', 
                                            borderColor: 'divider', 
                                            borderRadius: 4,
                                            opacity: 0.5 
                                        }}>
                                            <Typography variant="body2">{t('No tasks')}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Task Dialog */}
            <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>{t('Add New Task')}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                label={t('Title')}
                                fullWidth
                                required
                                placeholder="Enter task title"
                                value={taskData.title}
                                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label={t('Description')}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder={t('What needs to be done?')}
                                value={taskData.description}
                                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        scrollbarWidth: 'thin',
                                        '&::-webkit-scrollbar': { width: '6px' },
                                        '&::-webkit-scrollbar-thumb': { 
                                            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                            borderRadius: '10px'
                                        }
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel shrink htmlFor="due-date" sx={{ ml: -1.5, mt: -1 }}>{t('Due Date')}</InputLabel>
                                <TextField
                                    id="due-date"
                                    type="date"
                                    fullWidth
                                    value={taskData.due_date}
                                    onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ 
                                        '& .MuiInputBase-input': { mt: 1 },
                                        '& .MuiInputLabel-root': { display: 'none' } // Hide the internal label since we use explicit one
                                    }}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label={t('Priority')}
                                fullWidth
                                value={taskData.priority}
                                onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                            >
                                <MenuItem value="Low">Low</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="assign-label" shrink>{t('Assign To')}</InputLabel>
                                <Select
                                    labelId="assign-label"
                                    label={t('Assign To')}
                                    value={taskData.assigned_to}
                                    onChange={(e) => setTaskData({ ...taskData, assigned_to: e.target.value })}
                                    displayEmpty
                                >
                                    <MenuItem value=""><em>{t('Unassigned')}</em></MenuItem>
                                    {project.members.map(m => (
                                        <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setTaskDialogOpen(false)} color="inherit">{t('Cancel')}</Button>
                    <Button onClick={handleCreateTask} variant="contained" size="large">{t('Add Task')}</Button>
                </DialogActions>
            </Dialog>

            {/* Member Dialog */}
            <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{t('Add Team Member')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="User Email"
                            fullWidth
                            required
                            sx={{ mb: 3 }}
                            placeholder="colleague@example.com"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                        />
                        <TextField
                            select
                            label={t('Role')}
                            fullWidth
                            value={memberRole}
                            onChange={(e) => setMemberRole(e.target.value)}
                        >
                            <MenuItem value="Member">{t('Member')}</MenuItem>
                            <MenuItem value="Admin">{t('Admin')}</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setMemberDialogOpen(false)} color="inherit">{t('Cancel')}</Button>
                    <Button onClick={handleAddMember} variant="contained">{t('Add')}</Button>
                </DialogActions>
            </Dialog>
            {/* Project Edit Dialog */}
            <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{t('Edit Project Details')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label={t('Project Name')}
                            fullWidth
                            required
                            sx={{ mb: 3 }}
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                        <TextField
                            label={t('Description')}
                            fullWidth
                            multiline
                            rows={3}
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setProjectDialogOpen(false)} color="inherit">{t('Cancel')}</Button>
                    <Button onClick={handleUpdateProject} variant="contained">{t('Save Changes')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectDetail;
