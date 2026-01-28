
import React, { useState, useEffect } from 'react';

// Categories Definition
export const CATEGORY_GROUPS = {
    "일반건설": [
        "토건", "건축", "토목", "조경", "산업환경설비"
    ],
    "기타건설": [
        "전기", "통신", "전기소방", "기계소방", "전문소방",
        "기계설비성능점검", "번호찰", "문화재_기타", "문화재_조경", "문화재_보수단청",
        "산림사업_기타", "지하수", "숲가꾸기병해충", "산림토목", "도시림조성", "산림조합",
        "광해방지", "개인하수처리", "토양정화", "환경_기타",
        "신재생_기타", "신재생_태양", "신재생_지열", "소음진동", "대기방지", "수질방지",
        "골재채취", "옥외광고", "선박수리", "기타공사", "석면해체"
    ],
    "전문건설": [
        "지반조성포장", "토공", "포장", "보링그라우팅",
        "금속창호지붕", "금속구조물", "지붕판금",
        "도장습식방수석공", "도장", "습식방수", "석공",
        "조경식재시설물", "조경식재", "조경시설물",
        "수중준설", "수중", "준설",
        "승강기삭도", "승강기", "삭도",
        "기계가스설비", "기계설비", "가스1종", "가스난방", "가스2종", "가스3종", "난방1종", "난방2종", "난방3종",
        "실내건축", "철콘", "비계구조", "상하수도", "철도궤도", "철강구조물"
    ]
};

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCategories: string[];
    onUpdateCategories: (categories: string[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, selectedCategories, onUpdateCategories }) => {
    const [localSelected, setLocalSelected] = useState<string[]>(selectedCategories);

    useEffect(() => {
        if (isOpen) {
            setLocalSelected(selectedCategories);
        }
    }, [isOpen, selectedCategories]);

    const toggleCategory = (category: string) => {
        setLocalSelected(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleReset = () => {
        setLocalSelected([]);
    };

    const handleSave = () => {
        onUpdateCategories(localSelected);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">설정</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Section: 일반건설 (Left) */}
                        <div className="lg:w-1/4 space-y-4">
                            <div className="pb-2 border-b border-gray-100 mb-2">
                                <h3 className="font-bold text-gray-800">일반건설</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_GROUPS["일반건설"].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                                            ${localSelected.includes(cat)
                                                ? 'bg-green-50 text-green-700 border-green-500 ring-1 ring-green-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                                        `}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section: 기타건설 (Middle) ?? Image shows Left=Gen, Middle=Other, Right=Specialist? 
                            The user image has General(Left top), Other(Left bottom), Specialist(Right).
                            Let's follow the image layout roughly.
                        */}
                        <div className="lg:w-1/4 space-y-8">
                            {/* Re-rendering General here if we want exact layout? 
                                 No, I'll stick to logical columns or the grid the user showed.
                                 Image:
                                 Col 1: 일반건설 (Top), 기타건설 (Bottom)
                                 Col 2: 전문건설 (Full Height)
                             */}
                            {/* Since I'm using flex row, I can do Col 1 and Col 2. */}
                        </div>

                    </div>

                    {/* Revised Layout based on Image */}
                    <div className="flex flex-col lg:flex-row h-full gap-0 border border-gray-200 rounded-xl overflow-hidden">

                        {/* Left Column Container */}
                        <div className="lg:w-5/12 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
                            {/* General Construction */}
                            <div className="p-6 border-b border-gray-200 flex">
                                <div className="w-24 shrink-0 font-bold text-gray-700 pt-1.5">일반건설</div>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_GROUPS["일반건설"].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={`
                                                px-3 py-1.5 rounded text-sm transition-all border
                                                ${localSelected.includes(cat)
                                                    ? 'bg-white text-green-600 border-green-500 font-bold'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                                            `}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Other Construction */}
                            <div className="p-6 flex flex-1">
                                <div className="w-24 shrink-0 font-bold text-gray-700 pt-1.5">기타건설</div>
                                <div className="flex flex-wrap gap-2 content-start">
                                    {CATEGORY_GROUPS["기타건설"].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={`
                                                px-3 py-1.5 rounded text-sm transition-all border
                                                ${localSelected.includes(cat)
                                                    ? 'bg-white text-green-600 border-green-500 font-bold'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                                            `}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Specialist) */}
                        <div className="lg:w-7/12 p-6 flex bg-gray-50/30">
                            <div className="w-24 shrink-0 font-bold text-gray-700 pt-1.5">전문건설</div>
                            <div className="flex flex-wrap gap-2 content-start">
                                {CATEGORY_GROUPS["전문건설"].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`
                                            px-3 py-1.5 rounded text-sm transition-all border
                                            ${localSelected.includes(cat)
                                                ? 'bg-white text-green-600 border-green-500 font-bold'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                                        `}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/50">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-white text-gray-600 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        초기화
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};
