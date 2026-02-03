
import React, { useState, useEffect } from 'react';

export const SidebarDetails = ({ project, siblings = [], onClose, onHide }) => {
    // State to track which proposal (project from the group) is currently viewed
    // Default to the passed project
    const [selectedProposal, setSelectedProposal] = useState(project);
    const [filterArtist, setFilterArtist] = useState(null);

    useEffect(() => {
        setSelectedProposal(project);
        setFilterArtist(null);
    }, [project]);

    if (!selectedProposal) return null;

    // Combine current project with siblings to get the full group
    // Filter duplicates just in case
    const allProposals = [project, ...siblings].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    // Sort by Status (Green > Red > Gray) then Representative name
    allProposals.sort((a, b) => {
        const getStatusScore = (p) => {
            const allGreen = p.members && p.members.length > 0 && p.members.every(m => m && m.submissionStatus === 'o');
            const hasRed = p.members && p.members.some(m => m && m.submissionStatus === 'x');
            if (allGreen) return 2;
            if (hasRed) return 1;
            return 0;
        };
        const scoreA = getStatusScore(a);
        const scoreB = getStatusScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA; // High score first

        const repA = a.representative || "";
        const repB = b.representative || "";
        return repA.localeCompare(repB);
    });

    const artistName = selectedProposal.sharedWith && selectedProposal.sharedWith.length > 0 ? selectedProposal.sharedWith[0] : null;

    const displayedProposals = filterArtist
        ? allProposals.filter(p => p.sharedWith?.includes(filterArtist))
        : allProposals;

    // Calculate D-Day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = selectedProposal.parsedDate || new Date();
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let dDayBadgeClass = "bg-gray-100 text-gray-700 border-gray-200";
    let dDayText = diffDays === 0 ? "D-Day" : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;

    if (diffDays <= 3 && diffDays >= 0) {
        dDayBadgeClass = "bg-red-100 text-red-700 border-red-200 animate-pulse";
    } else if (diffDays < 0) {
        dDayBadgeClass = "bg-slate-100 text-slate-500 border-slate-200";
        dDayText = "마감됨";
    }

    const handleKakaoShare = async () => {
        if (!selectedProposal) return;

        // Date Formatting MM/DD
        const dateObj = selectedProposal.parsedDate || new Date();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const deadlineStr = `${mm}/${dd}`;

        // Amount Formatting
        const rawAmt = selectedProposal.amount ? String(selectedProposal.amount).replace(/[^0-9]/g, '') : '0';
        const amt = rawAmt ? Number(rawAmt).toLocaleString() : '0';

        const pName = selectedProposal.projectName ? selectedProposal.projectName.replace(/\[협정\]/g, '').trim() : "제목 없음";
        let text = `<${selectedProposal.location || '-'}>\n`;
        text += `${pName} [${selectedProposal.noticeNumber}]\n`;
        text += `기초금액 : ${amt}\n`;
        text += `마감 : ${deadlineStr}\n`;
        text += `￣￣￣￣￣￣￣￣￣￣￣￣￣￣\n`;

        if (selectedProposal.members) {
            selectedProposal.members.forEach(m => {
                if (!m) return;
                // Format Share
                let shareStr = m.share;
                if (m.share) {
                    let val = parseFloat(m.share.toString().replace('%', ''));
                    if (!isNaN(val)) {
                        if (val <= 1.0) val = val * 100;
                        shareStr = `${val.toFixed(2)}%`;
                    }
                }
                // Format ID (000-00-00000)
                let idStr = m.businessNo;
                const cleanId = (m.businessNo || '').replace(/[^0-9]/g, '');
                if (cleanId.length === 10) {
                    idStr = `${cleanId.slice(0, 3)}-${cleanId.slice(3, 5)}-${cleanId.slice(5)}`;
                }

                const idPart = (idStr && idStr !== '-') ? `(${idStr})` : '';

                text += `${m.name}${idPart} ${shareStr}\n`;
            });
        }

        text += `￣￣￣￣￣￣￣￣￣￣￣￣￣￣\n`;
        text += `협정서 작성후 톡 부탁드립니다.`;

        try {
            await navigator.clipboard.writeText(text);
            alert("클립보드에 복사되었습니다. 📋\n\n카카오톡 채팅방을 열고 [Ctrl+V]를 눌러 붙여넣기 하세요.");
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert("복사에 실패했습니다.");
        }
    };

    return (
        <aside className="w-full md:w-[420px] h-[50vh] md:h-full bg-bg-surface border-t md:border-t-0 md:border-l border-[#e7ebf3] shadow-2xl flex flex-col overflow-hidden shrink-0 relative z-30">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#e7ebf3] flex items-start justify-between bg-white sticky top-0 z-10">
                {onHide ? (
                    <button
                        onClick={() => {
                            if (window.confirm("이 항목을 목록에서 숨기시겠습니까? (로컬 설정에 저장됩니다)")) {
                                onHide(selectedProposal.id);
                                onClose();
                            }
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                        title="이 공고 숨기기"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                ) : <div></div>}
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Clean Title Display */}
                <div className="flex flex-col gap-1">
                    <a
                        href={`https://bidding2.kr/bid/main-detail?num=${selectedProposal.noticeNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-bold text-text-main leading-snug break-keep line-clamp-2 hover:text-blue-600 hover:underline transition-colors cursor-pointer group"
                        title="공고 상세 보기"
                    >
                        {selectedProposal.projectName ? selectedProposal.projectName.replace(/\[협정\]/g, '').trim() : "제목 없음"}
                        <span className="material-symbols-outlined align-middle ml-1 text-lg opacity-0 group-hover:opacity-50 transition-opacity">open_in_new</span>
                    </a>
                </div>

                {/* Specific Layout: Client, Notice, Region, Price */}
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary shrink-0">발주처</span>
                        <span className="text-sm font-bold text-text-main text-right">{selectedProposal.client}</span>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary shrink-0">공고번호</span>
                        <span className="text-sm font-bold text-text-main font-mono text-right">{selectedProposal.noticeNumber}</span>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary shrink-0">지역</span>
                        <span className="text-sm font-bold text-text-main text-right">{selectedProposal.location || '-'}</span>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary shrink-0">기초금액</span>
                        <span className="text-base font-bold text-primary tracking-tight text-right">
                            {selectedProposal.amount ? Number(String(selectedProposal.amount).replace(/[^0-9]/g, '')).toLocaleString() : '0'} 원
                        </span>
                    </div>
                </div>

                <div className="h-px bg-gray-200 w-full"></div>

                {/* JV Members */}
                {selectedProposal.members && selectedProposal.members.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-text-main">협정구성현황</h3>
                                {artistName && (
                                    <button
                                        onClick={() => setFilterArtist(prev => prev === artistName ? null : artistName)}
                                        className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors border ${filterArtist === artistName
                                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                                    >
                                        {artistName}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Representative Selection Buttons */}
                        {allProposals.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {displayedProposals.map(p => {
                                    const isSelected = selectedProposal.id === p.id;

                                    // Color logic
                                    const allGreen = p.members && p.members.length > 0 && p.members.every(m => m && m.submissionStatus === 'o');
                                    const hasRed = p.members && p.members.some(m => m && m.submissionStatus === 'x');

                                    let colorClass = "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100";
                                    if (allGreen) colorClass = "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
                                    else if (hasRed) colorClass = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";

                                    if (isSelected) {
                                        if (allGreen) colorClass = "bg-green-100 text-green-800 border-green-500 ring-1 ring-green-500";
                                        else if (hasRed) colorClass = "bg-red-100 text-red-800 border-red-500 ring-1 ring-red-500";
                                        else colorClass = "bg-blue-50 text-blue-800 border-blue-500 ring-1 ring-blue-500";
                                    }

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedProposal(p)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${colorClass}`}
                                        >
                                            {p.representative}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="overflow-hidden rounded-lg border border-[#e7ebf3]">
                            <table className="w-full text-sm text-left table-fixed">
                                <thead className="bg-gray-50 text-xs text-text-secondary uppercase font-semibold border-b border-[#e7ebf3]">
                                    <tr>
                                        <th className="px-3 py-2 w-[50px] text-center">상태</th>
                                        <th className="px-3 py-2 text-left">업체명</th>
                                        <th className="px-3 py-2 w-[110px]">사업자번호</th>
                                        <th className="px-3 py-2 text-right w-[80px]">지분율</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e7ebf3]">
                                    {selectedProposal.members.map((member, idx) => {
                                        if (!member) return null;
                                        let formattedId = member.businessNo || '';
                                        const cleanId = formattedId.replace(/[^0-9]/g, '');
                                        if (cleanId.length === 10) {
                                            formattedId = `${cleanId.slice(0, 3)}-${cleanId.slice(3, 5)}-${cleanId.slice(5)}`;
                                        }

                                        let formattedShare = member.share;
                                        if (member.share) {
                                            let val = parseFloat(member.share.toString().replace('%', ''));
                                            if (!isNaN(val)) {
                                                if (val <= 1.0) val = val * 100;
                                                formattedShare = `${val.toFixed(2)}%`;
                                            }
                                        }

                                        let statusBadge = <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300"></span>;
                                        if (member.submissionStatus === 'o') statusBadge = <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>;
                                        else if (member.submissionStatus === 'x') statusBadge = <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>;

                                        return (
                                            <tr key={idx} className="bg-white">
                                                <td className="px-3 py-3 text-center">{statusBadge}</td>
                                                <td className="px-3 py-3 font-medium text-text-main truncate" title={member.name}>
                                                    {member.name}
                                                </td>
                                                <td className="px-3 py-3 text-gray-500 font-mono text-center tracking-tight text-xs">{formattedId}</td>
                                                <td className="px-3 py-3 text-right font-bold text-text-main">{formattedShare}</td>
                                            </tr>
                                        );
                                    })}
                                    {selectedProposal.members.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-4 text-center text-gray-400">구성원이 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                                {selectedProposal.members.length > 0 && (
                                    <tfoot className="bg-blue-50/50 font-bold text-text-main">
                                        <tr>
                                            <td className="px-4 py-2" colSpan={3}>합계</td>
                                            <td className="px-4 py-2 text-right text-primary">100%</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-[#e7ebf3] bg-white mt-auto">
                <button
                    onClick={handleKakaoShare}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#FEE500] text-[#3c1e1e] text-base font-bold hover:bg-[#ebd300] transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-xl">content_copy</span>
                    협정내용복사
                </button>
            </div>
        </aside>
    );
};
