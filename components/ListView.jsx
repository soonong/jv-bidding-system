
import React, { useMemo } from 'react';

export const ListView = ({
    projects,
    onSelectProject,
    selectedProjectId
}) => {
    // Filter projects starting from today (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingProjects = projects.filter(p => {
        if (!p.parsedDate) return false;
        const pDate = new Date(p.parsedDate);
        pDate.setHours(0, 0, 0, 0);
        return pDate.getTime() >= today.getTime();
    }).sort((a, b) => {
        // Sort by Date ASC
        const dateA = a.parsedDate ? a.parsedDate.getTime() : 0;
        const dateB = b.parsedDate ? b.parsedDate.getTime() : 0;
        return dateA - dateB;
    });

    // Grouping / Deduplication
    const uniqueProjects = useMemo(() => {
        const groups = new Map();
        upcomingProjects.forEach(p => {
            // Group by Notice Number if available, otherwise Project Name + Date
            const key = p.noticeNumber ? p.noticeNumber : `${p.projectName}_${p.parsedDate?.getTime()}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(p);
        });

        return Array.from(groups.values()).map(group => {
            const main = group[0];
            return { ...main, _count: group.length };
        }).sort((a, b) => {
            const dateA = a.parsedDate ? new Date(a.parsedDate).getTime() : 0;
            const dateB = b.parsedDate ? new Date(b.parsedDate).getTime() : 0;
            return dateA - dateB;
        });
    }, [upcomingProjects]);

    if (upcomingProjects.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white border border-[#e7ebf3] rounded-xl m-6">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-bold">예정된 입찰이 없습니다.</p>
                    <p className="text-sm">새로운 일정을 등록하거나 필터를 변경해보세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
            <div className="bg-white rounded-xl border border-[#e7ebf3] shadow-sm flex flex-col h-full overflow-hidden">
                <div className="overflow-y-auto flex-1 p-4 overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px] md:min-w-0">
                        <thead className="bg-gray-50 text-xs text-text-secondary uppercase font-semibold border-b border-[#e7ebf3] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 w-[120px]">날짜</th>
                                <th className="px-4 py-3 w-[60px] text-center">협정수</th>
                                <th className="px-4 py-3 w-[100px]">지역</th>
                                <th className="px-4 py-3">공사명</th>
                                <th className="px-4 py-3 w-[150px]">발주처</th>
                                <th className="px-4 py-3 text-right w-[120px]">기초금액</th>
                                <th className="px-4 py-3 text-center w-[80px]">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e7ebf3]">
                            {uniqueProjects.map((project) => {
                                const date = project.parsedDate || new Date();
                                const isSelected = selectedProjectId === project.id;
                                const count = project._count || 1;

                                // Status logic
                                const allGreen = project.members && project.members.length > 0 && project.members.every((m) => m && m.submissionStatus === 'o');
                                const hasRed = project.members && project.members.some((m) => m && m.submissionStatus === 'x');

                                let statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">미확인</span>;
                                if (allGreen) statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">완료</span>;
                                else if (hasRed) statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">진행중</span>;

                                return (
                                    <tr
                                        key={project.id}
                                        onClick={() => onSelectProject(project)}
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-medium text-text-main whitespace-nowrap">
                                            {date.toLocaleDateString()} ({['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})
                                        </td>
                                        <td className="px-4 py-3 font-bold text-primary text-center">
                                            {count > 1 ? count : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                                            {project.location || '-'}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-text-main">
                                            {project.projectName.replace(/\[협정\]/g, '').trim()}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {project.client}
                                        </td>
                                        <td className="px-4 py-3 text-right text-primary font-mono font-medium">
                                            {Number(project.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {statusBadge}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
