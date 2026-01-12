import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { BlockOutlined, DescriptionOutlined, AttachFileOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function SessionTooltip({ employee, session, allowedDay, startTime, endTime }) {
    const theme = useTheme();
    const { t, i18n } = useTranslation(['workTimelineChart']);

    const formatTime = (date) => {
        const hours = date.getHours();
        const mins = date.getMinutes();
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const formatDateTime = (date) => {
        const dateStr = date.toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const timeStr = formatTime(date);
        return `${dateStr} ${timeStr}`;
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} ${t('common:hour')} ${mins} ${t('common:minute')}`;
    };

    const entryDate = new Date(startTime);
    const exitDate = new Date(endTime);

    // allowedDay için tooltip
    if (allowedDay) {
        return (
            <Box sx={{
                bgcolor: theme.palette.background.paper,
                p: 1.5,
                border: 1,
                borderColor: theme.palette.error.main,
                borderRadius: 1,
                boxShadow: theme.shadows[4],
                minWidth: 200
            }}>
                {employee && (
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, color: theme.palette.text.primary }}>
                        {employee.name} {employee.surname}
                    </Typography>
                )}
                <Box sx={{ mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BlockOutlined sx={{ fontSize: 16, color: theme.palette.error.main }} />
                        <Typography variant="caption" display="block"
                            sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                            {t('workTimelineChart:allowed')}
                        </Typography>
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                        {formatDateTime(entryDate)}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                        {formatDateTime(exitDate)}
                    </Typography>
                    {allowedDay.description && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <DescriptionOutlined sx={{ fontSize: 14, color: theme.palette.info.main }} />
                            <Typography variant="caption" display="block"
                                sx={{ color: theme.palette.info.main, fontStyle: 'italic' }}>
                                {allowedDay.description}
                            </Typography>
                        </Box>
                    )}
                    {allowedDay.filesCount > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <AttachFileOutlined sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                            <Typography variant="caption" display="block"
                                sx={{ color: theme.palette.text.secondary }}>
                                {allowedDay.filesCount} dosya
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    }

    // session için tooltip
    return (
        <Box sx={{
            bgcolor: theme.palette.background.paper,
            p: 1.5,
            border: 1,
            borderColor: theme.palette.divider,
            borderRadius: 1,
            boxShadow: theme.shadows[4],
            minWidth: 200
        }}>
            {employee && (
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, color: theme.palette.text.primary }}>
                    {employee.name} {employee.surname}
                </Typography>
            )}
            <Box sx={{ mb: 0.5 }}>
                <Typography variant="caption" display="block"
                    sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                    {formatTime(entryDate)} - {formatTime(exitDate)}
                    {' '}({formatDuration(session.durationMinutes)})
                </Typography>
                {session.entryNote && (
                    <Typography variant="caption" display="block"
                        sx={{ color: theme.palette.info.main, fontStyle: 'italic', mt: 0.5 }}>
                        📝 {t('workTimelineChart:entry')}: {session.entryNote}
                    </Typography>
                )}
                {session.exitNote && (
                    <Typography variant="caption" display="block"
                        sx={{ color: theme.palette.info.main, fontStyle: 'italic', mt: 0.5 }}>
                        📝 {t('workTimelineChart:exit')}: {session.exitNote}
                    </Typography>
                )}
                {session.isOpen && (
                    <Typography variant="caption" display="block"
                        sx={{ color: theme.palette.success.main, fontWeight: 600, mt: 0.5 }}>
                        ● {t('accounts:working')}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
