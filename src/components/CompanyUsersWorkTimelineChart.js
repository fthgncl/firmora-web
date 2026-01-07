import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {Chip} from "@mui/material";

export default function CompanyUsersWorkTimelineChart({ employees }) {
    const navigate = useNavigate();
    const { companyId } = useParams();
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1000);

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
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}s ${mins}dk`;
    };

    const rowHeight = 50;
    const leftMargin = 150;
    const topMargin = 30;
    const bottomMargin = 30;
    const rightMargin = 100;
    const chartHeight = employees.length * rowHeight + 60;
    const chartWidth = containerWidth - leftMargin - rightMargin;

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflowX: 'auto' }}>
            <svg width={containerWidth} height={chartHeight}>
                {/* Y Ekseni - Kullanıcı isimleri */}
                {employees.map((employee, idx) => (
                    <g key={employee.id}>
                        <foreignObject
                            x={leftMargin - 150}
                            y={topMargin + idx * rowHeight + rowHeight / 2 - 13}
                            width={140}
                            height={32}
                        >
                            <Chip
                                label={`${employee.name} ${employee.surname}`}
                                color="primary"
                                size="small"
                                clickable
                                onClick={() => handleUserClick(employee.id)}
                                sx={{
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'center',
                                }}
                            />
                        </foreignObject>

                        {/* Toplam süre */}
                        <text
                            x={containerWidth - 10}
                            y={topMargin + idx * rowHeight + rowHeight / 2}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fontSize="12"
                            fill="#666"
                            fontWeight="bold"
                        >
                            {formatDuration(employee.totalMinutes || 0)}
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

                            return (
                                <g key={sessionIdx}>
                                    <rect
                                        x={startX}
                                        y={y}
                                        width={Math.max(width, 2)}
                                        height={height}
                                        fill={session.isOpen ? "#82ca9d" : "#8884d8"}
                                        opacity="0.8"
                                        rx="3"
                                    />
                                    <title>
                                        {`${employee.name} ${employee.surname}\n${formatDate(startTime)} - ${formatDate(endTime)}\nSüre: ${formatDuration(session.durationMinutes)}\nDurum: ${session.isOpen ? 'Açık' : 'Kapalı'}`}
                                    </title>
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
                    stroke="#333"
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
                                stroke="#333"
                                strokeWidth="2"
                            />
                            <text
                                x={x}
                                y={chartHeight - bottomMargin + 20}
                                textAnchor="middle"
                                fontSize="12"
                                fill="#666"
                            >
                                {formatDate(timestamp)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}