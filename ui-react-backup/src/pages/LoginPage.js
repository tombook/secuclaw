import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw Login Page
 *
 * Full-screen dark login with animated CSS grid background.
 * Uses api.auth.login() via WebSocket for real authentication.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocketStore } from '@/stores/websocket';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError('请输入用户名和密码');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const wsStore = useWebSocketStore.getState();
            // Ensure connected first
            if (wsStore.status !== 'connected') {
                await wsStore.connect();
            }
            // Use auth store's login which calls wsStore.request('auth.login', ...)
            await useAuthStore.getState().login(username, password, wsStore);
            navigate('/');
        }
        catch (err) {
            setError(err.message || '登录失败，请重试');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e1a]", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 opacity-[0.04]", style: {
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        } }), Array.from({ length: 20 }).map((_, i) => (_jsx("div", { className: "absolute rounded-full", style: {
                            width: `${2 + Math.random() * 3}px`,
                            height: `${2 + Math.random() * 3}px`,
                            backgroundColor: `rgba(59, 130, 246, ${0.1 + Math.random() * 0.3})`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`,
                        } }, i))), _jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full", style: {
                            background: 'radial-gradient(circle, rgba(30, 64, 175, 0.08) 0%, transparent 70%)',
                        } })] }), _jsxs(Card, { className: "relative z-10 w-full max-w-md bg-[#0f1525]/90 border-white/[0.08] backdrop-blur-sm", children: [_jsxs(CardHeader, { className: "text-center pb-2", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDFAF" }), _jsx("h1", { className: "text-2xl font-bold text-white tracking-tight", children: "SecuClaw Security Commander" }), _jsx("p", { className: "text-sm text-white/40 mt-2", children: "AI \u9A71\u52A8\u7684\u5B89\u5168\u5DE5\u7A0B\u534F\u4F5C\u5E73\u53F0" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-medium text-white/50", children: "\u7528\u6237\u540D" }), _jsx(Input, { type: "text", placeholder: "\u8BF7\u8F93\u5165\u7528\u6237\u540D", value: username, onChange: (e) => setUsername(e.target.value), className: "bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-blue-500/40" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-medium text-white/50", children: "\u5BC6\u7801" }), _jsx(Input, { type: "password", placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801", value: password, onChange: (e) => setPassword(e.target.value), className: "bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-blue-500/40" })] }), error && (_jsx("div", { className: "text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2", children: error })), _jsx(Button, { type: "submit", className: "w-full bg-blue-600 hover:bg-blue-700 text-white", disabled: loading, children: loading ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "\u767B\u5F55\u4E2D..."] })) : ('登 录') })] }), _jsxs("div", { className: "mt-6 flex items-center justify-center gap-4 text-[10px] text-white/25", children: [_jsx("span", { children: "\u5FD8\u8BB0\u5BC6\u7801\uFF1F" }), _jsx("span", { children: "\u00B7" }), _jsx("span", { children: "\u8054\u7CFB\u7BA1\u7406\u5458" })] })] })] }), _jsx("div", { className: "absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/20", children: "AI \u5B89\u5168\u5DE5\u7A0B\u5E73\u53F0 v2.0 \u00B7 SecuClaw Security Commander" }), _jsx("style", { children: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-25px) translateX(15px); opacity: 0.5; }
        }
      ` })] }));
};
export default LoginPage;
//# sourceMappingURL=LoginPage.js.map