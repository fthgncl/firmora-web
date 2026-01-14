import React from 'react';
import {
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

export default function WorkHistoryTable({ sessions, allowedDays }) {
    const theme = useTheme();
    const { t, i18n } = useTranslation(['workHistoryTable']);

    // Format time from ISO string
    const formatTime = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleTimeString(i18n.language, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date from ISO string
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleDateString(i18n.language, {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Format duration in minutes to hours and minutes
    const formatDuration = (minutes) => {
        if (!minutes && minutes !== 0) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} ${t('common:hour')} ${mins} ${t('common:minute')}`;
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    maxWidth: 1400,
                    width: '100%',
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                }}
            >
                {/* Work Sessions Table */}
                {sessions && sessions.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <AccessTimeIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                {t('workHistoryTable:workSessions')}
                            </Typography>
                            <Chip
                                label={`${sessions.length} ${t('workTimelineChart:completedSessions')}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Stack>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:date')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:entryTime')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:exitTime')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:duration')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:entryNote')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:exitNote')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sessions.map((session, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                '&:nth-of-type(odd)': {
                                                    bgcolor: theme.palette.action.hover
                                                },
                                                '&:hover': {
                                                    bgcolor: theme.palette.action.selected
                                                }
                                            }}
                                        >
                                            <TableCell>{formatDate(session.entryTime)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={formatTime(session.entryTime)}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {session.exitTime ? (
                                                    <Chip
                                                        label={formatTime(session.exitTime)}
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    <Chip
                                                        label={t('workHistoryTable:inProgress')}
                                                        size="small"
                                                        color="warning"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatDuration(session.durationMinutes)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: session.entryNote ? 'normal' : 'italic' }}>
                                                    {session.entryNote || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: session.exitNote ? 'normal' : 'italic' }}>
                                                    {session.exitNote || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Allowed Days Table */}
                {allowedDays && allowedDays.length > 0 && (
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <EventAvailableIcon sx={{ fontSize: 28, color: theme.palette.error.main }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                                {t('workHistoryTable:allowedDays')}
                            </Typography>
                            <Chip
                                label={`${allowedDays.length} ${t('workHistoryTable:allowed')}`}
                                size="small"
                                color="error"
                                variant="outlined"
                            />
                        </Stack>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:startDate')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:endDate')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:totalDays')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:description')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:files')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allowedDays.map((allowedDay, index) => {
                                        const startDate = new Date(allowedDay.start_date);
                                        const endDate = new Date(allowedDay.end_date);
                                        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                                        return (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    '&:nth-of-type(odd)': {
                                                        bgcolor: theme.palette.action.hover
                                                    },
                                                    '&:hover': {
                                                        bgcolor: theme.palette.action.selected
                                                    }
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(allowedDay.start_date)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(allowedDay.end_date)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${totalDays} ${t('common:days')}`}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {allowedDay.description || '-'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {allowedDay.filesCount > 0 ? (
                                                        <Chip
                                                            label={`${allowedDay.filesCount} ${t('common:files')}`}
                                                            size="small"
                                                            color="info"
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Empty State */}
                {(!sessions || sessions.length === 0) && (!allowedDays || allowedDays.length === 0) && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                            {t('workHistoryTable:noData')}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
