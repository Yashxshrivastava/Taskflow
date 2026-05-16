import { 
    Box, Typography, Paper, Grid, Switch, FormControlLabel, 
    Select, MenuItem, FormControl, InputLabel, Divider 
} from '@mui/material';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';

const Settings = () => {
    const { t } = useTranslation();
    const { 
        darkMode, setDarkMode, 
        language, setLanguage, 
        primaryColor, setPrimaryColor,
        fontFamily, setFontFamily
    } = useSettings();

    const colors = [
        { name: 'Blue', value: '#1976d2' },
        { name: 'Green', value: '#2e7d32' },
        { name: 'Purple', value: '#7b1fa2' },
        { name: 'Orange', value: '#ed6c02' },
        { name: 'Indigo', value: '#3f51b5' }
    ];

    const fonts = ['Inter', 'Roboto', 'Outfit', 'Open Sans', 'Montserrat'];

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
                {t('Settings')}
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('Website Customization')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            {t('Personalize your TaskFlow experience with these settings.')}
                        </Typography>

                        <Divider sx={{ mb: 4 }} />

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                {t('Appearance')}
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={darkMode} 
                                        onChange={(e) => setDarkMode(e.target.checked)} 
                                    />
                                }
                                label={t('Dark Mode')}
                            />
                        </Box>

                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                    {t('Language')}
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        <MenuItem value="en">{t('English')}</MenuItem>
                                        <MenuItem value="hi">{t('Hindi')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                    {t('Font Family')}
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value)}
                                    >
                                        {fonts.map(font => (
                                            <MenuItem key={font} value={font} style={{ fontFamily: font }}>{font}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                {t('Theme Color')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                {colors.map((color) => (
                                    <Box
                                        key={color.value}
                                        onClick={() => setPrimaryColor(color.value)}
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '12px',
                                            backgroundColor: color.value,
                                            cursor: 'pointer',
                                            border: primaryColor === color.value ? '3px solid' : 'none',
                                            borderColor: darkMode ? '#fff' : '#000',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            '&:hover': { transform: 'scale(1.1)' },
                                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}
                                        title={color.name}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Settings;
