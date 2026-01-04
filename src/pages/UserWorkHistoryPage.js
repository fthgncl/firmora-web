import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Card,
    CardHeader,
    CardContent,
    CircularProgress,
    Alert,
    Button,
    TextField,
    Grid,
    Typography,
    Box
} from '@mui/material';
import WorkTimelineChart from '../components/WorkTimelineChart';

export default function UserWorkHistoryPage() {
    const { userId, companyId } = useParams();
    const { token } = useAuth();
    const { t } = useTranslation(['users']);

    const [sessions, setSessions] = useState([]);
    const [totalMinutes, setTotalMinutes] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Date filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1); // 1 month ago
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
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

            setSessions(response.data.sessions || []);
            setTotalMinutes(response.data.totalMinutes || 0);
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
        return `${hours}h ${mins}m`;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Card>
                <CardHeader
                    title={<Typography variant="h5">{t('users:workHistory', 'Çalışma Geçmişi')}</Typography>}
                />
                <CardContent>
                    {/* Date Filter Form */}
                    <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2} alignItems="flex-end">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label={t('users:startDate', 'Başlangıç Tarihi')}
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label={t('users:endDate', 'Bitiş Tarihi')}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={fetchWorkHistory}
                                    disabled={loading}
                                >
                                    {t('users:filter', 'Filtrele')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    <Alert severity="info" sx={{ mb: 3 }}>
                        <strong>{t('users:totalWorkTime', 'Toplam Çalışma Süresi')}:</strong> {formatDuration(totalMinutes)}
                    </Alert>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {!loading && sessions.length > 0 && (
                        <WorkTimelineChart sessions={sessions} />
                    )}

                    {!loading && sessions.length === 0 && !error && (
                        <Alert severity="info">
                            {t('users:noWorkHistory', 'Bu tarih aralığında çalışma kaydı bulunamadı.')}
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}
