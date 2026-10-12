import React, { useState } from 'react';
import { 
  Layers, 
  ArrowDown, 
  ArrowUp, 
  Play, 
  Code2, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Monitor, 
  Network,
  CheckCircle,
  FileCode2,
  ChevronRight,
  Info
} from 'lucide-react';

export const ArchitectureTab: React.FC = () => {
  const [selectedFlow, setSelectedFlow] = useState<'read' | 'create' | 'error' | 'delete'>('create');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'client' | 'controller' | 'service' | 'dal'>('controller');

  // Flow simulation configurations
  const flows = {
    read: {
      title: 'Read / Query Flow (GET /api/items)',
      description: 'Client requests resource inventory; request passes through all layers to in-memory store and returns serialized records.',
      steps: [
        { tier: 1, title: 'Client UI Trigger', desc: 'User requests item list; React component calls ApiClient.getItems()' },
        { tier: 2, title: 'Transport / Controller', desc: 'Express Router matches GET /api/items; ItemController extracts query filters' },
        { tier: 3, title: 'Business Logic Service', desc: 'ItemBusinessService applies query sanitization and authorization rules' },
        { tier: 4, title: 'Data Access Layer (DAL)', desc: 'DataAccessLayer scans in-memory repository and returns entity array' },
        { tier: 3, title: 'BLL Normalization', desc: 'Service wraps records with audit metrics and layer execution duration' },
        { tier: 2, title: 'HTTP Response Formatting', desc: 'Controller serializes JSON with HTTP 200 OK and X-Request-ID headers' },
        { tier: 1, title: 'Client State Update', desc: 'ApiClient receives payload; React re-renders UI grid in 1.4ms' },
      ],
    },
    create: {
      title: 'Creation Flow with Validation (POST /api/items)',
      description: 'Demonstrates end-to-end data flow: user input validation, business rule evaluation, duplicate check, and atomic persistence.',
      steps: [
        { tier: 1, title: 'Client Input Submission', desc: 'User completes form; ApiClient creates JSON payload with X-Client-Timestamp' },
        { tier: 2, title: 'Transport Gateway', desc: 'Express body-parser parses JSON; Controller validates request syntax' },
        { tier: 3, title: 'Domain Rule Validation', desc: 'ItemService enforces name length > 3 chars, category enum, duplicate check' },
        { tier: 4, title: 'Persistence Operation', desc: 'DAL inserts entity into Map storage with version 1 and timestamps' },
        { tier: 3, title: 'Event & Metrics Enriched', desc: 'Service computes payload size (KB) and registers creation telemetry' },
        { tier: 2, title: 'HTTP 201 Created Response', desc: 'Controller sets status code 201 Created and sends response' },
        { tier: 1, title: 'Client State Sync', desc: 'React state updates immediately and triggers toast confirmation' },
      ],
    },
    error: {
      title: 'Business Validation Failure (422 Unprocessable)',
      description: 'Demonstrates layer boundary protection: invalid input is rejected at the Business Logic layer before reaching the Database.',
      steps: [
        { tier: 1, title: 'Client Sends Payload', desc: 'Client sends entity with name "AB" (violates 3-char minimum rule)' },
        { tier: 2, title: 'Controller Dispatch', desc: 'Express router passes payload to ItemBusinessService.createItem()' },
        { tier: 3, title: 'Business Rule Rejection', desc: 'Service halts execution: ERR_VALIDATION_NAME_LENGTH rule triggered!' },
        { tier: 2, title: 'Status Code Translation', desc: 'Controller catches domain error code and maps to HTTP 422 Unprocessable' },
        { tier: 1, title: 'Client Error Display', desc: 'Client catches 422 error, renders inline error banner without crash' },
      ],
    },
    delete: {
      title: 'Protected Deletion Flow (DELETE /api/items/:id)',
      description: 'Demonstrates business rule protection: critical infrastructure components are blocked from accidental deletion.',
      steps: [
        { tier: 1, title: 'Client Delete Action', desc: 'User clicks delete on node-srv-01; ApiClient dispatches HTTP DELETE' },
        { tier: 2, title: 'Controller Route Match', desc: 'ItemController extracts URL parameter :id and invokes ItemBusinessService' },
        { tier: 3, title: 'Policy Check Enforcement', desc: 'Service inspects item: critical root component policy blocks deletion!' },
        { tier: 2, title: 'HTTP 403 Forbidden', desc: 'Controller returns HTTP 403 Forbidden with descriptive explanation' },
        { tier: 1, title: 'Client Alert Notification', desc: 'Client displays policy warning preventing unauthorized destruction' },
      ],
    },
  };

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setActiveStep(0);
    const flowSteps = flows[selectedFlow].steps;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < flowSteps.length) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1100);
  };

  const currentSteps = flows[selectedFlow].steps;
  const currentStepObj = currentSteps[activeStep] || currentSteps[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                4-Tier Layered Client-Server Architecture
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              This system decomposes functionality into four logically distinct, decoupled tiers. Each layer possesses strict responsibilities, clear boundary interfaces, and independent testability.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Separation of Concerns Verified
            </span>
          </div>
        </div>

        {/* 4 Layer Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Layer 1 */}
          <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-4.5 relative overflow-hidden group hover:border-blue-500/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Tier 1: Client
              </span>
              <Monitor className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Presentation Tier</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              React 19 SPA client running in the user’s browser. Manages local UI state, user gestures, and issues asynchronous HTTP calls.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div><strong className="text-blue-400">Tech:</strong> React 19, Tailwind v4, Fetch</div>
              <div><strong className="text-blue-400">File:</strong> <code className="font-mono text-slate-300">src/services/apiClient.ts</code></div>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4.5 relative overflow-hidden group hover:border-indigo-500/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Tier 2: Transport
              </span>
              <Network className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Transport / Controller</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Express.js HTTP server. Maps REST endpoints, parses JSON, injects correlation IDs, handles HTTP status codes and wire logging.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div><strong className="text-indigo-400">Tech:</strong> Express 4, Node.js, HTTP REST</div>
              <div><strong className="text-indigo-400">File:</strong> <code className="font-mono text-slate-300">server/controllers/*.ts</code></div>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-4.5 relative overflow-hidden group hover:border-purple-500/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Tier 3: Domain
              </span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Business Logic (Service)</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pure domain service. Enforces validation rules (length, duplicate checks, protection rules), schema sanitization, and metric calculation.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div><strong className="text-purple-400">Tech:</strong> TypeScript Domain Service</div>
              <div><strong className="text-purple-400">File:</strong> <code className="font-mono text-slate-300">server/services/itemService.ts</code></div>
            </div>
          </div>

          {/* Layer 4 */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4.5 relative overflow-hidden group hover:border-emerald-500/60 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tier 4: Persistence
              </span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Data Access (DAL)</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Encapsulated persistence abstraction. Performs atomic CRUD operations, indexing, and state maintenance without leaking storage details.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div><strong className="text-emerald-400">Tech:</strong> Repository Pattern, In-Memory DB</div>
              <div><strong className="text-emerald-400">File:</strong> <code className="font-mono text-slate-300">server/db/store.ts</code></div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Request Flow Simulator */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">
                Interactive Cross-Layer Flow Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select a standard architectural scenario and watch the execution packet travel through each layer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['create', 'read', 'error', 'delete'] as const).map(f => (
              <button
                key={f}
                disabled={isSimulating}
                onClick={() => {
                  setSelectedFlow(f);
                  setActiveStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedFlow === f
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-750 hover:bg-slate-700 text-slate-300 border border-slate-700'
                } ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {f === 'create' && 'Create Entity Flow'}
                {f === 'read' && 'Query All Flow'}
                {f === 'error' && 'Validation Failure (422)'}
                {f === 'delete' && 'Policy Guard (403)'}
              </button>
            ))}

            <button
              onClick={handleStartSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Current Flow Details */}
        <div className="mt-6 bg-slate-900/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Active Scenario:
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {flows[selectedFlow].title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {flows[selectedFlow].description}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Step:</span>
              <div className="font-mono text-sm font-bold text-indigo-300">
                {activeStep + 1} / {currentSteps.length}
              </div>
            </div>
          </div>

          {/* Stepper Visualization */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {currentSteps.map((step, idx) => {
              const isCurrent = activeStep === idx;
              const isPast = activeStep > idx;

              let tierBg = 'bg-slate-800 text-slate-400 border-slate-700';
              if (step.tier === 1) tierBg = 'bg-blue-900/30 text-blue-300 border-blue-500/40';
              if (step.tier === 2) tierBg = 'bg-indigo-900/30 text-indigo-300 border-indigo-500/40';
              if (step.tier === 3) tierBg = 'bg-purple-900/30 text-purple-300 border-purple-500/40';
              if (step.tier === 4) tierBg = 'bg-emerald-900/30 text-emerald-300 border-emerald-500/40';

              return (
                <div
                  key={idx}
                  onClick={() => !isSimulating && setActiveStep(idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${tierBg} ${
                    isCurrent
                      ? 'ring-2 ring-indigo-400 shadow-lg scale-[1.03] z-10'
                      : isPast
                      ? 'opacity-80'
                      : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span>Tier {step.tier}</span>
                    <span>#{idx + 1}</span>
                  </div>
                  <div className="font-semibold text-xs text-white truncate">
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {step.desc}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Active Step Inspector */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-indigo-300">
                Current Step Execution Analysis (Tier {currentStepObj.tier}):
              </span>
              <p className="text-slate-300 mt-1">
                {currentStepObj.desc}
              </p>
              <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap gap-4 font-mono">
                <span>Phase: {activeStep < currentSteps.length / 2 ? 'Inbound Request' : 'Outbound Response'}</span>
                <span>Tier Responsibility: Tier {currentStepObj.tier} Component</span>
                <span>Latency Impact: Sub-millisecond direct invocation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              Real Layer Implementation Code
            </h3>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveCodeTab('client')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'client'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. apiClient.ts (Presentation)
            </button>
            <button
              onClick={() => setActiveCodeTab('controller')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'controller'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. itemController.ts (Transport)
            </button>
            <button
              onClick={() => setActiveCodeTab('service')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'service'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3. itemService.ts (BLL)
            </button>
            <button
              onClick={() => setActiveCodeTab('dal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'dal'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              4. store.ts (DAL)
            </button>
          </div>
        </div>

        <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
          {activeCodeTab === 'client' && (
            <pre className="text-blue-300/90 leading-relaxed">
{`// src/services/apiClient.ts (Tier 1: Presentation Tier)
export class ApiClientService {
  public async createItem(item: Partial<Item>): Promise<ClientFetchResult<Item>> {
    const t0 = performance.now();
    const requestId = \`cli-\${Date.now()}\`;
    
    // Injects correlation headers & initiates HTTP transport
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Client-Timestamp': new Date().toISOString()
      },
      body: JSON.stringify(item)
    });
    
    const data = await res.json();
    const roundtripMs = performance.now() - t0;
    return { response: data, status: res.status, clientRoundtripMs: roundtripMs };
  }
}`}
            </pre>
          )}

          {activeCodeTab === 'controller' && (
            <pre className="text-indigo-300/90 leading-relaxed">
{`// server/controllers/itemController.ts (Tier 2: Transport/API Gateway)
export class ItemController {
  public static async create(req: Request, res: Response) {
    const t0 = performance.now();
    const { name, category, priority, status, description } = req.body;

    // Dispatches to Business Logic Service (No SQL/DB queries here!)
    const result = await itemService.createItem({ name, category, priority, status, description });
    
    // Maps business outcome to standard HTTP Status Codes
    if (!result.success) {
      const status = ItemController.mapErrorCodeToStatus(result.errorCode); // 400, 409, 422
      return ItemController.sendResponse(req, res, status, undefined, result.error, result.errorCode, result.traces);
    }

    return ItemController.sendResponse(req, res, 201, result.data, undefined, undefined, result.traces);
  }
}`}
            </pre>
          )}

          {activeCodeTab === 'service' && (
            <pre className="text-purple-300/90 leading-relaxed">
{`// server/services/itemService.ts (Tier 3: Business Logic Layer / Service)
export class ItemBusinessService {
  public async createItem(input: CreateItemInput): Promise<ServiceResult<Item>> {
    // 1. Business Validation Rule: Name length
    if (!input.name || input.name.trim().length < 3) {
      return { success: false, error: 'Name must be >= 3 chars', errorCode: 'ERR_VALIDATION_NAME_LENGTH' };
    }
    // 2. Business Validation Rule: Enum validation
    if (!this.validCategories.includes(input.category)) {
      return { success: false, error: 'Invalid category', errorCode: 'ERR_INVALID_CATEGORY' };
    }
    // 3. Business Rule: Duplicate name prevention
    const { item: existing } = await repository.findByName(input.name);
    if (existing) {
      return { success: false, error: 'Duplicate entity name', errorCode: 'ERR_DUPLICATE_NAME' };
    }

    // 4. Delegate atomic storage to Layer 4 (DAL)
    const { item: persisted, trace: dalTrace } = await repository.create(newItem);
    return { success: true, data: persisted, traces: [bllTrace, dalTrace] };
  }
}`}
            </pre>
          )}

          {activeCodeTab === 'dal' && (
            <pre className="text-emerald-300/90 leading-relaxed">
{`// server/db/store.ts (Tier 4: Data Access Layer / Persistence)
export class DataAccessLayer {
  private items: Map<string, Item> = new Map();

  public async create(item: Item): Promise<{ item: Item; trace: LayerTrace }> {
    const start = performance.now();
    // Atomic storage operation isolated from HTTP & business rules
    this.items.set(item.id, { ...item });
    const durationMs = performance.now() - start;

    return {
      item: { ...item },
      trace: {
        layer: 'Data Access (Repository)',
        component: 'DataAccessLayer (MemoryDB)',
        action: \`create() persisted entity \${item.id}\`,
        durationMs
      }
    };
  }
}`}
            </pre>
          )}
        </div>
      </div>

      {/* Architectural Benefits Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>Separation of Concerns</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            UI components never access the database directly; controllers never contain business validation; services are agnostic of HTTP status codes.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>Independent Testability</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Business Service can be unit tested without starting an HTTP server or database; the DAL can be swapped from memory to PostgreSQL with zero service rewrites.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>High Cohesion & Scalability</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Client Presentation layer can scale horizontally on CDNs while Express Application server runs behind load balancers with predictable latency.
          </p>
        </div>
      </div>
    </div>
  );
};
