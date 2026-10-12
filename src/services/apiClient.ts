/**
 * Client-Side API Communication Service (Presentation Tier)
 * 
 * Responsibility:
 * - Initiates real HTTP/REST requests to Express backend.
 * - Injects client tracing headers (X-Client-Timestamp, X-Request-ID).
 * - Measures complete Client-to-Server round-trip latency.
 * - Appends client presentation layer trace to meta traces.
 * - Normalizes network errors and response status codes.
 */

import { ApiResponse, Item, LayerTrace, RequestWireLog, ServerHealth } from '../types/index.ts';

export interface ClientFetchResult<T> {
  response: ApiResponse<T>;
  status: number;
  clientRoundtripMs: number;
  combinedTrace: LayerTrace[];
  isError: boolean;
}

class ApiClientService {
  private baseUrl = '';

  private async execute<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ClientFetchResult<T>> {
    const tClientStart = performance.now();
    const requestId = `cli-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Client-Timestamp': new Date().toISOString(),
      ...(options.headers as Record<string, string>),
    };

    let status = 0;
    let data: ApiResponse<T>;

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      status = res.status;
      data = await res.json();
    } catch (err: any) {
      const tClientEnd = performance.now();
      const clientRoundtripMs = Number((tClientEnd - tClientStart).toFixed(2));

      const clientFailTrace: LayerTrace = {
        layer: 'Client UI',
        component: 'ApiClient (Fetch Transport)',
        action: `HTTP Network Transport Failure: ${err?.message || 'Network unreachable'}`,
        durationMs: clientRoundtripMs,
        details: 'Failed to complete TCP/HTTP handshake with localhost:3000.',
      };

      return {
        response: {
          success: false,
          error: err?.message || 'Network connection error',
          code: 'ERR_CLIENT_NETWORK',
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            executionTimeMs: clientRoundtripMs,
            layerTrace: [clientFailTrace],
          },
        },
        status: 0,
        clientRoundtripMs,
        combinedTrace: [clientFailTrace],
        isError: true,
      };
    }

    const tClientEnd = performance.now();
    const clientRoundtripMs = Number((tClientEnd - tClientStart).toFixed(2));

    const clientTrace: LayerTrace = {
      layer: 'Client UI',
      component: 'ApiClient (Fetch Transport)',
      action: `Dispatched HTTP ${options.method || 'GET'} & Received HTTP ${status}`,
      durationMs: Number((clientRoundtripMs - (data.meta?.executionTimeMs || 0)).toFixed(2)),
      details: `Total round-trip: ${clientRoundtripMs}ms. Network transit time: ${(clientRoundtripMs - (data.meta?.executionTimeMs || 0)).toFixed(2)}ms.`,
    };

    const combinedTrace: LayerTrace[] = [
      clientTrace,
      ...(data.meta?.layerTrace || []),
    ];

    return {
      response: data,
      status,
      clientRoundtripMs,
      combinedTrace,
      isError: !data.success || status >= 400,
    };
  }

  public async getHealth(): Promise<ClientFetchResult<ServerHealth>> {
    return this.execute<ServerHealth>('/api/health');
  }

  public async getMetrics(): Promise<ClientFetchResult<any>> {
    return this.execute<any>('/api/metrics');
  }

  public async getRecentRequests(): Promise<ClientFetchResult<RequestWireLog[]>> {
    return this.execute<RequestWireLog[]>('/api/requests/recent');
  }

  public async getItems(filter?: { category?: string; query?: string }): Promise<ClientFetchResult<Item[]>> {
    const params = new URLSearchParams();
    if (filter?.category && filter.category !== 'all') params.set('category', filter.category);
    if (filter?.query) params.set('query', filter.query);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.execute<Item[]>(`/api/items${qs}`);
  }

  public async getItemById(id: string): Promise<ClientFetchResult<Item>> {
    return this.execute<Item>(`/api/items/${id}`);
  }

  public async createItem(item: Partial<Item>): Promise<ClientFetchResult<Item>> {
    return this.execute<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  public async updateItem(id: string, updates: Partial<Item>): Promise<ClientFetchResult<Item>> {
    return this.execute<Item>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteItem(id: string): Promise<ClientFetchResult<{ deletedId: string }>> {
    return this.execute<{ deletedId: string }>(`/api/items/${id}`, {
      method: 'DELETE',
    });
  }

  public async resetData(): Promise<ClientFetchResult<{ count: number }>> {
    return this.execute<{ count: number }>('/api/reset', {
      method: 'POST',
    });
  }

  public async echo(payload: any, delayMs = 0): Promise<ClientFetchResult<any>> {
    const qs = delayMs > 0 ? `?delay=${delayMs}` : '';
    return this.execute<any>(`/api/echo${qs}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async simulateError(type: string, message: string): Promise<ClientFetchResult<any>> {
    return this.execute<any>('/api/simulate-error', {
      method: 'POST',
      body: JSON.stringify({ type, message }),
    });
  }

  public async getAssessmentInfo(): Promise<ClientFetchResult<any>> {
    return this.execute<any>('/api/assessment-info');
  }
}

export const apiClient = new ApiClientService();
