import React, { useState } from 'react';
import { 
  Item, 
  ItemCategory, 
  ItemPriority, 
  RequestWireLog, 
  LayerTrace 
} from '../types/index.ts';
import { apiClient, ClientFetchResult } from '../services/apiClient.ts';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  Send, 
  Zap, 
  Layers, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Database,
  ArrowRight,
  Filter,
  Activity
} from 'lucide-react';

interface InteractiveConsoleTabProps {
  items: Item[];
  onRefreshItems: () => void;
  recentLogs: RequestWireLog[];
  onRefreshLogs: () => void;
}

export const InteractiveConsoleTab: React.FC<InteractiveConsoleTabProps> = ({
  items,
  onRefreshItems,
  recentLogs,
  onRefreshLogs,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Microservice');
  const [priority, setPriority] = useState<ItemPriority>('high');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Interactive request inspection state
  const [latestResult, setLatestResult] = useState<ClientFetchResult<any> | null>(null);
  const [selectedWireLog, setSelectedWireLog] = useState<RequestWireLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Form submission handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await apiClient.createItem({
      name,
      category,
      priority,
      description: description || `Deployed ${category} component`,
      tags: [category.toLowerCase(), 'user-created'],
    });

    setIsSubmitting(false);
    setLatestResult(result);
    if (!result.isError) {
      setName('');
      setDescription('');
      showNotice(`Successfully created entity "${result.response.data?.name}" (HTTP 201 Created)`);
      onRefreshItems();
    } else {
      showNotice(`Request rejected: ${result.response.error} (HTTP ${result.status})`);
    }
    onRefreshLogs();
  };

  // Quick action: Trigger business rule failure
  const handleTriggerBusinessViolation = async () => {
    setIsSubmitting(true);
    const result = await apiClient.createItem({
      name: 'X', // violates >= 3 character constraint
      category: 'Microservice',
      priority: 'medium',
    });
    setIsSubmitting(false);
    setLatestResult(result);
    showNotice(`Business rule rejected payload: ${result.response.error} (HTTP ${result.status})`);
    onRefreshLogs();
  };

  // Quick action: Trigger 404
  const handleTrigger404 = async () => {
    setIsSubmitting(true);
    const result = await apiClient.getItemById('non-existent-uuid-9999');
    setIsSubmitting(false);
    setLatestResult(result);
    showNotice(`Target entity not found in DAL: HTTP 404 Not Found`);
    onRefreshLogs();
  };

  // Quick action: Echo test
  const handleTriggerEcho = async () => {
    setIsSubmitting(true);
    const testPayload = {
      clientAgent: 'Chrome/React19',
      pingTimestamp: new Date().toISOString(),
      assessmentTag: 'Client-Server Communication Handshake',
    };
    const result = await apiClient.echo(testPayload, 50);
    setIsSubmitting(false);
    setLatestResult(result);
    showNotice(`Echo handshake completed in ${result.clientRoundtripMs}ms`);
    onRefreshLogs();
  };

  // Delete item handler
  const handleDelete = async (id: string, itemName: string) => {
    const result = await apiClient.deleteItem(id);
    setLatestResult(result);
    if (!result.isError) {
      showNotice(`Deleted entity "${itemName}" from DAL repository`);
      onRefreshItems();
    } else {
      showNotice(`Delete blocked by Business Policy: ${result.response.error}`);
    }
    onRefreshLogs();
  };

  // Reset database handler
  const handleReset = async () => {
    const result = await apiClient.resetData();
    setLatestResult(result);
    showNotice('Database reset to verified 5-entity baseline dataset');
    onRefreshItems();
    onRefreshLogs();
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCat = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesQuery = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Active inspector data: either selected from log or latest executed
  const currentInspectTraces: LayerTrace[] = 
    latestResult?.combinedTrace || 
    (selectedWireLog?.layerTrace?.length ? selectedWireLog.layerTrace : []);

  return (
    <div className="space-y-6 pb-12">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-indigo-900/90 border border-indigo-500/40 text-indigo-100 text-xs flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-300" />
            <span className="font-mono">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-indigo-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Dual Pane Grid: Client Component (Left) vs Server Wire Telemetry (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: CLIENT PRESENTATION COMPONENT (7 cols)       */}
        {/* ========================================================= */}
        <div className="xl:col-span-7 space-y-6">
          {/* Quick Simulation & Testing Actions */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Client Request Dispatcher
                </h3>
              </div>
              <span className="text-[11px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Tier 1 Actions
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onRefreshItems}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>GET /api/items</span>
              </button>

              <button
                onClick={handleTriggerBusinessViolation}
                className="px-3 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate 422 Violation</span>
              </button>

              <button
                onClick={handleTrigger404}
                className="px-3 py-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-200 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate 404 Not Found</span>
              </button>

              <button
                onClick={handleTriggerEcho}
                className="px-3 py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-200 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Echo Ping-Pong</span>
              </button>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium ml-auto flex items-center gap-1.5"
              >
                <span>Reset Store</span>
              </button>
            </div>
          </div>

          {/* Create Resource Entity Form */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Create Architectural Resource
                </h3>
                <p className="text-xs text-slate-400">
                  Submits a new entity through Controller → Service validation → DAL storage.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                POST /api/items
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Resource Name <span className="text-rose-400">* (min 3 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Redis Cache Cluster"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Layer Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Database">Database</option>
                    <option value="Microservice">Microservice</option>
                    <option value="Client">Client</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Operational Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as ItemPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Component</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description / Purpose
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Distributed key-value cache layer"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Enforces uniqueness, schema validation & atomic DAL write.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Dispatching...' : 'Dispatch POST Request'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Entities Table */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Active Server Resources ({items.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Current state persisted in Data Access Layer (DAL) memory repository.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search resources..."
                    className="pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none w-36 sm:w-44"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Database">Database</option>
                  <option value="Microservice">Microservice</option>
                  <option value="Client">Client</option>
                  <option value="Security">Security</option>
                </select>
              </div>
            </div>

            {/* Resources List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-semibold">Resource / ID</th>
                    <th className="pb-2.5 font-semibold">Category</th>
                    <th className="pb-2.5 font-semibold">Priority</th>
                    <th className="pb-2.5 font-semibold">Payload Size</th>
                    <th className="pb-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-750/50 transition-colors">
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.id} (v{item.version})</div>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-700 text-slate-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          item.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          item.priority === 'medium' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-300">
                        {item.payloadSizeKb} KB
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete entity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No matching entities found. Try adjusting filters or create a new resource.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SERVER WIRE & LAYER TRACE INSPECTOR (5 cols) */}
        {/* ========================================================= */}
        <div className="xl:col-span-5 space-y-6">
          {/* Latest Execution Telemetry Card */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Wire Protocol Inspector
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Real-Time
              </span>
            </div>

            {/* Transaction Header Badge */}
            {latestResult ? (
              <div className="space-y-4">
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                        latestResult.status >= 200 && latestResult.status < 300
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : latestResult.status === 422 || latestResult.status === 400
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        HTTP {latestResult.status || 'ERROR'}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        {latestResult.response.meta?.requestId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{latestResult.clientRoundtripMs}ms roundtrip</span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>Server Internal Time:</span>
                    <span className="font-mono text-emerald-400">
                      {latestResult.response.meta?.executionTimeMs || 0.4}ms
                    </span>
                  </div>
                </div>

                {/* Layer Waterfall Breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Layer Execution Waterfall
                  </h4>

                  <div className="space-y-2 bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                    {currentInspectTraces.map((trace, idx) => {
                      let barColor = 'bg-blue-500';
                      let tierLabel = 'Tier 1';
                      if (trace.layer.includes('Transport') || trace.layer.includes('API')) {
                        barColor = 'bg-indigo-500';
                        tierLabel = 'Tier 2';
                      } else if (trace.layer.includes('Business') || trace.layer.includes('Service')) {
                        barColor = 'bg-purple-500';
                        tierLabel = 'Tier 3';
                      } else if (trace.layer.includes('Data') || trace.layer.includes('Repository')) {
                        barColor = 'bg-emerald-500';
                        tierLabel = 'Tier 4';
                      }

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-200">
                              <span className="text-slate-400 font-mono text-[10px] mr-1">[{tierLabel}]</span>
                              {trace.layer}
                            </span>
                            <span className="font-mono text-slate-300 text-[10px]">
                              {trace.durationMs}ms
                            </span>
                          </div>
                          {/* Progress bar simulation */}
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${barColor} rounded-full`}
                              style={{ width: `${Math.min(100, Math.max(15, (trace.durationMs / (latestResult.clientRoundtripMs || 10)) * 100))}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {trace.action}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Response Payload Inspector */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-1.5">
                    Response Wire Payload (JSON)
                  </h4>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-48 scrollbar-thin">
                    {JSON.stringify(latestResult.response, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p>No active transaction dispatched yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click any action above to watch the HTTP packet travel through all 4 architectural tiers.
                </p>
              </div>
            )}
          </div>

          {/* Recent Wire Log History */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-700/80 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Recent Wire Transactions ({recentLogs.length})
              </h3>
              <button
                onClick={onRefreshLogs}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Refresh wire logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {recentLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedWireLog(log)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedWireLog?.id === log.id
                      ? 'bg-slate-750 border-indigo-500/60 shadow'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-750/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.method === 'GET' ? 'bg-blue-500/20 text-blue-300' :
                        log.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.method === 'PUT' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-slate-200 text-[11px] truncate max-w-[160px]">
                        {log.url}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className={`${
                        log.status >= 200 && log.status < 300 ? 'text-emerald-400' :
                        log.status >= 400 && log.status < 500 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {log.durationMs}ms
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-500">
                  No wire logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
