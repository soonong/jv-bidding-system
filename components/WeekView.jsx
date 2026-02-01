
import React from 'react';

export const WeekView = ({
    currentDate,
    projects,
    onSelectProject,
    selectedProjectId,
    onViewChange
}) => {
    // Generate week days (Sunday to Saturday around current Date)
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start Monday

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i - 1); // Adjust loop to start Sunday if needed, but let's do Mon-Sun or Sun-Sat. 
        // Screenshot shows Mon start usually in Korea, but let's stick to Sun start for consistency with Month view
        // Re-adjusting logic to standard Sun-Sat
        const sunday = new Date(currentDate);
        sunday.setDate(currentDate.getDate() - currentDate.getDay());
        const day = new Date(sunday);
        day.setDate(sunday.getDate() + i);
        weekDays.push(day);
    }

    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
            <div className="bg-white rounded-xl border border-[#e7ebf3] shadow-sm flex flex-col h-full overflow-hidden">

                {/* Unified Scroll Container */}
                <div className="flex-1 overflow-y-auto relative overflow-x-auto">
                    {/* Inner wrapper to enforce min-width and layout */}
                    <div className="min-w-[700px] md:min-w-0 min-h-full flex flex-col">

                        {/* Header Row - Sticky */}
                        <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-[#e7ebf3] bg-[#fcfcfd] shrink-0">
                            {weekDays.map((date, i) => (
                                <div key={i} className={`py-3 text-center border-r border-[#e7ebf3] last:border-r-0 ${date.toDateString() === new Date().toDateString() ? 'bg-blue-50/20' : ''}`}>
                                    <div className="text-xs font-semibold uppercase text-text-secondary tracking-wider">{dayLabels[date.getDay()]}</div>
                                    <div className={`text-lg font-bold mt-0.5 ${date.getDay() === 0 ? 'text-red-500' : 'text-text-main'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-7 flex-1 divide-x divide-[#e7ebf3]">
                            {weekDays.map((date, i) => {
                                const dayProjects = projects.filter(p =>
                                    p.parsedDate &&
                                    p.parsedDate.toDateString() === date.toDateString()
                                );

                                // Group projects by noticeNumber
                                const groupedProjects = dayProjects.reduce((acc, proj) => {
                                    const key = proj.noticeNumber || proj.projectName;
                                    if (!acc[key]) {
                                        acc[key] = [];
                                    }
                                    acc[key].push(proj);
                                    return acc;
                                }, {});

                                // Sort keys for consistent order (e.g. by Project Name)
                                const sortedKeys = Object.keys(groupedProjects).sort((a, b) => {
                                    const nameA = groupedProjects[a][0].projectName;
                                    const nameB = groupedProjects[b][0].projectName;
                                    return nameA.localeCompare(nameB, 'ko');
                                });

                                return (
                                    <div key={i} className={`flex flex-col p-2 gap-2 min-h-full ${date.toDateString() === new Date().toDateString() ? 'bg-blue-50/10' : ''}`}>
                                        {sortedKeys.map((key) => {
                                            const group = groupedProjects[key];
                                            const mainProject = group[0];
                                            const isSelected = selectedProjectId && group.some((p) => p.id === selectedProjectId);

                                            const colors = [
                                                { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-500', hover: 'hover:bg-emerald-100' },
                                                { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-500', hover: 'hover:bg-orange-100' },
                                                { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-500', hover: 'hover:bg-blue-100' },
                                                { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-400', hover: 'hover:bg-slate-200' },
                                                { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-500', hover: 'hover:bg-red-100' },
                                            ];
                                            const color = colors[Math.abs(mainProject.projectName.charCodeAt(0) % colors.length)] || colors[0];

                                            const cleanName = mainProject.projectName.replace(/\[협정\]/g, '').trim();
                                            const countLabel = group.length > 1 ? `(${group.length})` : '';

                                            return (
                                                <button
                                                    key={mainProject.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectProject(mainProject);
                                                    }}
                                                    className={`
                                                        w-full text-left text-xs px-2 py-2 rounded transition-all border-l-2 shadow-sm
                                                        ${color.bg} ${color.text} ${color.border} ${color.hover}
                                                        ${isSelected ? 'ring-2 ring-primary ring-offset-1 z-10' : ''}
                                                    `}
                                                >
                                                    <div className="font-medium line-clamp-2">
                                                        <span className="text-[11px] opacity-80 font-bold mr-1">{countLabel}</span>{cleanName}
                                                    </div>
                                                </button>
                                            );
                                        })}
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
