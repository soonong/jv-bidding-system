
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { SidebarDetails } from './components/SidebarDetails';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { ListView } from './components/ListView';
import { LoginPage } from './components/LoginPage';
import { SettingsModal } from './components/SettingsModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';

import { fetchBiddingData, fetchAndDownloadRawData } from './utils/apiService';
import dbData from './db.json';

// Helper to parse db data
const loadInitialData = () => {
    const processItems = (items) => {
        return items.map((item) => ({
            ...item,
            parsedDate: new Date(item.parsedDate || item.deadline),
            // Polyfill new required fields from legacy ones
            name: item.name || item.projectName || "제목 없음",
            noticeNo: item.noticeNo || item.noticeNumber || "Unknown",
            projectName: item.projectName || item.name,
            noticeNumber: item.noticeNumber || item.noticeNo,
            amount: item.amount || item.price,
            price: item.price || item.amount
        }));
    };

    const saved = localStorage.getItem('jv-bidding-projects');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return processItems(parsed);
        } catch (e) {
            console.error("Failed to load from local storage", e);
        }
    }

    return processItems(dbData);
};

function Dashboard() {
    const [projects, setProjects] = useState(loadInitialData());
    const [selectedProject, setSelectedProject] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

    // Filters
    const [selectedCategories, setSelectedCategories] = useState(() => {
        const saved = localStorage.getItem('jv-selected-categories');
        return saved ? JSON.parse(saved) : [];
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Check login session (mock)
    useEffect(() => {
        const savedUser = localStorage.getItem('jv-user');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }
    }, []);

    // Sync URL with view
    useEffect(() => {
        if (!currentUser) return;
        if (location.pathname === '/week') {
            setView('week');
        } else if (location.pathname === '/list') {
            setView('list');
        } else {
            setView('month');
        }
    }, [location, currentUser]);

    // Save projects
    useEffect(() => {
        localStorage.setItem('jv-bidding-projects', JSON.stringify(projects));
    }, [projects]);

    const handleUpdateCategories = (cats) => {
        setSelectedCategories(cats);
        localStorage.setItem('jv-selected-categories', JSON.stringify(cats));
    };

    const handleUpdateUser = (updatedUser) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('jv-user', JSON.stringify(updatedUser));
    };

    const handleViewChange = (newView) => {
        setView(newView);
        if (newView === 'month') navigate('/');
        else if (newView === 'week') navigate('/week');
        else if (newView === 'list') navigate('/list');
    };



    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const newProjects = await fetchBiddingData();

            if (newProjects.length > 0) {
                // Merge logic: Combine new API date with existing local modifications if needed?
                // For now, replacing strictly with API source as "Truth". 
                // However, we might want to preserve user-local "sharedWith" permissions if we want that to persist.

                // Let's implement a simple merge for 'sharedWith' if the project ID/NoticeNo matches.
                // Or simply default to "All visible to me"? 
                // The API seems to filter by 'moduleKey', so maybe all are mine?

                // Let's assume all fetched projects are relevant.
                // We'll Assign basic permission to current user so they can see them immediately.

                const accessibleProjects = newProjects.map(p => ({
                    ...p,
                    // Auto-share with current user so it appears in the list
                    sharedWith: currentUser ? [
                        currentUser.name,
                        currentUser.username,
                        ...(currentUser.aliases || [])
                    ] : []
                }));

                setProjects(accessibleProjects);
                alert(`${accessibleProjects.length}개의 최신 데이터로 업데이트되었습니다.`);
            } else {
                alert("가져올 데이터가 없습니다.");
            }

            // Ask user if they want to download the raw file for debugging
            if (window.confirm("API 원본 데이터(JSON)를 다운로드하여 확인하시겠습니까?")) {
                await fetchAndDownloadRawData();
            }

        } catch (error) {
            console.error("Failed to refresh data", error);
            const msg = error.message || "알 수 없는 오류";
            alert(`데이터 업데이트 실패: ${msg}\n\n(개발자 도구(F12)의 Console 탭을 확인해주세요.)`);

            // Optionally offer download on error too
            if (window.confirm("오류가 발생했습니다. 원본 데이터를 다운로드하여 확인하시겠습니까?")) {
                await fetchAndDownloadRawData();
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDateChange = (direction) => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (view === 'week') {
            newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        }
        setCurrentDate(newDate);
    };

    const handleLogin = (user) => {
        setCurrentUser(user);
        localStorage.setItem('jv-user', JSON.stringify(user));
        setCurrentDate(new Date());
    };

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            setCurrentUser(null);
            localStorage.removeItem('jv-user');
        }
    };

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    // Filter projects
    const visibleProjects = projects.filter(p => {
        // 1. Permission Filter
        if (!p.sharedWith) return false;
        let hasPermission = false;
        if (p.sharedWith.includes(currentUser.name)) hasPermission = true;
        else if (p.sharedWith.includes(currentUser.username)) hasPermission = true;
        else if (currentUser.aliases && currentUser.aliases.some(alias => p.sharedWith.includes(alias))) hasPermission = true;

        if (!hasPermission) return false;

        // 2. Category Filter
        if (selectedCategories.length > 0) {
            const name = p.projectName;
            const matchesCategory = selectedCategories.some(cat => name.includes(cat));
            if (!matchesCategory) return false;
        }

        // 3. Status Filter (New)
        if (filterStatus === 'ongoing') {
            // "괄호 있는 것들만" -> Has Members
            if (!p.members || p.members.length === 0) return false;
        } else if (filterStatus === 'completed') {
            // "녹색만" -> All Members Green
            const isGreen = p.members && p.members.length > 0 && p.members.every(m => m.submissionStatus === 'o');
            if (!isGreen) return false;
        }

        // 4. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesName = p.projectName.toLowerCase().includes(q);
            const matchesNotice = p.noticeNumber?.toLowerCase().includes(q);
            const matchesClient = p.client?.toLowerCase().includes(q);
            const matchesRep = p.representative?.toLowerCase().includes(q);
            const matchesMember = p.members?.some(m => m.name.toLowerCase().includes(q) || m.contact?.toLowerCase().includes(q));

            if (!matchesName && !matchesNotice && !matchesClient && !matchesRep && !matchesMember) return false;
        }

        return true;
    });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <Header
                onRefresh={handleRefresh}

                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
                isRefreshing={isRefreshing}
                currentUser={currentUser}
                onLogin={() => { }}
                onLogout={handleLogout}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                selectedCategories={selectedCategories}
                onUpdateCategories={handleUpdateCategories}
            />

            <AccountSettingsModal
                isOpen={isAccountSettingsOpen}
                onClose={() => setIsAccountSettingsOpen(false)}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
            />

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
                <main className="flex-1 flex flex-col h-full min-w-0 bg-[#f8f9fc]">
                    {/* Toolbar */}
                    <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
                        {/* Left Side: Arrows & Title */}
                        <div className="flex items-center gap-4">
                            {/* Arrows - Moved back to Left */}
                            <div className="flex items-center bg-white rounded-lg border border-[#e7ebf3] p-1 shadow-sm">
                                <button
                                    onClick={() => handleDateChange('prev')}
                                    disabled={view === 'list'}
                                    className="p-1 hover:bg-gray-100 rounded text-text-secondary hover:text-text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button
                                    onClick={() => handleDateChange('next')}
                                    disabled={view === 'list'}
                                    className="p-1 hover:bg-gray-100 rounded text-text-secondary hover:text-text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>

                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold text-text-main leading-none whitespace-nowrap">
                                    {view === 'list' ? '전체 일정 목록' : `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
                                    {view === 'week' ? ' (주간)' : ''}
                                </h1>
                            </div>
                        </div>

                        {/* Right Side: Filters, Views, Search */}
                        <div className="flex items-center gap-4">
                            {/* Filters */}
                            <div className="hidden lg:flex items-center p-1 bg-white border border-[#e7ebf3] rounded-lg shadow-sm gap-1">
                                <button
                                    onClick={() => setFilterStatus('all')}
                                    className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${filterStatus === 'all' ? 'bg-slate-700 text-white' : 'text-text-secondary hover:bg-gray-50'}`}
                                >
                                    전체보기
                                </button>
                                <button
                                    onClick={() => setFilterStatus('ongoing')}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${filterStatus === 'ongoing' ? 'bg-orange-100 text-orange-800 font-bold shadow-sm' : 'text-text-secondary hover:bg-orange-50 hover:text-orange-700'}`}
                                >
                                    진행중
                                </button>
                                <button
                                    onClick={() => setFilterStatus('completed')}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${filterStatus === 'completed' ? 'bg-green-100 text-green-800 font-bold shadow-sm' : 'text-text-secondary hover:bg-green-50 hover:text-green-700'}`}
                                >
                                    완료
                                </button>
                            </div>

                            <div className="w-px h-8 bg-gray-200 hidden lg:block"></div>

                            {/* View Toggles [Month | Week | Today] */}
                            <div className="flex items-center gap-3">
                                <div className="flex bg-gray-200 rounded-lg p-1 gap-1">
                                    <button
                                        onClick={() => handleViewChange('month')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === 'month' ? 'bg-white shadow-sm text-text-main font-semibold' : 'text-text-secondary hover:bg-white/50'}`}
                                    >
                                        월간
                                    </button>
                                    <button
                                        onClick={() => handleViewChange('week')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === 'week' ? 'bg-white shadow-sm text-text-main font-semibold' : 'text-text-secondary hover:bg-white/50'}`}
                                    >
                                        주간
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-3 py-1 rounded text-sm font-medium transition-colors text-text-secondary hover:bg-white/50"
                                    >
                                        오늘
                                    </button>
                                </div>

                                {/* List View Button */}
                                <button
                                    onClick={() => handleViewChange('list')}
                                    className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors border border-[#e7ebf3] ${view === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-text-main hover:bg-gray-50'}`}
                                >
                                    목록
                                </button>

                                {/* Search Input - Moved to Far Right and Widened */}
                                <div className="relative hidden md:block">
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                    <input
                                        type="text"
                                        placeholder="검색"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 h-9 text-sm bg-white border border-[#e7ebf3] rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-[210px] transition-all shadow-sm focus:w-[315px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {view === 'month' ? (
                        <MonthView
                            currentDate={currentDate}
                            projects={visibleProjects}
                            onSelectProject={setSelectedProject}
                            selectedProjectId={selectedProject?.id}
                            onViewChange={handleViewChange}
                        />
                    ) : view === 'week' ? (
                        <WeekView
                            currentDate={currentDate}
                            projects={visibleProjects}
                            onSelectProject={setSelectedProject}
                            selectedProjectId={selectedProject?.id}
                            onViewChange={handleViewChange}
                        />
                    ) : (
                        <ListView
                            projects={visibleProjects}
                            onSelectProject={setSelectedProject}
                            selectedProjectId={selectedProject?.id}
                        />
                    )}
                </main>

                {selectedProject && (
                    <SidebarDetails
                        project={selectedProject}
                        siblings={visibleProjects.filter(p =>
                            p.id !== selectedProject.id &&
                            (p.noticeNumber === selectedProject.noticeNumber && p.noticeNumber !== "")
                        )}
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/*" element={<Dashboard />} />
            </Routes>
        </HashRouter>
    );
}
