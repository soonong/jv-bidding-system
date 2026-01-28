
import React, { useRef, useState } from 'react';
import { User } from '../App';

interface HeaderProps {
    onRefresh: () => void;
    onOpenSettings: () => void;
    onOpenAccountSettings: () => void;
    isRefreshing: boolean;
    currentUser: User | null;
    onLogin: () => void;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, onOpenSettings, onOpenAccountSettings, isRefreshing, currentUser, onLogin, onLogout }) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7ebf3] bg-bg-surface px-6 py-3 shrink-0 z-50">
            <div className="flex items-center gap-4 text-[#0d121b]">
                <div className="flex items-center justify-center size-8 bg-primary/10 rounded-lg text-primary">
                    <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <h2 className="text-[#0d121b] text-lg font-bold leading-tight tracking-[-0.015em]">컨소 캘린더</h2>
            </div>

            <div className="flex flex-1 justify-end items-center gap-6">
                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg border border-primary text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
                        <span className="hidden sm:inline">{isRefreshing ? '업데이트 중...' : '새로고침'}</span>
                    </button>


                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    {currentUser ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                            >
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-7 h-7 rounded-full border border-gray-200"
                                />
                                <span className="text-sm font-semibold text-text-main hidden md:inline">{currentUser.name}</span>
                                <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                            </button>

                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-50">
                                            <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                                            <p className="text-sm font-bold text-text-main truncate">{currentUser.name}</p>
                                        </div>
                                        <button className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-gray-50 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg opacity-60">person</span>
                                            내 프로필
                                        </button>
                                        <button
                                            onClick={() => {
                                                onOpenAccountSettings();
                                                setShowProfileMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg opacity-60">settings</span>
                                            계정 설정
                                        </button>
                                        <div className="border-t border-gray-50 my-1"></div>
                                        <button
                                            onClick={() => { onLogout(); setShowProfileMenu(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">logout</span>
                                            로그아웃
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (null)}

                    <button className="flex items-center justify-center overflow-hidden rounded-lg h-9 w-9 bg-gray-100 text-text-main hover:bg-gray-200 transition-colors ml-2">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                    </button>

                    <button
                        onClick={onOpenSettings}
                        className="flex items-center justify-center h-9 px-3 bg-white border border-gray-200 text-text-main hover:bg-gray-50 rounded-lg transition-colors ml-2 font-bold text-sm shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px] mr-1">settings</span>
                        설정
                    </button>
                </div>
            </div>
        </header>
    );
}
