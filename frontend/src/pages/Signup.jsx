import { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Link, Alert, InputAdornment, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
    Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon, Person as PersonIcon,
    DarkMode as DarkModeIcon, LightMode as LightModeIcon
} from '@mui/icons-material';
import API from '../api/axios';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { alpha } from '@mui/material/styles';

const Signup = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { darkMode, setDarkMode, language, setLanguage } = useSettings();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await API.post('/auth/signup', { name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || t('Signup failed'));
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundImage: theme => `linear-gradient(${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)'}, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)'}), url("/taskflow_auth_bg_1778919278035.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            py: 4
        }}>
            {/* Top Bar for Settings */}
            <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 1 }}>
                <IconButton onClick={() => setDarkMode(!darkMode)} sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
            </Box>

            <Container maxWidth="xs">
                <Paper elevation={24} sx={{ 
                    p: 4, 
                    borderRadius: 6, 
                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(20px)',
                    border: '1px solid',
                    borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                }}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, letterSpacing: -1 }}>
                            {t('TaskFlow')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {t('Join our collaborative community')}
                        </Typography>
                    </Box>
                    
                    <Typography component="h2" variant="h5" align="center" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
                        {t('Create Account')}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label={t('Full Name')}
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            sx={{ mb: 1.5 }}
                            InputProps={{
                                sx: { borderRadius: 3 },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label={t('Email Address')}
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 1.5 }}
                            InputProps={{
                                sx: { borderRadius: 3 },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label={t('Password')}
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 4 }}
                            InputProps={{
                                sx: { borderRadius: 3 },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="primary" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ 
                                py: 1.8, 
                                borderRadius: 3, 
                                fontWeight: 800, 
                                textTransform: 'none', 
                                fontSize: '1.1rem', 
                                boxShadow: '0 8px 20px 0 rgba(0,0,0,0.2)',
                                '&:hover': {
                                    boxShadow: '0 12px 28px 0 rgba(0,0,0,0.3)',
                                }
                            }}
                        >
                            {t('Create Account')}
                        </Button>
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {t('Already have an account?')}{' '}
                                <Link component={RouterLink} to="/login" sx={{ fontWeight: 800, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                    {t('Sign In')}
                                </Link>
                            </Typography>
                        </Box>
                    </form>

                    {/* Language Switcher at Bottom */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center', gap: 3 }}>
                        <Button 
                            size="small" 
                            onClick={() => setLanguage('en')} 
                            sx={{ color: language === 'en' ? 'primary.main' : 'text.secondary', fontWeight: language === 'en' ? 700 : 400 }}
                        >
                            English
                        </Button>
                        <Button 
                            size="small" 
                            onClick={() => setLanguage('hi')} 
                            sx={{ color: language === 'hi' ? 'primary.main' : 'text.secondary', fontWeight: language === 'hi' ? 700 : 400 }}
                        >
                            हिन्दी
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Signup;
