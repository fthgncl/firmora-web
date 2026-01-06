import React from 'react';
import {Paper, Typography, Box, useTheme, Divider, Chip, Stack} from '@mui/material';
import {useTranslation} from "react-i18next";
import {Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis, ResponsiveContainer} from 'recharts';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import WorkIcon from '@mui/icons-material/Work';

export default function WorkTimelineChart({sessions}) {
    const {t, i18n} = useTranslation(['workTimelineChart']);
    const theme = useTheme();

    // Split sessions by day (already done by parent, but keep logic here for reference)
    const splitSessions = [];

    sessions.forEach((session) => {
        const entryDate = new Date(session.entryTime);
        const exitDate = session.exitTime ? new Date(session.exitTime) : new Date();

        let currentStart = new Date(entryDate);

        while (currentStart < exitDate) {
            const endOfDay = new Date(currentStart);
            endOfDay.setHours(23, 59, 59, 999);

            const currentEnd = endOfDay < exitDate ? endOfDay : exitDate;

            const durationMinutes = Math.round(
                (currentEnd - currentStart) / (1000 * 60)
            );

            splitSessions.push({
                ...session,
                entryTime: new Date(currentStart),
                exitTime: new Date(currentEnd),
                durationMinutes
            });

            currentStart = new Date(currentEnd);
            currentStart.setHours(0, 0, 0, 0);
            currentStart.setDate(currentStart.getDate() + 1);
        }
    });

    // Custom Rectangle component with gradient and shadow
    const CustomFillRectangle = (props) => {
        const isOpen = props.payload?.isOpen || false;
        const barColor = isOpen
            ? theme.palette.success.main
            : theme.palette.primary.main;
        return <Rectangle {...props} fill={barColor} opacity={0.9}/>;
    };

    // Active bar style with enhanced hover effect
    const ActiveRectangle = (props) => {
        const isOpen = props.payload?.isOpen || false;
        const barColor = isOpen
            ? theme.palette.success.main
            : theme.palette.primary.main;
        return <Rectangle
            {...props}
            fill={barColor}
            stroke={theme.palette.warning.main}
            strokeWidth={3}
            opacity={1}
        />;
    };

    // Transform sessions data for the chart
    const prepareChartData = () => {
        const grouped = {};

        // İlk ve son tarihi bul
        let minDate = null;
        let maxDate = null;

        splitSessions.forEach((session) => {
            const entryDate = new Date(session.entryTime);
            const dateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

            if (!minDate || dateOnly < minDate) minDate = dateOnly;
            if (!maxDate || dateOnly > maxDate) maxDate = dateOnly;
        });

        // Tüm tarihleri doldur
        if (minDate && maxDate) {
            const currentDate = new Date(maxDate);
            while (currentDate >= minDate) {
                const dateKey = currentDate.toLocaleDateString(i18n.language, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });

                if (!grouped[dateKey]) {
                    grouped[dateKey] = {
                        name: dateKey,
                        sessions: [],
                        rawDate: new Date(currentDate)
                    };
                }

                currentDate.setDate(currentDate.getDate() - 1);
            }
        }

        // Oturumları ekle
        splitSessions.forEach((session) => {
            const entryDate = new Date(session.entryTime);
            const dateKey = entryDate.toLocaleDateString(i18n.language, {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            const startHour = entryDate.getHours() + entryDate.getMinutes() / 60 + entryDate.getSeconds() / 3600;
            const exitDate = session.exitTime ? new Date(session.exitTime) : new Date();
            const endHour = exitDate.getHours() + exitDate.getMinutes() / 60 + exitDate.getSeconds() / 3600;

            grouped[dateKey].sessions.push({
                range: [startHour, endHour],
                isOpen: session.isOpen,
                entryTime: session.entryTime,
                exitTime: session.exitTime,
                duration: session.durationMinutes,
                isSegment: session.isSegment,
                entryNote: session.entryNote,
                exitNote: session.exitNote
            });
        });

        // Convert to array and add dynamic session keys
        return Object.values(grouped)
            .sort((a, b) => b.rawDate - a.rawDate)
            .map(day => {
                const dayData = {name: day.name};
                day.sessions.forEach((session, idx) => {
                    dayData[`session${idx}`] = session.range;
                    dayData[`session${idx}_meta`] = {
                        isOpen: session.isOpen,
                        entryNote: session.entryNote,
                        exitNote: session.exitNote
                    };
                    dayData.isOpen = session.isOpen;
                });
                return dayData;
            });
    };

    const chartData = prepareChartData();

    // Get maximum number of sessions in a day
    const getMaxSessions = () => {
        return Math.max(...chartData.map(day => {
            return Object.keys(day).filter(key => key.startsWith('session')).length;
        }), 1);
    };

    const maxSessions = getMaxSessions();

    // Custom tooltip with MUI theme colors
    const CustomTooltip = ({active, payload}) => {
        if (active && payload && payload.length) {
            return (
                <Box sx={{
                    bgcolor: theme.palette.background.paper,
                    p: 1.5,
                    border: 1,
                    borderColor: theme.palette.divider,
                    borderRadius: 1,
                    boxShadow: theme.shadows[4]
                }}>
                    <Typography variant="body2" fontWeight="bold" sx={{mb: 0.5, color: theme.palette.text.primary}}>
                        {payload[0].payload.name}
                    </Typography>
                    {payload.map((entry, index) => {
                        if (entry.value && Array.isArray(entry.value)) {
                            const [start, end] = entry.value;
                            const hours = Math.floor(start);
                            const mins = Math.round((start % 1) * 60);
                            const endHours = Math.floor(end);
                            const endMins = Math.round((end % 1) * 60);
                            const duration = Math.round((end - start) * 60);
                            const durationHours = Math.floor(duration / 60);
                            const durationMins = duration % 60;

                            // Get metadata for this session
                            const metaKey = `${entry.dataKey}_meta`;
                            const meta = entry.payload?.[metaKey];

                            return (
                                <Box key={index} sx={{mb: 0.5}}>
                                    <Typography variant="caption" display="block"
                                                sx={{color: entry.color, fontWeight: 600}}>
                                        {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')} - {String(endHours).padStart(2, '0')}:{String(endMins).padStart(2, '0')}
                                        {' '}({durationHours} {t('common:hour')} {durationMins} {t('common:minute')})

                                    </Typography>
                                    {meta?.entryNote && (
                                        <Typography variant="caption" display="block"
                                                    sx={{color: theme.palette.info.main, fontStyle: 'italic'}}>
                                            📝 {t('workTimelineChart:entry')}: {meta.entryNote}
                                        </Typography>
                                    )}
                                    {meta?.exitNote && (
                                        <Typography variant="caption" display="block"
                                                    sx={{color: theme.palette.info.main, fontStyle: 'italic'}}>
                                            📝 {t('workTimelineChart:exit')}: {meta.exitNote}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        }
                        return null;
                    })}
                </Box>
            );
        }
        return null;
    };

    // Calculate total stats
    const totalSessions = splitSessions.length;
    const activeSessions = splitSessions.filter(s => s.isOpen).length;
    const completedSessions = totalSessions - activeSessions;

    return (
        <Box sx={{display: 'flex', justifyContent: 'center', width: '100%'}}>
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
                {/* Header Section */}
                <Box sx={{mb: 3}}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{mb: 2}}>
                        <AccessTimeIcon sx={{fontSize: 28, color: theme.palette.primary.main}}/>
                        <Typography variant="h5" fontWeight="bold" sx={{color: theme.palette.text.primary}}>
                            {t('workTimelineChart:title')}
                        </Typography>
                    </Stack>

                    {/* Stats Chips */}
                    <Stack direction="row" spacing={2} sx={{mb: 2}}>
                        <Chip
                            icon={<CheckCircleIcon/>}
                            label={`${completedSessions} ${t('workTimelineChart:completedSessions')}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                        <Chip

                            icon={<WorkIcon/>}
                            label={`${activeSessions} ${t('workTimelineChart:activeWorkPeriod')}`}
                            color="success"
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            icon={<RadioButtonCheckedIcon/>}
                            label={`X ${t('workTimelineChart:paidLeave')}`} // TODO: İzinli gün sayısını ekle
                            color="error"
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            label={`${chartData.length} ${t('workTimelineChart:days')}`}
                            variant="outlined"
                            size="small"
                        />
                    </Stack>

                    <Divider sx={{mt: 2}}/>
                </Box>

                {/* Chart Section */}
                <Box sx={{
                    bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2,
                    p: 2,
                    width: '100%'
                }}>
                    <Box sx={{width: '100%', height: Math.max(650, chartData.length * 65)}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={theme.palette.divider}
                                    opacity={0.5}
                                />
                                <Tooltip
                                    content={<CustomTooltip/>}
                                    shared={false}
                                    cursor={{
                                        fill: theme.palette.action.hover,
                                        opacity: 0.3
                                    }}
                                />
                                <XAxis
                                    type="number"
                                    domain={[0, 24]}
                                    ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                                    tickFormatter={(value) => `${value}:00`}
                                    height={60}
                                    label={{
                                        value: t('workTimelineChart:hours'),
                                        position: 'insideBottom',
                                        offset: -15,
                                        style: {
                                            fill: theme.palette.text.primary,
                                            fontWeight: 600,
                                            fontSize: 14
                                        }
                                    }}
                                    stroke={theme.palette.text.secondary}
                                    tick={{
                                        fill: theme.palette.text.secondary,
                                        fontSize: 12
                                    }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={110}
                                    stroke={theme.palette.text.secondary}
                                    tick={{
                                        fill: theme.palette.text.primary,
                                        fontSize: 12,
                                        fontWeight: 500
                                    }}
                                />
                                {Array.from({length: maxSessions}, (_, idx) => (
                                    <Bar
                                        key={`session${idx}`}
                                        dataKey={`session${idx}`}
                                        stackId="a"
                                        radius={[10, 10, 10, 10]}
                                        maxBarSize={40}
                                        shape={CustomFillRectangle}
                                        activeBar={ActiveRectangle}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
