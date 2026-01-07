import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function SessionTooltip({ employee, session, startTime, endTime }) {
    const theme = useTheme();
    const { t } = useTranslation(['workTimelineChart']);

    const formatTime = (date) => {
        const hours = date.getHours();
        const mins = date.getMinutes();
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} ${t('common:hour')} ${mins} ${t('common:minute')}`;
    };

    const entryDate = new Date(startTime);
    const exitDate = new Date(endTime);

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
                        ● {t('workTimelineChart:activeWorkPeriod')}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
