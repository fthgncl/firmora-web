import React, {useState, useEffect, useCallback} from 'react';
import axios from 'axios';
import {useAuth} from '../contexts/AuthContext';
import {
    Box,
    Card,
    Avatar,
    Typography,
    IconButton,
    Tooltip,
    TextField,
    Collapse,
    CircularProgress,
    Alert,
} from '@mui/material';
import {ExpandMore, WorkHistory} from '@mui/icons-material';
import {useTranslation} from "react-i18next";
import CompanyUsersWorkTimelineChart from "./CompanyUsersWorkTimelineChart";
import {emloyeeSessionsSplitByDay} from "../utils/sessionTime";

export default function CompanyUsersWorkStatus({companyId}) {
    const {token} = useAuth();
    const {t} = useTranslation();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    // Date filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 2); // 2 days ago
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

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

            setEmployees( emloyeeSessionsSplitByDay(response.data.employees) || []);
            setHasFetched(true);
        } catch (err) {
            console.error('Company users work status fetch error:', err);
            setError(err?.response?.data?.message || err.message || t('common:unexpectedError'));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line
    }, [startDate, endDate, companyId, token]);

    useEffect(() => {
        if (isExpanded && token && companyId && !hasFetched) {
            fetchCompanyUsersWorkStatus();
        }
        // eslint-disable-next-line
    }, [isExpanded]);

    useEffect(() => {
        if (isExpanded && hasFetched && token && companyId) {
            const timeoutId = setTimeout(() => {
                fetchCompanyUsersWorkStatus();
            }, 2000);

            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line
    }, [startDate, endDate]);

    const handleToggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

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
                    px: {xs: 1.5, sm: 2.5},
                    py: {xs: 1.25, sm: 2},
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    rowGap: {xs: 1, sm: 1.5},
                    columnGap: {xs: 1, sm: 1.5},
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
                        width: {xs: 36, sm: 42},
                        height: {xs: 36, sm: 42},
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        flexShrink: 0,
                        order: 0,
                    }}
                >
                    <WorkHistory/>
                </Avatar>

                <Box sx={{flex: 1, minWidth: 0, order: 1}}>
                    <Typography variant="h6" noWrap
                                sx={{fontWeight: 600, letterSpacing: 0.3, textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
                        {t('workTimelineChart:title')}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        justifyContent: {xs: 'flex-end', sm: 'flex-end'},
                        width: {xs: 'auto', sm: 'auto'},
                        order: 2,
                    }}
                >
                    <Tooltip title={isExpanded ? t('common:close') : t('common:open')}>
                        <IconButton
                            onClick={handleToggleExpand}
                            size="small"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.18)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                '&:hover': {bgcolor: 'rgba(255,255,255,0.28)'},
                                transition: 'all 0.2s ease',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                        >
                            <ExpandMore/>
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Collapse in={isExpanded}>
                {isExpanded && (<>
                    <Box sx={{px: 2.5, py: 2}}>
                        <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap'}}>
                            <TextField
                                size="small"
                                type="date"
                                label={t('workTimelineChart:startDate')}
                                InputLabelProps={{shrink: true}}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                sx={{flex: '1 1 180px', minWidth: 180}}
                            />

                            <TextField
                                size="small"
                                type="date"
                                label={t('workTimelineChart:endDate')}
                                InputLabelProps={{shrink: true}}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                sx={{flex: '1 1 180px', minWidth: 180}}
                            />
                        </Box>
                    </Box>

                    {/* Error Message */}
                    {error && (
                        <Box sx={{px: 2.5, pb: 2}}>
                            <Alert severity="error" sx={{borderRadius: 2}}>
                                {error}
                            </Alert>
                        </Box>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}>
                            <CircularProgress size={40}/>
                        </Box>
                    )}

                    {/* Content */}
                    {!loading && !error && (
                        <Box sx={{p: 2.5}}>
                            <CompanyUsersWorkTimelineChart employees={employees}/>
                        </Box>
                    )}
                </>)}
            </Collapse>
        </Card>
    );
}