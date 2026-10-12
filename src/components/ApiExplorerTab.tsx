import React, { useState } from 'react';
import { Terminal, Send, Clock, Layers, Copy, Check } from 'lucide-react';

export const ApiExplorerTab: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('/api/health');
  const [body, setBody] = useState('{\n  "test": true\n}');
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const presets = [
    { method: 'GET' as const, path: '/api/health', body: '', label: 'GET /api/health' },
    { method: 'GET' as const, path: '/api/items', body: '', label: 'GET /api/items' },
    { method: 'GET' as const, path: '/api/metrics', body: '', label: 'GET /api/metrics' },
    { method: 'POST' as const, path: '/api/echo', body: JSON.stringify({ message: 'Hello Server', timestamp: Date.now() }, null, 2), label: 'POST /api/echo' },
    { method: 'GET' as const, path: '/api/assessment-info', body: '', label: 'GET /api/assessment-info' },
    { method: 'POST' as const, path: '/api/items', body: JSON.stringify({ name: 'Assessor Test Node', category: 'Microservice', priority: 'high' }, null, 2), label: 'POST /api/items' },
  ];

  const handleSend = async () => {
    setIsLoading(true);
    const t0 = performance.now();

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Agent': 'React-ApiExplorer',
        },
      };

      if (['POST', 'PUT'].includes(method) && body.trim()) {
        options.body = body;
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();
      const elapsed = Number((performance.now() - t0).toFixed(2));

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      setStatus(res.status);
      setResponse(data);
      setHeaders(resHeaders);
      setLatencyMs(elapsed);
    } catch (err: any) {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      setStatus(0);
      setResponse({ error: err.message || 'Request failed' });
      setLatencyMs(elapsed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                REST API Interactive Explorer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interact directly with backend endpoints, test query parameters, and inspect raw HTTP wire responses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  setMethod(p.method);
                  setEndpoint(p.path);
                  if (p.body) setBody(p.body);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-600 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Request Configurator */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="text"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="/api/..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
            </button>
          </div>

          {['POST', 'PUT'].includes(method) && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                JSON Request Body
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300/90 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 scrollbar-thin"
              />
            </div>
          )}
        </div>

        {/* Response Viewer */}
        {status !== null && (
          <div className="mt-6 pt-5 border-t border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${
                  status >= 200 && status < 300 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  status >= 400 && status < 500 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  Status: {status}
                </span>

                {latencyMs !== null && (
                  <span className="flex items-center gap-1 text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{latencyMs} ms</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleCopyResponse}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-80 scrollbar-thin leading-relaxed">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
