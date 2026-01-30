
import React, { useState, useEffect } from 'react';

// Hardcoded user database from request
export const USERS = [
    { name: '수농이', id: '2013', role: 'admin' },
    { name: '테스트', id: 'asdf' },
    { name: '박기열', id: 'park123' },
    { name: '신대철', id: 'sin123' },
    { name: '김성일', id: '123123' },
    { name: '신동일', id: '123sin' },
    { name: '최재홍', id: '3131' },
    { name: '김준영', id: '17155' },
    { name: '공수인', id: 'kk123' },
    { name: '김미성', id: 'altjd1179' },
    { name: '이명준', id: 'jun1179' },
    { name: '신종석', id: 'ss123' },
];

export const LoginPage = ({ onLogin }) => {
    const [authId, setAuthId] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('jv-login-remember');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.id) setAuthId(parsed.id);
                setRememberMe(true);
            } catch (e) {
                // ignore error
            }
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const user = USERS.find(u => u.id === authId);
        if (user) {
            // Save or Clean Remember Me
            if (rememberMe) {
                localStorage.setItem('jv-login-remember', JSON.stringify({ id: authId }));
            } else {
                localStorage.removeItem('jv-login-remember');
            }

            onLogin({
                name: user.name,
                username: user.id, // using ID as username
                role: user.role || 'user',
                avatar: `https://ui-avatars.com/api/?name=${user.name}&background=random`,
                aliases: []
            });
        } else {
            setError('권한 ID가 올바르지 않습니다.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 text-primary">
                        <span className="material-symbols-outlined text-4xl">calendar_month</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">컨소 다이어리 로그인</h1>
                    <p className="text-gray-500 text-sm mt-2">부여받은 권한 ID를 입력해주세요</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            value={authId}
                            onChange={(e) => setAuthId(e.target.value)}
                            placeholder="ID 입력"
                            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            autoFocus
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="flex items-center ml-1">
                        <input
                            id="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium cursor-pointer select-none">
                            아이디 저장
                        </label>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full h-11 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        로그인
                    </button>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-400">
                            시스템 관련 문의: 관리자에게 연락바랍니다.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
