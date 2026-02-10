import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { tauriApi } from '@/lib/tauri';
import { useSessionStore } from '@/stores/sessionStore';
import { Activity, MessageSquare, Cpu, RefreshCw } from 'lucide-react';
import type { UsageMetrics as UsageMetricsType } from '@/types';

function ProgressRing({ used, limit, size = 100 }: { used: number; limit: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const offset = circumference * (1 - pct);
  const color = pct > 0.9 ? '#ef4444' : pct > 0.7 ? '#f59e0b' : '#3b82f6';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgba(63,63,70,0.5)"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-zinc-100">{used}</span>
        <span className="text-[10px] text-zinc-500">/ {limit}</span>
      </div>
    </div>
  );
}

export function UsageMetrics() {
  const { activeSessionId, sessions } = useSessionStore();
  const [metrics, setMetrics] = useState<UsageMetricsType | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const data = await tauriApi.getUsageMetrics(activeSessionId);
      setMetrics(data);
    } catch {
      // Fallback metrics
      setMetrics({
        premium_requests_used: 0,
        premium_requests_limit: 300,
        session_messages: 0,
        session_tokens: null,
        active_model: 'claude-sonnet-4-5',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [activeSessionId]);

  const requestUsage = async () => {
    if (!activeSessionId) return;
    try {
      await tauriApi.sendSlashCommand(activeSessionId, '/usage');
    } catch {
      // ignore
    }
    fetchMetrics();
  };

  return (
    <div className="space-y-4">
      {/* Premium Requests */}
      <div className="flex items-center gap-6 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
        <ProgressRing
          used={metrics?.premium_requests_used ?? 0}
          limit={metrics?.premium_requests_limit ?? 300}
        />
        <div>
          <h4 className="text-sm font-medium text-zinc-200">Premium Requests</h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            {metrics?.premium_requests_used ?? 0} of {metrics?.premium_requests_limit ?? 300} used
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">Resets monthly</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value={String(metrics?.session_messages ?? 0)}
          color="text-blue-400"
        />
        <StatCard
          icon={Cpu}
          label="Tokens"
          value={metrics?.session_tokens != null ? formatNumber(metrics.session_tokens) : '—'}
          color="text-emerald-400"
        />
        <StatCard
          icon={Activity}
          label="Sessions"
          value={String(sessions.length)}
          color="text-violet-400"
        />
      </div>

      {/* Active Model */}
      {metrics?.active_model && (
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
          <span className="text-xs text-zinc-500">Active Model</span>
          <span className="text-xs font-medium text-zinc-300">{metrics.active_model}</span>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={requestUsage}
        disabled={loading || !activeSessionId}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        Refresh Usage
      </button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
      <Icon size={16} className={color} />
      <span className="text-lg font-bold text-zinc-100">{value}</span>
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
