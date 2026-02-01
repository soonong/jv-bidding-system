
import React, { useMemo } from 'react';

export const MonthView = ({
    currentDate,
    projects,
    onSelectProject,
    selectedProjectId,
    onViewChange
}) => {

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

        const days = [];

        // Padding for prev month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({
                date: new Date(year, month, -startDayOfWeek + 1 + i).getDate(),
                isCurrentMonth: false,
                fullDate: new Date(year, month, -startDayOfWeek + 1 + i),
                projects: []
            });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dayProjects = projects.filter(p =>
                p.parsedDate &&
                p.parsedDate.getDate() === i &&
                p.parsedDate.getMonth() === month &&
                p.parsedDate.getFullYear() === year
            );

            days.push({
                date: i,
                isCurrentMonth: true,
                fullDate: date,
                projects: dayProjects
            });
        }

        // Padding for next month (Always ensure 42 cells for 6 rows)
        const totalCells = 42;
        const remaining = totalCells - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: i,
                isCurrentMonth: false,
                fullDate: new Date(year, month + 1, i),
                projects: []
            });
        }

        return days;
    }, [currentDate, projects]);

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
            <div className="bg-white rounded-xl border border-[#e7ebf3] shadow-sm flex flex-col h-full overflow-hidden">

                {/* Unified Scroll Container */}
                <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 relative">
                    {/* Inner wrapper to enforce min-width and layout */}
                    <div className="min-w-[1400px] md:min-w-0 min-h-full flex flex-col">

                        {/* Header Row - Sticky */}
                        <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-[#e7ebf3] bg-[#fcfcfd] shrink-0">
                            {weekDays.map((day) => (
                                <div key={day} className="py-3 text-center text-xs font-semibold uppercase text-text-secondary tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-[#e7ebf3]">
                            {calendarDays.map((day, idx) => {
                                // Group projects by noticeNumber
                                const groupedProjects = day.projects.reduce((acc, proj) => {
                                    const key = proj.noticeNumber || proj.projectName;
                                    if (!acc[key]) {
                                        acc[key] = [];
                                    }
                                    acc[key].push(proj);
                                    return acc;
                                }, {});

                                return (
                                    <div
                                        key={`${day.isCurrentMonth}-${day.date}-${idx}`}
                                        className={`
                                            min-h-[150px] p-2 flex flex-col gap-1 transition-colors relative group
                                            ${!day.isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-blue-50/10'}
                                            ${day.fullDate.toDateString() === new Date().toDateString() ? 'bg-blue-50/20' : ''}
                                        `}
                                    >
                                        <span className={`
                                            text-sm font-medium mb-1
                                            ${!day.isCurrentMonth ? 'text-text-secondary/40' : 'text-text-main'}
                                            ${day.fullDate.getDay() === 0 ? 'text-red-500' : ''}
                                            ${day.fullDate.getDay() === 6 ? 'text-blue-500' : ''}
                                        `}>
                                            {day.date}
                                        </span>

                                        <div className="flex flex-col gap-1">
                                            {Object.entries(groupedProjects)
                                                .sort(([, a], [, b]) => {
                                                    const listA = a;
                                                    const listB = b;

                                                    // 1. Color Rank (Red 0, Gray 1, Green 2, None 3)
                                                    const getRank = (list) => {
                                                        const hasMembers = list.some(p => p.members.length > 0);
                                                        if (!hasMembers) return 3;

                                                        const hasRed = list.some(p => p.members.some(m => m.submissionStatus === 'x'));
                                                        if (hasRed) return 0;

                                                        const allGreen = list.every(p => p.members.length > 0 && p.members.every(m => m.submissionStatus === 'o'));
                                                        if (allGreen) return 2;

                                                        return 1; // Gray
                                                    };

                                                    const rankA = getRank(listA);
                                                    const rankB = getRank(listB);
                                                    if (rankA !== rankB) return rankA - rankB;

                                                    // 2. Count Rank (Descending)
                                                    const lenDiff = listB.length - listA.length;
                                                    if (lenDiff !== 0) return lenDiff;

                                                    // 3. Amount Rank (Descending)
                                                    const getAmt = (list) => {
                                                        const p = list.find(x => x.amount) || list[0];
                                                        return parseFloat((p.amount || "0").replace(/[^0-9]/g, '')) || 0;
                                                    };
                                                    return getAmt(listB) - getAmt(listA);
                                                })
                                                .map(([key, val]) => {
                                                    const group = val;
                                                    const mainProject = group[0];
                                                    const isSelected = selectedProjectId && group.some((p) => p.id === selectedProjectId);

                                                    // Status-based coloring (Group Level)
                                                    const hasMembers = group.some(p => p.members.length > 0);
                                                    const hasRed = group.some(p => p.members.some(m => m.submissionStatus === 'x'));
                                                    const allGreen = hasMembers && group.every(p => p.members.length > 0 && p.members.every(m => m.submissionStatus === 'o'));

                                                    let color = { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400', hover: 'hover:bg-gray-200' };

                                                    if (!hasMembers) {
                                                        color = { bg: 'bg-white', text: 'text-gray-500', border: 'border-gray-200', hover: 'hover:bg-gray-50' };
                                                    } else if (hasRed) {
                                                        color = { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-500', hover: 'hover:bg-red-100' };
                                                    } else if (allGreen) {
                                                        color = { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', hover: 'hover:bg-green-200' };
                                                    }

                                                    const date = mainProject.parsedDate || new Date();
                                                    const now = new Date();
                                                    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                    const isUrgent = diff <= 3 && diff >= 0;

                                                    const cleanName = mainProject.projectName.replace(/\[협정\]/g, '').trim();
                                                    const countLabel = hasMembers ? `(${group.length})` : '';

                                                    return (
                                                        <button
                                                            key={mainProject.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelectProject(mainProject);
                                                            }}
                                                            className={`
                                                            w-full text-left text-xs px-2 py-1.5 rounded transition-all border-l-2
                                                            ${color.bg} ${color.text} ${color.border} ${color.hover}
                                                            ${isSelected ? 'ring-2 ring-primary ring-offset-1 z-10' : ''}
                                                        `}
                                                        >
                                                            <div className="flex justify-between items-start gap-1">
                                                                <span className="font-medium line-clamp-2 whitespace-normal break-words leading-tight">
                                                                    <span className="text-[11px] text-blue-600 font-bold mr-1 bg-white px-1 rounded border border-blue-200 inline-block mb-0.5">{countLabel}</span>
                                                                    {cleanName}
                                                                </span>
                                                                {isUrgent && (
                                                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mt-1.5"></span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
