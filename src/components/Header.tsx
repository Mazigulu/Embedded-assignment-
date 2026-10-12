import React from 'react';
import { ServerHealth } from '../types/index.ts';
import { 
  Server, 
  Layers, 
  Activity, 
  CheckCircle2, 
  FileText, 
  Terminal, 
  ExternalLink, 
  RefreshCw,
  Cpu,
  Wifi
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: ServerHealth | null;
  serverOnline: boolean;
  lastPingMs: number | null;
  onRefreshHealth: () => void;
  onOpenAssessmentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  health,
  serverOnline,
  lastPingMs,
  onRefreshHealth,
  onOpenAssessmentModal,
}) => {
  const tabs = [
    { id: 'architecture', label: 'Layered Architecture', icon: Layers },
    { id: 'console', label: 'Live Client-Server Console', icon: Activity },
    { id: 'verification', label: 'System Verification Suite', icon: CheckCircle2 },
    { id: 'report', label: 'Assessment Links & Report', icon: FileText },
    { id: 'explorer', label: 'REST API Explorer', icon: Terminal },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 text-slate-100">
      {/* Top Banner / Assessment Bar */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/60 border-b border-indigo-500/20 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-200">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide uppercase text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              Assessment Deliverable
            </span>
            <span className="hidden sm:inline text-slate-300">
              Client-Server Architecture with Layered Decomposition & Live Telemetry
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAssessmentModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-xs shadow-sm transition-all hover:scale-[1.02]"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Assessment Links</span>
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <span>Local Host:</span>
              <code className="text-emerald-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-[11px]">
                localhost:3000
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title and Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Client-Server Layered System
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  4-Tier Arch
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Presentation (React) ↔ Transport (Express) ↔ Business Logic (Service) ↔ Persistence (DAL)
              </p>
            </div>
          </div>

          {/* Real-time Server Status & Metrics Pill */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Status indicator */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
              <span className="relative flex h-2.5 w-2.5">
                {serverOnline ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                )}
              </span>
              <span className="font-medium text-slate-200">
                {serverOnline ? 'Express Server Online' : 'Connecting to Server...'}
              </span>
              {lastPingMs !== null && (
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 pl-1 border-l border-slate-700">
                  <Wifi className="w-3 h-3" />
                  {lastPingMs}ms
                </span>
              )}
            </div>

            {/* Quick Metrics */}
            {health && (
              <div className="hidden sm:flex items-center gap-3 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Uptime:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{health.uptimeSeconds}s</span>
                </div>
                <div className="h-3 w-px bg-slate-700"></div>
                <div className="flex items-center gap-1.5">
                  <span>Entities:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{health.metrics.totalEntities}</span>
                </div>
                <div className="h-3 w-px bg-slate-700"></div>
                <div className="flex items-center gap-1.5">
                  <span>Calls:</span>
                  <span className="font-mono text-amber-300 font-semibold">{health.metrics.totalRequests}</span>
                </div>
              </div>
            )}

            {/* Refresh ping button */}
            <button
              onClick={onRefreshHealth}
              title="Ping server status"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 mt-4 pt-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
