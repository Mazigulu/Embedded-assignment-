/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Item, RequestWireLog, ServerHealth } from './types/index.ts';
import { apiClient } from './services/apiClient.ts';
import { Header } from './components/Header.tsx';
import { ArchitectureTab } from './components/ArchitectureTab.tsx';
import { InteractiveConsoleTab } from './components/InteractiveConsoleTab.tsx';
import { VerificationTab } from './components/VerificationTab.tsx';
import { AssessmentReportTab } from './components/AssessmentReportTab.tsx';
import { ApiExplorerTab } from './components/ApiExplorerTab.tsx';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Server, 
  ShieldCheck, 
  Layers,
  Laptop
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('architecture');
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [lastPingMs, setLastPingMs] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [recentLogs, setRecentLogs] = useState<RequestWireLog[]>([]);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [modalCopied, setModalCopied] = useState<string | null>(null);

  const sharedUrl = 'https://ais-pre-xi35vdlydoytp3ig4dvazi-887471711556.europe-west2.run.app';
  const devUrl = 'https://ais-dev-xi35vdlydoytp3ig4dvazi-887471711556.europe-west2.run.app';
  const localhostUrl = 'http://localhost:3000';

  // Fetch system health & status
  const fetchHealth = useCallback(async () => {
    try {
      const res = await apiClient.getHealth();
      if (!res.isError && res.response.data) {
        setHealth(res.response.data);
        setServerOnline(true);
        setLastPingMs(res.clientRoundtripMs);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  }, []);

  // Fetch active items list
  const fetchItems = useCallback(async () => {
    try {
      const res = await apiClient.getItems();
      if (!res.isError && Array.isArray(res.response.data)) {
        setItems(res.response.data);
      }
    } catch (e) {
      console.error('Failed to fetch items:', e);
    }
  }, []);

  // Fetch recent wire logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiClient.getRecentRequests();
      if (!res.isError && Array.isArray(res.response.data)) {
        setRecentLogs(res.response.data);
      }
    } catch (e) {
      console.error('Failed to fetch wire logs:', e);
    }
  }, []);

  // Initial load and periodic heartbeat
  useEffect(() => {
    fetchHealth();
    fetchItems();
    fetchLogs();

    const interval = setInterval(() => {
      fetchHealth();
      fetchLogs();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchHealth, fetchItems, fetchLogs]);

  const copyModalLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setModalCopied(key);
    setTimeout(() => setModalCopied(null), 2200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        serverOnline={serverOnline}
        lastPingMs={lastPingMs}
        onRefreshHealth={fetchHealth}
        onOpenAssessmentModal={() => setIsAssessmentModalOpen(true)}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'console' && (
          <InteractiveConsoleTab
            items={items}
            onRefreshItems={fetchItems}
            recentLogs={recentLogs}
            onRefreshLogs={fetchLogs}
          />
        )}
        {activeTab === 'verification' && <VerificationTab />}
        {activeTab === 'report' && <AssessmentReportTab />}
        {activeTab === 'explorer' && <ApiExplorerTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Client-Server Layered Demonstration System</span>
            <span>•</span>
            <span className="font-mono text-slate-400">Node.js Express ↔ React 19 SPA</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('report')}
              className="hover:text-indigo-400 transition-colors"
            >
              Assessment Links & Rubric
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className="hover:text-indigo-400 transition-colors"
            >
              Verification Suite (8 Tests)
            </button>
          </div>
        </div>
      </footer>

      {/* Assessment Links Modal */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIsAssessmentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Assessment Verification Links</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Direct URLs to assess the client-server implementation and multi-tier architecture.
            </p>

            <div className="space-y-3">
              {/* Primary Shared Link */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                    Primary Assessment Link (Shared)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live Preview</span>
                </div>
                <div className="text-xs font-mono text-indigo-300 break-all select-all mb-2">
                  {sharedUrl}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyModalLink(sharedUrl, 'shared')}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    {modalCopied === 'shared' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{modalCopied === 'shared' ? 'Copied to Clipboard!' : 'Copy Assessment URL'}</span>
                  </button>
                  <a
                    href={sharedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Development Link */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-blue-400 uppercase">
                    Development Environment Link
                  </span>
                </div>
                <div className="text-xs font-mono text-blue-300 break-all select-all mb-2">
                  {devUrl}
                </div>
                <button
                  onClick={() => copyModalLink(devUrl, 'dev')}
                  className="w-full py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center gap-1.5"
                >
                  {modalCopied === 'dev' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{modalCopied === 'dev' ? 'Copied!' : 'Copy Dev Link'}</span>
                </button>
              </div>

              {/* Localhost Link */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">
                    Localhost Environment (Port 3000)
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-300 break-all select-all mb-2">
                  {localhostUrl}
                </div>
                <button
                  onClick={() => copyModalLink(localhostUrl, 'local')}
                  className="w-full py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center gap-1.5"
                >
                  {modalCopied === 'local' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{modalCopied === 'local' ? 'Copied!' : 'Copy Localhost URL'}</span>
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsAssessmentModalOpen(false);
                  setActiveTab('report');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                View Full Documentation Report →
              </button>
              <button
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
