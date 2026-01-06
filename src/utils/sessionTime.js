
export function splitByDay(sessions) {

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

    return splitSessions;
}

export function emloyeeSessionsSplitByDay(employees) {
    return employees.map((employee) => ({
        ...employee,
        sessions: splitByDay(employee.sessions)
    }));
}