import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { Chip, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import SessionTooltip from './SessionTooltip';

export default function CompanyUsersWorkTimelineChart({ employees }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { companyId } = useParams();
    const theme = useTheme();
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1000);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    if (!employees || employees.length === 0) return null;

    const handleUserClick = (userId) => {
        navigate(`/company/${companyId}/user/${userId}/work-history`);
    };

    // Tüm oturumlardan min ve max zaman değerlerini bul
    const allTimes = employees.flatMap(emp =>
        emp.sessions?.flatMap(s => [
            new Date(s.entryTime).getTime(),
            new Date(s.exitTime).getTime()
        ]) || []
    );

    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const timeRange = maxTime - minTime;

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(i18n.language, {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDisplayName = (employee) => {
        if (containerWidth < 600) {
            return `${employee.name} ${employee.surname?.[0] || ''}.`;
        }
        return `${employee.name} ${employee.surname}`;
    };


    const nameGap = 8;
    const rowHeight = 50;
    const topMargin = 30;
    const bottomMargin = 30;
    const chartHeight = employees.length * rowHeight + 60;
    const nameWidth = containerWidth < 600 ? 80 : 140;
    const isNarrow = containerWidth < 500;
    const leftMargin = isNarrow
        ? 20
        : Math.max(nameWidth + nameGap + 4, Math.min(150, containerWidth * 0.2));

    const isNarrowRight = containerWidth < 700;
    const rightMargin = isNarrowRight ? 20 : 100;
    const chartWidth = containerWidth - leftMargin - rightMargin;



    const getDurationX = (employee) => {
        if (!isNarrowRight) {
            return containerWidth - 10;
        }

        // Son session'ın bitişi
        const lastSession = employee.sessions?.[employee.sessions.length - 1];
        if (!lastSession) return containerWidth - 10;

        const endTime = new Date(lastSession.exitTime).getTime();
        const endX =
            leftMargin +
            ((endTime - minTime) / timeRange) * chartWidth;

        return Math.min(endX + 6, containerWidth - 10);
    };

    const formatSessionDuration = (minutes, availableWidth) => {
        if (minutes == null) return '';

        const useShort = availableWidth < 55;

        const hour = t(useShort ? 'common:hourShort' : 'common:hour');
        const minute = t(useShort ? 'common:minuteShort' : 'common:minute');

        if (minutes < 60) {
            return `${minutes} ${minute}`;
        }

        const h = Math.floor(minutes / 60);
        const m = minutes % 60;

        if (m > 0) {
            return `${h} ${hour} ${m} ${minute}`;
        }

        return `${h} ${hour}`;
    };



    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflowX: 'auto' }}>
            <svg width={containerWidth} height={chartHeight}>
                {/* Y Ekseni - Kullanıcı isimleri */}
                {employees.map((employee, idx) => (
                    <g key={employee.id}>
                        <foreignObject
                            x={
                                isNarrow
                                    ? leftMargin + 4          // grafik içi → değişmesin
                                    : leftMargin - nameWidth - nameGap
                            }
                            y={topMargin + idx * rowHeight + rowHeight / 2 - 13}
                            width={nameWidth}
                            height={32}
                        >
                            <Chip
                                label={getDisplayName(employee)}
                                size="small"
                                color="primary"
                                clickable
                                onClick={() => handleUserClick(employee.id)}
                                sx={{
                                    fontSize: 11,
                                    width: '100%',
                                    color: "palette.common.white",
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    cursor: 'pointer',
                                    opacity: isNarrow ? 0.85 : 1,
                                    boxShadow: isNarrow ? 'none' : '0 0 0 1px rgba(0,0,0,0.04)',
                                    backgroundColor: isNarrow
                                        ? theme.palette.primary.main
                                        : undefined
                                }}
                            />
                        </foreignObject>

                        {/* Toplam süre */}
                        <text
                            x={getDurationX(employee)}
                            y={topMargin + idx * rowHeight + rowHeight / 2}
                            textAnchor={isNarrowRight ? 'start' : 'end'}
                            dominantBaseline="middle"
                            fontSize={isNarrowRight ? 11 : 12}
                            fill={theme.palette.text.primary}
                            fontWeight="bold"
                            opacity={isNarrowRight ? 0.6 : 1}
                        >
                            {formatSessionDuration(employee.totalMinutes || 0, 40)}
                        </text>

                    </g>
                ))}

                {/* Grid çizgileri */}
                {employees.map((_, idx) => (
                    <line
                        key={idx}
                        x1={leftMargin}
                        y1={topMargin + idx * rowHeight}
                        x2={containerWidth - rightMargin}
                        y2={topMargin + idx * rowHeight}
                        stroke="#e0e0e0"
                        strokeWidth="1"
                    />
                ))}

                {/* Çalışma oturumları - Barlar */}
                {employees.map((employee, idx) => (
                    <g key={employee.id}>
                        {employee.sessions?.map((session, sessionIdx) => {
                            const startTime = new Date(session.entryTime).getTime();
                            const endTime = new Date(session.exitTime).getTime();
                            const startX = leftMargin + ((startTime - minTime) / timeRange) * chartWidth;
                            const width = ((endTime - startTime) / timeRange) * chartWidth;
                            const y = topMargin + idx * rowHeight + 10;
                            const height = rowHeight - 20;

                            const isSmallBar = width < 35;

                            return (
                                <g key={sessionIdx}>
                                    <rect
                                        x={startX}
                                        y={y}
                                        width={Math.max(width, 2)}
                                        height={height}
                                        fill={session.isOpen
                                            ? theme.palette.success.main
                                            : theme.palette.primary.main}
                                        opacity="0.8"
                                        rx="3"
                                        style={{ cursor: 'pointer' }}
                                        onMouseMove={(e) => {
                                            setTooltip({
                                                visible: true,
                                                x: e.clientX,
                                                y: e.clientY,
                                                data: {
                                                    employee,
                                                    session,
                                                    startTime: session.entryTime,
                                                    endTime: session.exitTime
                                                }
                                            });
                                        }}
                                        onMouseLeave={() => {
                                            setTooltip({ visible: false, x: 0, y: 0, data: null });
                                        }}
                                    />

                                    {/* ⏱️ Süre etiketi */}
                                    {!!session.durationMinutes && (
                                        <text
                                            x={startX + width / 2}
                                            y={isSmallBar ? y - 4 : y + height / 2}
                                            textAnchor="middle"
                                            dominantBaseline={isSmallBar ? 'auto' : 'middle'}
                                            fontSize="10"
                                            fontWeight="bold"
                                            fill={isSmallBar ? theme.palette.text.primary : '#fff'}
                                            pointerEvents="none"
                                        >
                                            {formatSessionDuration(session.durationMinutes, width)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                ))}

                {/* X Ekseni - Tarih etiketleri */}
                <line
                    x1={leftMargin}
                    y1={chartHeight - bottomMargin}
                    x2={containerWidth - rightMargin}
                    y2={chartHeight - bottomMargin}
                    stroke={theme.palette.divider}
                    strokeWidth="2"
                />
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const x = leftMargin + ratio * chartWidth;
                    const timestamp = minTime + ratio * timeRange;
                    return (
                        <g key={ratio}>
                            <line
                                x1={x}
                                y1={chartHeight - bottomMargin}
                                x2={x}
                                y2={chartHeight - bottomMargin + 5}
                                stroke={theme.palette.divider}
                                strokeWidth="2"
                            />
                            <text
                                x={x}
                                y={chartHeight - bottomMargin + 20}
                                textAnchor="middle"
                                fontSize="12"
                                fill={theme.palette.text.secondary}
                            >
                                {formatDate(timestamp)}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Tooltip */}
            {tooltip.visible && tooltip.data && ReactDOM.createPortal(
                <div
                    style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y - 10,
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'auto',
                        zIndex: 9999
                    }}
                >
                    <SessionTooltip
                        employee={tooltip.data.employee}
                        session={tooltip.data.session}
                        startTime={tooltip.data.startTime}
                        endTime={tooltip.data.endTime}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}