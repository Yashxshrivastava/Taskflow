import { useState, useEffect } from 'react';
import { 
    Typography, Box, Button, Grid, Card, CardContent, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    Chip, CircularProgress, Alert 
} from '@mui/material';
import { Add as AddIcon, Folder as FolderIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useTranslation } from 'react-i18next';

const Projects = () => {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchProjects = async () => {
        try {
            const response = await API.get('/projects');
            setProjects(response.data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async () => {
        if (!name) return setError(t('Project name is required'));
        try {
            await API.post('/projects', { name, description });
            setOpen(false);
            setName('');
            setDescription('');
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to create project'));
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">{t('Projects')}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                    {t('New Project')}
                </Button>
            </Box>

            <Grid container spacing={4}>
                {projects.map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                        <Card 
                            onClick={() => navigate(`/projects/${project.id}`)}
                            sx={{ 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column',
                                cursor: 'pointer',
                                borderRadius: 5,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'visible',
                                '&:hover': { 
                                    transform: 'translateY(-8px)', 
                                    boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                                    borderColor: 'primary.main'
                                }
                            }}
                        >
                            <Box sx={{ 
                                position: 'absolute', 
                                top: -15, 
                                left: 20, 
                                width: 40, 
                                height: 40, 
                                borderRadius: 3, 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }}>
                                <FolderIcon />
                            </Box>
                            <CardContent sx={{ pt: 4, flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        {project.name}
                                    </Typography>
                                    <Chip 
                                        label={t(project.role)} 
                                        color={project.role === 'Admin' ? 'primary' : 'default'} 
                                        size="small" 
                                        sx={{ fontWeight: 700, height: 24 }}
                                    />
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ 
                                    mb: 2, 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    minHeight: 60
                                }}>
                                    {project.description || t('No description')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {projects.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body1" align="center" color="textSecondary">
                            {t('No projects found. Create one to get started!')}
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{t('Create New Project')}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('Project Name')}
                        fullWidth
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label={t('Description')}
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>{t('Cancel')}</Button>
                    <Button onClick={handleCreateProject} variant="contained">{t('Create')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Projects;
