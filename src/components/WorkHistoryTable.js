import React, { useState, useEffect } from 'react';
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
    useTheme,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tabs,
    Tab,
    Snackbar,
    Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../contexts/AuthContext';
import { permissionsService } from '../services/permissionsService';
import axios from 'axios';

export default function WorkHistoryTable({ sessions, allowedDays, companyId, onSessionUpdate }) {
    const theme = useTheme();
    const { t, i18n } = useTranslation(['workHistoryTable', 'common']);
    const { token, user } = useAuth();

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [newEntryDateTime, setNewEntryDateTime] = useState('');
    const [newExitDateTime, setNewExitDateTime] = useState('');
    const [canEditWorkHours, setCanEditWorkHours] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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

    // Check permissions on mount and when dependencies change
    useEffect(() => {
        const checkPermissions = async () => {
            if (!token || !user || !companyId) {
                setCanEditWorkHours(false);
                return;
            }

            try {
                const hasPermission = await permissionsService.checkUserRoles(
                    token,
                    user,
                    companyId,
                    ['can_edit_work_hours'],
                    true
                );
                setCanEditWorkHours(hasPermission);
            } catch (error) {
                console.error('Error checking permissions:', error);
                setCanEditWorkHours(false);
            }
        };

        checkPermissions();
    }, [token, user, companyId]);

    // Helper function to format datetime to local string
    const formatDateTimeLocal = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Open edit dialog
    const handleEditClick = (session) => {
        if (!canEditWorkHours) {
            return;
        }

        setEditingSession(session);
        setNewEntryDateTime(formatDateTimeLocal(session.entryTime));
        setNewExitDateTime(formatDateTimeLocal(session.exitTime));
        setEditDialogOpen(true);
    };

    // Handle update request
    const handleUpdateWorkStatus = async () => {
        if (!editingSession || (!newEntryDateTime && !newExitDateTime)) return;

        try {
            const promises = [];

            // Check if entry time changed
            if (newEntryDateTime && newEntryDateTime !== formatDateTimeLocal(editingSession.entryTime)) {
                promises.push(
                    axios.post(
                        `${process.env.REACT_APP_API_URL}/work-status/update-work-status-date`,
                        {
                            entryId: editingSession.entryId,
                            newDate: new Date(newEntryDateTime).toISOString()
                        },
                        {
                            headers: {
                                'x-access-token': token
                            }
                        }
                    )
                );
            }

            // Check if exit time changed
            if (editingSession.exitTime && newExitDateTime && newExitDateTime !== formatDateTimeLocal(editingSession.exitTime)) {
                promises.push(
                    axios.post(
                        `${process.env.REACT_APP_API_URL}/work-status/update-work-status-date`,
                        {
                            entryId: editingSession.exitId,
                            newDate: new Date(newExitDateTime).toISOString()
                        },
                        {
                            headers: {
                                'x-access-token': token
                            }
                        }
                    )
                );
            }

            if (promises.length === 0) {
                setSnackbar({
                    open: true,
                    message: t('workHistoryTable:noChanges'),
                    severity: 'info'
                });
                return;
            }

            const responses = await Promise.all(promises);
            const allSuccess = responses.every(res => res.data.status === 'success');

            if (allSuccess) {
                setSnackbar({
                    open: true,
                    message: t('workHistoryTable:updateSuccess'),
                    severity: 'success'
                });
                setEditDialogOpen(false);
                setEditingSession(null);
                setNewEntryDateTime('');
                setNewExitDateTime('');

                // Call the parent component's update function if provided
                if (onSessionUpdate) {
                    onSessionUpdate();
                }
            }
        } catch (error) {
            console.error('Error updating work status:', error);
            const errorMessage = error.response?.data?.message || t('workHistoryTable:updateError');
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    };

    // Handle snackbar close
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    // Close dialog
    const handleCloseDialog = () => {
        setEditDialogOpen(false);
        setEditingSession(null);
        setNewEntryDateTime('');
        setNewExitDateTime('');
        setActiveTab(0);
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
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
                                        {canEditWorkHours && (
                                            <TableCell sx={{ fontWeight: 700 }}>{t('workHistoryTable:actions')}</TableCell>
                                        )}
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
                                            {canEditWorkHours && (
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEditClick(session)}
                                                        title={t('workHistoryTable:editSession')}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            )}
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

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {t('workHistoryTable:editWorkSession')}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                            <Tabs value={activeTab} onChange={handleTabChange} aria-label="work time tabs">
                                <Tab label={t('workHistoryTable:entryTime')} />
                                {editingSession?.exitTime && (
                                    <Tab label={t('workHistoryTable:exitTime')} />
                                )}
                            </Tabs>
                        </Box>
                        <Box sx={{ pt: 3 }}>
                            {activeTab === 0 && (
                                <TextField
                                    margin="dense"
                                    label={t('workHistoryTable:entryTime')}
                                    type="datetime-local"
                                    fullWidth
                                    value={newEntryDateTime}
                                    onChange={(e) => setNewEntryDateTime(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            )}
                            {activeTab === 1 && editingSession?.exitTime && (
                                <TextField
                                    margin="dense"
                                    label={t('workHistoryTable:exitTime')}
                                    type="datetime-local"
                                    fullWidth
                                    value={newExitDateTime}
                                    onChange={(e) => setNewExitDateTime(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            {t('workHistoryTable:cancel')}
                        </Button>
                        <Button onClick={handleUpdateWorkStatus} variant="contained" color="primary">
                            {t('workHistoryTable:save')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                        variant="filled"
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Paper>
        </Box>
    );
}
