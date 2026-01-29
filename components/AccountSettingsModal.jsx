
import React, { useState, useEffect } from 'react';

export const AccountSettingsModal = ({ isOpen, onClose, currentUser, onUpdateUser }) => {
    const [aliases, setAliases] = useState([]);
    const [newAlias, setNewAlias] = useState('');

    useEffect(() => {
        if (currentUser && currentUser.aliases) {
            setAliases(currentUser.aliases);
        } else {
            setAliases([]);
        }
    }, [currentUser, isOpen]);

    if (!isOpen || !currentUser) return null;

    const handleAddAlias = () => {
        if (newAlias.trim()) {
            if (!aliases.includes(newAlias.trim())) {
                setAliases([...aliases, newAlias.trim()]);
            }
            setNewAlias('');
        }
    };

    const handleRemoveAlias = (aliasToRemove) => {
        setAliases(aliases.filter(a => a !== aliasToRemove));
    };

    const handleSave = () => {
        const updatedUser = { ...currentUser, aliases: aliases };
        onUpdateUser(updatedUser);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-text-main">계정 설정</h2>
                        <p className="text-xs text-text-secondary mt-0.5">공유자(별칭) 관리</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-12 h-12 rounded-full border border-gray-200"
                        />
                        <div>
                            <p className="font-bold text-text-main">{currentUser.name}</p>
                            <p className="text-sm text-text-secondary">@{currentUser.username}</p>
                        </div>
                    </div>

                    {/* Alias Management */}
                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2">
                            공유자 이름 관리
                            <span className="block text-xs font-normal text-text-secondary mt-1">
                                본인 이름 외에 엑셀 파일의 "공유자" 컬럼에 적힌 다른 이름이 있다면 추가해주세요. 해당 이름이 포함된 공고도 볼 수 있게 됩니다.
                            </span>
                        </label>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newAlias}
                                onChange={(e) => setNewAlias(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
                                placeholder="이름 입력 (예: 홍길동)"
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                            <button
                                onClick={handleAddAlias}
                                className="px-4 py-2 bg-gray-100 text-text-main text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                추가
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {aliases.map(alias => (
                                <span key={alias} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100 group">
                                    {alias}
                                    <button
                                        onClick={() => handleRemoveAlias(alias)}
                                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 text-blue-400 hover:text-blue-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </span>
                            ))}
                            {aliases.length === 0 && (
                                <p className="text-sm text-gray-400 italic py-2">등록된 추가 이름이 없습니다.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                    >
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
};
