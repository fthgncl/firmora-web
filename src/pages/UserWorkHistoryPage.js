import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Card,
    CircularProgress,
    Alert,
    Button,
    TextField,
    Grid,
    Typography,
    Box,
    Avatar,
    IconButton,
    Paper,
    InputAdornment
} from '@mui/material';
import { ArrowBack, AccessTime, Phone, CalendarToday } from '@mui/icons-material';
import WorkTimelineChart from '../components/WorkTimelineChart';
import { formatPhoneForTel } from '../utils/phoneUtils';
import { splitByDay } from '../utils/sessionTime';

export default function UserWorkHistoryPage() {
    const { userId, companyId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { t } = useTranslation(['users']);

    const [sessions, setSessions] = useState([]);
    const [allowedDays, setAllowedDays] = useState([]);
    const [totalMinutes, setTotalMinutes] = useState(0);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Date filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1); // 1 month ago
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7); // 7 days ahead
        return date.toISOString().split('T')[0];
    });

    const fetchWorkHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/work-status/user-work-status`,
                {
                    targetUserId: userId,
                    companyId: companyId,
                    startDate: startDate,
                    endDate: endDate
                },
                {
                    headers: {
                        'x-access-token': token,
                    },
                }
            );

            setSessions( splitByDay(response.data.sessions) || []);
            setAllowedDays(response.data.allowedDays || []);
            setTotalMinutes(response.data.totalMinutes || 0);
            setUserInfo(response.data.user || null);
        } catch (err) {
            console.error('Work history fetch error:', err);
            setError(err?.response?.data?.message || err.message || 'Beklenmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line
    }, [startDate, endDate]);

    useEffect(() => {
        if (token && userId && companyId) {
            fetchWorkHistory();
        }
        // eslint-disable-next-line
    }, []);

    const formatDuration = (minutes) => {
        if (!minutes && minutes !== 0) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} ${t('common:hour')} ${mins} ${t('common:minute')}`;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header with Back Button */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                    onClick={() => navigate(-1)}
                    sx={{ color: 'primary.main' }}
                >
                    <ArrowBack />
                </IconButton>
                {userInfo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                            {userInfo.name?.[0]}{userInfo.surname?.[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {userInfo.name} {userInfo.surname}
                            </Typography>
                        </Box>
                        {userInfo.phone && formatPhoneForTel(userInfo.phone) && (
                            <IconButton
                                component="a"
                                href={`tel:${formatPhoneForTel(userInfo.phone)}`}
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark'
                                    }
                                }}
                            >
                                <Phone />
                            </IconButton>
                        )}
                    </Box>
                )}
            </Box>

            {/* Date Filter Card */}
            <Card sx={{ mb: 3, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Box sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                            <TextField
                                fullWidth
                                type="date"
                                label={t('transfers:list.filters.startDate')}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarToday sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                                        display: 'none',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <TextField
                                fullWidth
                                type="date"
                                label={t('transfers:list.filters.endDate')}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarToday sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                                        display: 'none',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={fetchWorkHistory}
                                disabled={loading}
                                sx={{ py: 1.5 }}
                            >
                                {t('common:filter')}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Card>

            {/* Total Work Time Card */}
            <Paper
                sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <AccessTime sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                            {t('users:totalWorkTime')}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {formatDuration(totalMinutes)}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                    <CircularProgress size={60} />
                </Box>
            )}

            {!loading && sessions.length > 0 && (
                <WorkTimelineChart sessions={sessions} allowedDays ={allowedDays} />
            )}

            {!loading && sessions.length === 0 && !error && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    {t('users:noWorkHistory')}
                </Alert>
            )}
        </Container>
    );
}
