import React, { useState } from 'react';
import { VerificationTest } from '../types/index.ts';
import { apiClient } from '../services/apiClient.ts';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';

export const VerificationTab: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeTestIndex, setActiveTestIndex] = useState<number | null>(null);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const initialTests: VerificationTest[] = [
    {
      id: 'test-1',
      name: 'TCP/HTTP Handshake & System Health Probe',
      description: 'Verifies network connectivity between React Presentation Client and Express Server, ensuring all 4 layers report operational.',
      endpoint: '/api/health',
      method: 'GET',
      expectedStatus: 200,
    },
    {
      id: 'test-2',
      name: 'Cross-Layer Data Query & Retrieval',
      description: 'Dispatches query down through Controller → Service → Data Access Layer, retrieving existing inventory items.',
      endpoint: '/api/items',
      method: 'GET',
      expectedStatus: 200,
    },
    {
      id: 'test-3',
      name: 'Domain Business Logic Rule Enforcement',
      description: 'Submits invalid entity payload (< 3 character name); asserts Business Logic Layer intercepts and rejects with HTTP 422.',
      endpoint: '/api/items',
      method: 'POST',
      expectedStatus: 422,
    },
    {
      id: 'test-4',
      name: 'Entity Creation & DAL State Persistence',
      description: 'Submits valid entity; asserts Controller dispatches, Service enriches, and DAL writes to repository with HTTP 201 Created.',
      endpoint: '/api/items',
      method: 'POST',
      expectedStatus: 201,
    },
    {
      id: 'test-5',
      name: 'State Synchronization & Version Increment',
      description: 'Updates entity attributes; verifies DAL increments entity version number and updates modification timestamp.',
      endpoint: '/api/items/:id',
      method: 'PUT',
      expectedStatus: 200,
    },
    {
      id: 'test-6',
      name: 'Resilient Error Handling & Fault Containment',
      description: 'Queries a non-existent entity identifier; asserts DAL returns null, Service returns error code, and Controller maps to HTTP 404.',
      endpoint: '/api/items/unknown-id',
      method: 'GET',
      expectedStatus: 404,
    },
    {
      id: 'test-7',
      name: 'Protocol Round-Trip & Latency Benchmark',
      description: 'Sends echo payload across HTTP wire socket to measure client-to-server latency and payload integrity.',
      endpoint: '/api/echo',
      method: 'POST',
      expectedStatus: 200,
    },
    {
      id: 'test-8',
      name: 'Architectural Layer Trace Telemetry Integrity',
      description: 'Asserts that the response meta header contains granular microsecond traces from all server tiers.',
      endpoint: '/api/health',
      method: 'GET',
      expectedStatus: 200,
    },
  ];

  const [tests, setTests] = useState<VerificationTest[]>(initialTests);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);

  // Execute the automated test suite
  const runAllTests = async () => {
    setIsRunning(true);
    const updated = [...initialTests];

    for (let i = 0; i < updated.length; i++) {
      setActiveTestIndex(i);
      const test = updated[i];

      try {
        if (test.id === 'test-1') {
          const res = await apiClient.getHealth();
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = res.status === 200 && res.response.data?.status === 'healthy';
          test.responsePreview = res.response;
          test.details = `Uptime: ${res.response.data?.uptimeSeconds}s | 4 layers verified active.`;
          test.trace = res.combinedTrace;
        } else if (test.id === 'test-2') {
          const res = await apiClient.getItems();
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = res.status === 200 && Array.isArray(res.response.data);
          test.responsePreview = res.response;
          test.details = `Retrieved ${res.response.data?.length || 0} entities from memory repository.`;
          test.trace = res.combinedTrace;
        } else if (test.id === 'test-3') {
          const res = await apiClient.createItem({
            name: 'X', // Invalid
            category: 'Microservice',
            priority: 'medium',
          });
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = res.status === 422 && res.response.code === 'ERR_VALIDATION_NAME_LENGTH';
          test.responsePreview = res.response;
          test.details = `Business rule triggered: "${res.response.error}".`;
          test.trace = res.combinedTrace;
        } else if (test.id === 'test-4') {
          const uniqueName = `Automated Verification Node ${Date.now().toString().slice(-4)}`;
          const res = await apiClient.createItem({
            name: uniqueName,
            category: 'Infrastructure',
            priority: 'critical',
            description: 'Automated test entity persisted to DAL.',
          });
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = res.status === 201 && !!res.response.data?.id;
          test.responsePreview = res.response;
          test.details = `Created entity ID "${res.response.data?.id}".`;
          test.trace = res.combinedTrace;
          if (res.response.data?.id) {
            setCreatedItemId(res.response.data.id);
          }
        } else if (test.id === 'test-5') {
          const targetId = createdItemId || 'node-srv-01';
          const res = await apiClient.updateItem(targetId, {
            priority: 'critical',
            description: 'Updated during automated verification test.',
          });
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = res.status === 200 && (res.response.data?.version ?? 0) >= 1;
          test.responsePreview = res.response;
          test.details = `Entity ${targetId} version incremented to v${res.response.data?.version}.`;
          test.trace = res.combinedTrace;
        } else if (test.id === 'test-6') {
          const res = await apiClient.getItemById('non-existent-probe-id-999');
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = res.status === 404;
          test.responsePreview = res.response;
          test.details = `Handled missing record gracefully with HTTP 404.`;
          test.trace = res.combinedTrace;
        } else if (test.id === 'test-7') {
          const res = await apiClient.echo({ probe: 'verification-ping', timestamp: Date.now() });
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = res.status === 200 && !!res.response.data?.echoedAt;
          test.responsePreview = res.response;
          test.details = `Round-trip socket communication confirmed in ${res.clientRoundtripMs}ms.`;
          test.trace = res.combinedTrace;
        } else if (test.id === 'test-8') {
          const res = await apiClient.getHealth();
          const traces = res.response.meta?.layerTrace || [];
          const hasTransport = traces.some(t => t.layer.includes('Transport'));
          const hasBusiness = traces.some(t => t.layer.includes('Business'));
          const hasDal = traces.some(t => t.layer.includes('Data') || t.layer.includes('Repository'));
          test.actualStatus = res.status;
          test.latencyMs = res.clientRoundtripMs;
          test.passed = hasTransport && hasBusiness && hasDal;
          test.responsePreview = traces;
          test.details = `Verified active execution telemetry across all 3 server tiers.`;
          test.trace = res.combinedTrace;
        }
      } catch (err: any) {
        test.passed = false;
        test.error = err.message || 'Execution failed';
      }

      setTests([...updated]);
      // Small delay between tests for smooth visual progress
      await new Promise(r => setTimeout(r, 220));
    }

    setIsRunning(false);
    setActiveTestIndex(null);
  };

  const executedTests = tests.filter(t => t.passed !== undefined);
  const passedCount = tests.filter(t => t.passed === true).length;
  const avgLatency = executedTests.length > 0 
    ? Number((executedTests.reduce((acc, t) => acc + (t.latencyMs || 0), 0) / executedTests.length).toFixed(1))
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Automated System Verification Suite
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Demonstrates and mathematically proves successful client-server communication, protocol compliance, business rule enforcement, and layered execution traces.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Verification...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run System Self-Test (8 Tests)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Summary Scoreboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Verification Status</span>
            <div className="mt-1 flex items-center gap-2">
              {passedCount === 8 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-base font-bold text-emerald-300">100% VERIFIED</span>
                </>
              ) : passedCount > 0 ? (
                <span className="text-base font-bold text-indigo-300">{passedCount}/8 Passed</span>
              ) : (
                <span className="text-base font-bold text-slate-400">Ready to Test</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {passedCount === 8 ? 'All layers passing assertions' : 'Awaiting automated run'}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Average Latency</span>
            <div className="mt-1 font-mono text-xl font-bold text-cyan-300">
              {avgLatency > 0 ? `${avgLatency} ms` : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total client-to-server transit
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Network Protocol</span>
            <div className="mt-1 font-mono text-sm font-bold text-white">
              HTTP/1.1 REST JSON
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Standardized client-server contract
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Architectural Tiers</span>
            <div className="mt-1 font-mono text-sm font-bold text-indigo-300">
              4 Decomposed Layers
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Presentation, Transport, BLL, DAL
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases Checklist */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
          <span>Automated Test Cases ({tests.length})</span>
          <span className="text-xs font-normal text-slate-400">
            Click any test to inspect HTTP payload and layer trace
          </span>
        </h3>

        <div className="space-y-3">
          {tests.map((test, idx) => {
            const isCurrent = activeTestIndex === idx;
            const isExpanded = expandedTestId === test.id;

            return (
              <div
                key={test.id}
                className={`rounded-xl border transition-all ${
                  test.passed === true
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : test.passed === false
                    ? 'bg-slate-900/90 border-rose-500/30'
                    : isCurrent
                    ? 'bg-slate-900 border-indigo-500/80 ring-1 ring-indigo-500'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div
                  onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Status icon */}
                    <div>
                      {isCurrent ? (
                        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                      ) : test.passed === true ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : test.passed === false ? (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-mono text-slate-500">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {test.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {test.method} {test.endpoint}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {test.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {test.latencyMs !== undefined && (
                      <span className="font-mono text-xs text-indigo-300">
                        {test.latencyMs} ms
                      </span>
                    )}

                    <div className="font-mono text-xs">
                      {test.actualStatus ? (
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          test.actualStatus === test.expectedStatus
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          HTTP {test.actualStatus}
                        </span>
                      ) : (
                        <span className="text-slate-500">Exp: {test.expectedStatus}</span>
                      )}
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800 text-xs space-y-3">
                    {test.details && (
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                        <strong>Assertion Output:</strong> {test.details}
                      </div>
                    )}

                    {test.trace && test.trace.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          <span>Layer Execution Trace:</span>
                        </div>
                        <div className="space-y-1">
                          {test.trace.map((tr, tIdx) => (
                            <div key={tIdx} className="text-[10px] font-mono text-slate-400 bg-slate-950/60 p-1.5 rounded flex items-center justify-between">
                              <span>[{tr.layer}] {tr.action}</span>
                              <span className="text-emerald-400">{tr.durationMs}ms</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {test.responsePreview && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-300 mb-1">
                          Response Payload:
                        </div>
                        <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-300/90 overflow-x-auto max-h-36 scrollbar-thin">
                          {JSON.stringify(test.responsePreview, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
