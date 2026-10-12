/**
 * Client-Server Architecture Demonstration - Shared Type Definitions
 */

export type ItemCategory = 'Infrastructure' | 'Database' | 'Microservice' | 'Client' | 'Security';
export type ItemStatus = 'active' | 'maintenance' | 'deprecated';
export type ItemPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  status: ItemStatus;
  priority: ItemPriority;
  payloadSizeKb: number;
  description: string;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LayerTrace {
  layer: 'Client UI' | 'Transport / API' | 'Business Logic (Service)' | 'Data Access (Repository)';
  component: string;
  action: string;
  durationMs: number;
  details?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta: {
    requestId: string;
    timestamp: string;
    executionTimeMs: number;
    layerTrace: LayerTrace[];
  };
}

export interface RequestWireLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseHeaders: Record<string, string>;
  responseBody?: any;
  layerTrace: LayerTrace[];
}

export interface ServerHealth {
  status: 'healthy' | 'degraded' | 'error';
  uptimeSeconds: number;
  serverTime: string;
  architecture: string;
  environment: string;
  activeLayerStack: string[];
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    totalEntities: number;
  };
}

export interface VerificationTest {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedStatus: number;
  actualStatus?: number;
  passed?: boolean;
  latencyMs?: number;
  error?: string;
  details?: string;
  responsePreview?: any;
  trace?: LayerTrace[];
}
