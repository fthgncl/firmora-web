import React from 'react';
import {Paper, Typography, Box, useTheme, Divider, Chip, Stack} from '@mui/material';
import {useTranslation} from "react-i18next";
import {Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis, ResponsiveContainer} from 'recharts';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import WorkIcon from '@mui/icons-material/Work';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function WorkTimelineChart({sessions, allowedDays}) {
    const theme = useTheme();
    const isNarrow = useMediaQuery(theme.breakpoints.down('sm'));
    const {t, i18n} = useTranslation(['workTimelineChart']);

    // Custom Rectangle component with gradient and shadow
    const CustomFillRectangle = (props) => {
        const isOpen = props.payload?.isOpen || false;
        const isAllowedDay = props.dataKey?.startsWith('allowedDay');

        let barColor;
        if (isAllowedDay) {
            barColor = theme.palette.error.main;
        } else if (isOpen) {
            barColor = theme.palette.success.main;
        } else {
            barColor = theme.palette.primary.main;
        }

        return <Rectangle {...props} fill={barColor} opacity={isAllowedDay ? 0.6 : 0.9}/>;
    };

    // Active bar style with enhanced hover effect
    const ActiveRectangle = (props) => {
        const isOpen = props.payload?.isOpen || false;
        const isAllowedDay = props.dataKey?.startsWith('allowedDay');

        let barColor;
        if (isAllowedDay) {
            barColor = theme.palette.error.main;
        } else if (isOpen) {
            barColor = theme.palette.success.main;
        } else {
            barColor = theme.palette.primary.main;
        }

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

        sessions.forEach((session) => {
            const entryDate = new Date(session.entryTime);
            const dateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

            if (!minDate || dateOnly < minDate) minDate = dateOnly;
            if (!maxDate || dateOnly > maxDate) maxDate = dateOnly;
        });

        // allowedDays tarihlerini de kontrol et
        if (allowedDays && allowedDays.length > 0) {
            allowedDays.forEach((allowedDay) => {
                const startDate = new Date(allowedDay.start_date);
                const endDate = new Date(allowedDay.end_date);
                const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

                if (!minDate || startDateOnly < minDate) minDate = startDateOnly;
                if (!maxDate || endDateOnly > maxDate) maxDate = endDateOnly;
            });
        }

        // Tüm tarihleri doldur
        if (minDate && maxDate) {
            const currentDate = new Date(maxDate);
            while (currentDate >= minDate) {
                const dateKey = currentDate.toLocaleDateString(i18n.language, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });

                if (!grouped[dateKey]) {
                    grouped[dateKey] = {
                        name: dateKey,
                        sessions: [],
                        allowedDays: [],
                        rawDate: new Date(currentDate)
                    };
                }

                currentDate.setDate(currentDate.getDate() - 1);
            }
        }

        // Oturumları ekle
        sessions.forEach((session) => {
            const entryDate = new Date(session.entryTime);
            const dateKey = entryDate.toLocaleDateString(i18n.language, {
                day: '2-digit',
                month: 'long',
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

        // allowedDays'i ekle
        if (allowedDays && allowedDays.length > 0) {
            allowedDays.forEach((allowedDay) => {
                const startDate = new Date(allowedDay.start_date);
                const endDate = new Date(allowedDay.end_date);

                // allowedDay'in başladığı günden bittiği güne kadar tüm günlere ekle
                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dateKey = currentDate.toLocaleDateString(i18n.language, {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    });

                    if (grouped[dateKey]) {
                        // Gün içinde başlangıç ve bitiş saatlerini hesapla
                        let dayStartHour = 0;
                        let dayEndHour = 24;

                        // İlk gün mü?
                        if (currentDate.toDateString() === startDate.toDateString()) {
                            dayStartHour = startDate.getHours() + startDate.getMinutes() / 60;
                        }

                        // Son gün mü?
                        if (currentDate.toDateString() === endDate.toDateString()) {
                            dayEndHour = endDate.getHours() + endDate.getMinutes() / 60;
                        }

                        grouped[dateKey].allowedDays.push({
                            range: [dayStartHour, dayEndHour],
                            description: allowedDay.description,
                            filesCount: allowedDay.filesCount,
                            startDate: allowedDay.start_date,
                            endDate: allowedDay.end_date
                        });
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                    currentDate.setHours(0, 0, 0, 0);
                }
            });
        }

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
                day.allowedDays.forEach((allowedDay, idx) => {
                    dayData[`allowedDay${idx}`] = allowedDay.range;
                    dayData[`allowedDay${idx}_meta`] = {
                        description: allowedDay.description,
                        filesCount: allowedDay.filesCount,
                        startDate: allowedDay.startDate,
                        endDate: allowedDay.endDate
                    };
                });
                return dayData;
            });
    };

    const chartData = prepareChartData();

    // Get maximum number of sessions in a day
    const getMaxSessions = () => {
        return Math.max(...chartData.map(day => {
            return Object.keys(day).filter(key => key.startsWith('session') && !key.endsWith('_meta')).length;
        }), 1);
    };

    // Get maximum number of allowed days in a day
    const getMaxAllowedDays = () => {
        return Math.max(...chartData.map(day => {
            return Object.keys(day).filter(key => key.startsWith('allowedDay') && !key.endsWith('_meta')).length;
        }), 0);
    };

    const maxSessions = getMaxSessions();
    const maxAllowedDays = getMaxAllowedDays();

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
                            let endHours = Math.floor(end);
                            let endMins = Math.round((end % 1) * 60);
                            while (endMins > 59) {
                                endMins -= 60;
                                endHours += 1;
                            }
                            const duration = Math.round((end - start) * 60);
                            const durationHours = Math.floor(duration / 60);
                            const durationMins = duration % 60;

                            // Get metadata for this session
                            const metaKey = `${entry.dataKey}_meta`;
                            const meta = entry.payload?.[metaKey];

                            const isAllowedDay = entry.dataKey?.startsWith('allowedDay');

                            return (
                                <Box key={index} sx={{mb: 0.5}}>
                                    <Typography variant="caption" display="block"
                                                sx={{color: entry.color, fontWeight: 600}}>
                                        {isAllowedDay ? '🚫 ' : ''}
                                        {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')} - {String(endHours).padStart(2, '0')}:{String(endMins).padStart(2, '0')}
                                        {' '}({durationHours} {t('common:hour')} {durationMins} {t('common:minute')})
                                    </Typography>
                                    {isAllowedDay && meta?.description && (
                                        <Typography variant="caption" display="block"
                                                    sx={{color: theme.palette.error.main, fontStyle: 'italic'}}>
                                            📝 {meta.description}
                                        </Typography>
                                    )}
                                    {isAllowedDay && meta?.filesCount > 0 && (
                                        <Typography variant="caption" display="block"
                                                    sx={{color: theme.palette.info.main, fontStyle: 'italic'}}>
                                            📎 {meta.filesCount} {t('common:files')}
                                        </Typography>
                                    )}
                                    {!isAllowedDay && meta?.entryNote && (
                                        <Typography variant="caption" display="block"
                                                    sx={{color: theme.palette.info.main, fontStyle: 'italic'}}>
                                            📝 {t('workTimelineChart:entry')}: {meta.entryNote}
                                        </Typography>
                                    )}
                                    {!isAllowedDay && meta?.exitNote && (
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
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isOpen).length;
    const completedSessions = totalSessions - activeSessions;
    const totalAllowedDays = allowedDays ? allowedDays.length : 0;
    const chartHeight = Math.max(650, chartData.length * 65);

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

                        {chartData.length > 0 && (
                            <Chip
                                label={`${chartData.length} ${t('workTimelineChart:days')}`}
                                variant="outlined"
                                size="small"
                            />
                        )}

                        <Chip
                            icon={<CheckCircleIcon/>}
                            label={`${completedSessions} ${t('workTimelineChart:completedSessions')}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />

                        {activeSessions > 0 && (
                            <Chip
                                icon={<WorkIcon/>}
                                label={t('accounts:working')}
                                color="success"
                                variant="outlined"
                                size="small"
                            />
                        )}

                        {totalAllowedDays > 0 && (
                            <Chip
                                icon={<RadioButtonCheckedIcon/>}
                                label={`${totalAllowedDays} ${t('workHistoryTable:allowed')}`}
                                color="error"
                                variant="outlined"
                                size="small"
                            />
                        )}
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
                    <Box sx={{width: '100%', height: chartHeight, minHeight: 400}}>
                        <ResponsiveContainer width="100%" height={chartHeight} minHeight={400}>
                            <BarChart
                                layout="vertical"
                                data={chartData}
                            >
                                <CartesianGrid
                                    strokeDasharray="6 6"
                                    stroke={theme.palette.divider}
                                    opacity={0.5}
                                />
                                <Tooltip
                                    content={<CustomTooltip/>}
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
                                    width={isNarrow ? 40 : 110}
                                    stroke="none"
                                    tick={{
                                        fill: theme.palette.text.primary,
                                        fontSize: isNarrow ? 11 : 12,
                                        fontWeight: 500,
                                        dx: isNarrow ? 35 : 0,   // 👈 yazıyı grafiğin içine it
                                        textAnchor: isNarrow ? 'start' : 'end'
                                    }}
                                    tickLine={false}
                                    axisLine={false}
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
                                {Array.from({length: maxAllowedDays}, (_, idx) => (
                                    <Bar
                                        key={`allowedDay${idx}`}
                                        dataKey={`allowedDay${idx}`}
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
