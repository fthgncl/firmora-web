import React from 'react';
import {Paper, Typography, Box, useTheme} from '@mui/material';
import {useTranslation} from "react-i18next";
import {Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis, ResponsiveContainer} from 'recharts';

export default function WorkTimelineChart({sessions}) {
    const {t, i18n} = useTranslation();
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

    // Custom Rectangle component with MUI theme colors
    const CustomFillRectangle = (props) => {
        const isOpen = props.payload?.isOpen || false;
        const barColor = isOpen
            ? theme.palette.success.main
            : theme.palette.primary.main;
        return <Rectangle {...props} fill={barColor}/>;
    };

    // Active bar style with MUI theme
    const ActiveRectangle = (props) => {
        const isOpen = props.payload?.isOpen || false;
        const barColor = isOpen
            ? theme.palette.success.main
            : theme.palette.primary.main;
        return <Rectangle {...props} fill={barColor} stroke={theme.palette.warning.main} strokeWidth={2}/>;
    };

    // Transform sessions data for the chart
    const prepareChartData = () => {
        const grouped = {};

        splitSessions.forEach((session) => {
            const entryDate = new Date(session.entryTime);
            const dateKey = entryDate.toLocaleDateString(i18n.language, {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    name: dateKey,
                    sessions: [],
                    rawDate: new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
                };
            }

            const startHour = entryDate.getHours() + entryDate.getMinutes() / 60 + entryDate.getSeconds() / 3600;
            const exitDate = session.exitTime ? new Date(session.exitTime) : new Date();
            const endHour = exitDate.getHours() + exitDate.getMinutes() / 60 + exitDate.getSeconds() / 3600;

            grouped[dateKey].sessions.push({
                range: [startHour, endHour],
                isOpen: session.isOpen,
                entryTime: session.entryTime,
                exitTime: session.exitTime,
                duration: session.durationMinutes,
                isSegment: session.isSegment
            });
        });

        // Convert to array and add dynamic session keys
        return Object.values(grouped)
            .sort((a, b) => b.rawDate - a.rawDate)
            .map(day => {
                const dayData = { name: day.name };
                day.sessions.forEach((session, idx) => {
                    dayData[`session${idx}`] = session.range;
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
    const CustomTooltip = ({ active, payload }) => {
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
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, color: theme.palette.text.primary }}>
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

                            return (
                                <Typography key={index} variant="caption" display="block" sx={{ color: entry.color }}>
                                    {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')} - {String(endHours).padStart(2, '0')}:{String(endMins).padStart(2, '0')}
                                    {' '}({durationHours}h {durationMins}m)
                                </Typography>
                            );
                        }
                        return null;
                    })}
                </Box>
            );
        }
        return null;
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                {t('users:workTimeline', 'Çalışma Zaman Çizelgesi')}
            </Typography>
            <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 60)}>
                <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 100, bottom: 50 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <Tooltip content={<CustomTooltip />} shared={false} cursor={{ fill: theme.palette.action.hover }} />
                    <XAxis
                        type="number"
                        domain={[0, 24]}
                        ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                        tickFormatter={(value) => `${value}:00`}
                        height={50}
                        label={{ value: t('users:hours', 'Saat'), position: 'insideBottom', offset: -10 }}
                        stroke={theme.palette.text.secondary}
                        tick={{ fill: theme.palette.text.secondary }}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        stroke={theme.palette.text.secondary}
                        tick={{ fill: theme.palette.text.secondary }}
                    />
                    {Array.from({ length: maxSessions }, (_, idx) => (
                        <Bar
                            key={`session${idx}`}
                            dataKey={`session${idx}`}
                            stackId="a"
                            radius={8}
                            maxBarSize={35}
                            shape={CustomFillRectangle}
                            activeBar={ActiveRectangle}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    );
}
