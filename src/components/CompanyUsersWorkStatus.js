import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
    Box,
    Card,
    Avatar,
    Typography,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Refresh, Groups } from '@mui/icons-material';

export default function CompanyUsersWorkStatus({ companyId }) {
    const { token } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Date filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 2); // 2 days ago
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    useEffect(() => {
        console.log(employees);
    }, [employees]);

    const fetchCompanyUsersWorkStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/work-status/company-users-work-status`,
                {
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

            setEmployees(response.data.employees || []);
        } catch (err) {
            console.error('Company users work status fetch error:', err);
            setError(err?.response?.data?.message || err.message || 'Beklenmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line
    }, [startDate, endDate]);

    useEffect(() => {
        if (token && companyId) {
            fetchCompanyUsersWorkStatus();
        }
        // eslint-disable-next-line
    }, []);

    return (
        <Card
            sx={{
                p: 0,
                overflow: 'hidden',
                borderRadius: 3,
                backdropFilter: 'blur(8px)',
                bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(25,28,34,0.65)'
                    : 'rgba(255,255,255,0.75)',
                border: (t) => `1px solid ${t.palette.divider}`,
            }}
        >
            {/* Başlık Şeridi */}
            <Box
                sx={{
                    px: { xs: 1.5, sm: 2.5 },
                    py: { xs: 1.25, sm: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    rowGap: { xs: 1, sm: 1.5 },
                    columnGap: { xs: 1, sm: 1.5 },
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                }}
            >
                <Avatar
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.18)',
                        width: { xs: 36, sm: 42 },
                        height: { xs: 36, sm: 42 },
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        flexShrink: 0,
                        order: 0,
                    }}
                >
                    <Groups />
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0, order: 1 }}>
                    <Typography variant="h6" noWrap
                                sx={{ fontWeight: 600, letterSpacing: 0.3, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                        Çalışan Çalışma Durumu
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.9,
                            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                            display: 'block',
                            whiteSpace: { xs: 'normal', sm: 'nowrap' }
                        }}
                    >
                        Toplam: {employees.length} çalışan
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                        width: { xs: 'auto', sm: 'auto' },
                        order: 2,
                    }}
                >
                    <Tooltip title="Yenile">
                        <IconButton
                            onClick={fetchCompanyUsersWorkStatus}
                            size="small"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* İçerik buraya gelecek */}
            <Box sx={{ p: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                    İçerik yakında eklenecek...
                </Typography>
            </Box>
        </Card>
    );
}