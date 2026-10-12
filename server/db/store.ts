/**
 * Layer 4: Data Access Layer (DAL) / Persistence Repository
 * 
 * Responsibility:
 * - Direct abstraction over data storage (In-memory database store).
 * - Implements atomic persistence operations: Create, Read, Update, Delete, Filter.
 * - Enforces record identity, entity versioning, and structural persistence.
 * - Emits LayerTrace telemetry for performance audit.
 */

import type { Item, LayerTrace } from '../../src/types/index.ts';

class DataAccessLayer {
  private items: Map<string, Item> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData(): void {
    this.items.clear();

    const seeds: Item[] = [
      {
        id: 'node-srv-01',
        name: 'Express Application Gateway',
        category: 'Infrastructure',
        status: 'active',
        priority: 'critical',
        payloadSizeKb: 14.2,
        description: 'Primary HTTP/REST gateway handling protocol translation, rate limiting, and reverse proxy routing.',
        tags: ['gateway', 'express', 'node', 'http'],
        version: 1,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'data-mem-02',
        name: 'In-Memory State Store (DAL)',
        category: 'Database',
        status: 'active',
        priority: 'high',
        payloadSizeKb: 28.6,
        description: 'Thread-safe repository abstraction providing sub-millisecond data query execution and transaction isolation.',
        tags: ['dal', 'repository', 'memory-db', 'acid'],
        version: 2,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: 'svc-biz-03',
        name: 'Domain Business Logic Service',
        category: 'Microservice',
        status: 'active',
        priority: 'high',
        payloadSizeKb: 9.8,
        description: 'Encapsulates business rules, schema constraints, audit log generation, and multi-field validation.',
        tags: ['bll', 'domain', 'validation', 'rules'],
        version: 1,
        createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'cli-react-04',
        name: 'React 19 Presentation Client',
        category: 'Client',
        status: 'active',
        priority: 'medium',
        payloadSizeKb: 45.1,
        description: 'Single-Page Application frontend providing user interaction, state synchronization, and telemetry inspection.',
        tags: ['client', 'react', 'tailwind', 'spa'],
        version: 3,
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sec-auth-05',
        name: 'Session & Header Security Guard',
        category: 'Security',
        status: 'active',
        priority: 'critical',
        payloadSizeKb: 6.4,
        description: 'Middleware verifying incoming authorization headers, content-type integrity, and sanitizing input parameters.',
        tags: ['security', 'cors', 'auth-header', 'sanitization'],
        version: 1,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ];

    seeds.forEach(item => this.items.set(item.id, item));
  }

  public async findAll(filter?: { category?: string; query?: string }): Promise<{ items: Item[]; trace: LayerTrace }> {
    const start = performance.now();
    let result = Array.from(this.items.values());

    if (filter?.category && filter.category !== 'all') {
      result = result.filter(item => item.category.toLowerCase() === filter.category?.toLowerCase());
    }

    if (filter?.query && filter.query.trim()) {
      const q = filter.query.toLowerCase().trim();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const durationMs = Number((performance.now() - start).toFixed(2));
    const trace: LayerTrace = {
      layer: 'Data Access (Repository)',
      component: 'DataAccessLayer (MemoryDB)',
      action: `findAll() query scanned ${this.items.size} records; returned ${result.length} matches`,
      durationMs,
      details: `Database read operation with indexed memory scan (${result.length} entities returned).`,
    };

    return { items: result, trace };
  }

  public async findById(id: string): Promise<{ item: Item | null; trace: LayerTrace }> {
    const start = performance.now();
    const item = this.items.get(id) || null;
    const durationMs = Number((performance.now() - start).toFixed(2));

    const trace: LayerTrace = {
      layer: 'Data Access (Repository)',
      component: 'DataAccessLayer (MemoryDB)',
      action: `findById("${id}") -> ${item ? 'FOUND' : 'NOT_FOUND'}`,
      durationMs,
      details: item ? `Direct key lookup returned record "${item.name}".` : `Key "${id}" does not exist in store.`,
    };

    return { item: item ? { ...item } : null, trace };
  }

  public async findByName(name: string): Promise<{ item: Item | null; trace: LayerTrace }> {
    const start = performance.now();
    const normalized = name.trim().toLowerCase();
    const item = Array.from(this.items.values()).find(
      i => i.name.trim().toLowerCase() === normalized
    ) || null;
    const durationMs = Number((performance.now() - start).toFixed(2));

    const trace: LayerTrace = {
      layer: 'Data Access (Repository)',
      component: 'DataAccessLayer (MemoryDB)',
      action: `findByName("${name}") unique constraint check`,
      durationMs,
      details: item ? `Found conflicting record id "${item.id}".` : 'No conflicting record found.',
    };

    return { item: item ? { ...item } : null, trace };
  }

  public async create(item: Item): Promise<{ item: Item; trace: LayerTrace }> {
    const start = performance.now();
    this.items.set(item.id, { ...item });
    const durationMs = Number((performance.now() - start).toFixed(2));

    const trace: LayerTrace = {
      layer: 'Data Access (Repository)',
      component: 'DataAccessLayer (MemoryDB)',
      action: `create() persisted new entity with ID "${item.id}"`,
      durationMs,
      details: `Record stored. Total table count is now ${this.items.size}.`,
    };

    return { item: { ...item }, trace };
  }

  public async update(id: string, updates: Partial<Item>): Promise<{ item: Item | null; trace: LayerTrace }> {
    const start = performance.now();
    const existing = this.items.get(id);

    if (!existing) {
      const durationMs = Number((performance.now() - start).toFixed(2));
      return {
        item: null,
        trace: {
          layer: 'Data Access (Repository)',
          component: 'DataAccessLayer (MemoryDB)',
          action: `update("${id}") FAILED - entity not found`,
          durationMs,
          details: `Target primary key "${id}" was not present in repository.`,
        },
      };
    }

    const updatedItem: Item = {
      ...existing,
      ...updates,
      id: existing.id, // preserve immutable ID
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updatedItem);
    const durationMs = Number((performance.now() - start).toFixed(2));

    const trace: LayerTrace = {
      layer: 'Data Access (Repository)',
      component: 'DataAccessLayer (MemoryDB)',
      action: `update("${id}") applied changes (version ${updatedItem.version})`,
      durationMs,
      details: `Entity updated and persisted to in-memory store.`,
    };

    return { item: { ...updatedItem }, trace };
  }

  public async delete(id: string): Promise<{ success: boolean; trace: LayerTrace }> {
    const start = performance.now();
    const existed = this.items.delete(id);
    const durationMs = Number((performance.now() - start).toFixed(2));

    const trace: LayerTrace = {
      layer: 'Data Access (Repository)',
      component: 'DataAccessLayer (MemoryDB)',
      action: `delete("${id}") -> ${existed ? 'REMOVED' : 'NOT_FOUND'}`,
      durationMs,
      details: existed ? `Record purged. Remaining count: ${this.items.size}.` : `ID not found.`,
    };

    return { success: existed, trace };
  }

  public count(): number {
    return this.items.size;
  }
}

export const repository = new DataAccessLayer();
