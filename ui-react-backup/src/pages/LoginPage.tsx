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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e1a]">
      {/* ── Animated Grid Background ── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              backgroundColor: `rgba(59, 130, 246, ${0.1 + Math.random() * 0.3})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        {/* Radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(30, 64, 175, 0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Login Card ── */}
      <Card className="relative z-10 w-full max-w-md bg-[#0f1525]/90 border-white/[0.08] backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            SecuClaw Security Commander
          </h1>
          <p className="text-sm text-white/40 mt-2">
            AI 驱动的安全工程协作平台
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">用户名</label>
              <Input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-blue-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">密码</label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-blue-500/40"
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </span>
              ) : (
                '登 录'
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-white/25">
            <span>忘记密码？</span>
            <span>·</span>
            <span>联系管理员</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Version Footer ── */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/20">
        AI 安全工程平台 v2.0 · SecuClaw Security Commander
      </div>

      {/* ── Float Animation Keyframes (inline) ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-25px) translateX(15px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
