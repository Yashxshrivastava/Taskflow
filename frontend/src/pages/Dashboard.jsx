import { useState, useEffect } from 'react';
import { 
    Grid, Paper, Typography, Box, Card, CardContent, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, Chip
} from '@mui/material';
import { Assignment as TaskIcon, Warning as OverdueIcon, CheckCircle as DoneIcon, Pending as ProgressIcon } from '@mui/icons-material';
import API from '../api/axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, backgroundColor: `${color}15`, color: color, mr: 2, display: 'flex' }}>
                    {icon}
                </Box>
                <Typography variant="subtitle1" color="textSecondary" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, projectsRes] = await Promise.all([
                    API.get('/dashboard/stats'),
                    API.get('/projects')
                ]);
                setStats(statsRes.data);
                setProjects(projectsRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    const getStatusCount = (status) => {
        return stats?.byStatus.find(s => s.status === status)?.count || 0;
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
                {t('System Overview')}
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('Total Tasks')} 
                        value={stats?.total} 
                        icon={<TaskIcon />} 
                        color="#1976d2" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('In Progress')} 
                        value={getStatusCount('In Progress')} 
                        icon={<ProgressIcon />} 
                        color="#ed6c02" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('Completed')} 
                        value={getStatusCount('Done')} 
                        icon={<DoneIcon />} 
                        color="#2e7d32" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard 
                        title={t('Overdue')} 
                        value={stats?.overdue} 
                        icon={<OverdueIcon />} 
                        color="#d32f2f" 
                    />
                </Grid>
            </Grid>
            
            <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                            {t('Project Progress')}
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('Project Name')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('Role')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('Completion')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {projects.map((project) => (
                                        <TableRow key={project.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>
                                                {project.name}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={t(project.role)} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell sx={{ width: '40%' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ width: '100%', mr: 1 }}>
                                                        <LinearProgress variant="determinate" value={project.completion_percentage} sx={{ height: 8, borderRadius: 5 }} />
                                                    </Box>
                                                    <Typography variant="body2" color="textSecondary">{project.completion_percentage}%</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {projects.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                                {t('No projects found.')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backgroundColor: 'primary.main', color: 'white' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('Quick Stats')}
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                                {t('My Assigned Tasks')}
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                {stats?.myTasks}
                            </Typography>
                        </Box>
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {t('Keep up the great work! You have completed {{count}} tasks so far.', { count: getStatusCount('Done') })}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
