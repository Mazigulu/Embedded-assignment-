/**
 * Layer 2: API / Transport Controller Layer
 * 
 * Responsibility:
 * - HTTP Protocol Endpoint definitions (RESTful routing).
 * - Request header parsing, correlation ID injection (X-Request-ID).
 * - Request payload unmarshaling and sanitization.
 * - Calling Layer 3 (Business Logic Service) without leaking database/DAL details.
 * - HTTP Status Code mapping (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 409 Conflict, 422 Unprocessable).
 * - Response serialization and performance telemetry recording.
 */

import type { Request, Response } from 'express';
import type { ApiResponse, LayerTrace } from '../../src/types/index.ts';
import { itemService } from '../services/itemService.ts';

export class ItemController {
  /**
   * Helper to build standardized API response
   */
  private static sendResponse<T>(
    req: Request,
    res: Response,
    statusCode: number,
    data?: T,
    error?: string,
    errorCode?: string,
    serviceTraces: LayerTrace[] = [],
    transportDurationMs = 0.5
  ) {
    const requestId = (req.headers['x-request-id'] as string) || `req-${Math.random().toString(36).substring(2, 9)}`;
    const transportTrace: LayerTrace = {
      layer: 'Transport / API',
      component: 'ItemController (Express Router)',
      action: `HTTP ${req.method} ${req.originalUrl} -> Status ${statusCode}`,
      durationMs: Number(transportDurationMs.toFixed(2)),
      details: `Dispatched by Express router. Request ID: ${requestId}. Content-Type: application/json.`,
    };

    const combinedTraces: LayerTrace[] = [transportTrace, ...serviceTraces];
    const totalExecutionTimeMs = Number(
      combinedTraces.reduce((acc, t) => acc + (t.durationMs || 0), 0).toFixed(2)
    );

    const payload: ApiResponse<T> = {
      success: statusCode >= 200 && statusCode < 300,
      ...(data !== undefined && { data }),
      ...(error && { error }),
      ...(errorCode && { code: errorCode }),
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTimeMs: totalExecutionTimeMs,
        layerTrace: combinedTraces,
      },
    };

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time-Ms', totalExecutionTimeMs.toString());
    res.setHeader('X-Architecture-Tier', 'Presentation/API -> Controller -> BLL -> DAL');

    return res.status(statusCode).json(payload);
  }

  /**
   * Map domain service error codes to HTTP status codes
   */
  private static mapErrorCodeToStatus(code?: string): number {
    switch (code) {
      case 'ERR_NOT_FOUND':
        return 404;
      case 'ERR_DUPLICATE_NAME':
        return 409;
      case 'ERR_VALIDATION_NAME_LENGTH':
      case 'ERR_INVALID_CATEGORY':
      case 'ERR_INVALID_PRIORITY':
        return 422;
      case 'ERR_PROTECTED_ENTITY':
        return 403;
      case 'ERR_INVALID_ID':
        return 400;
      default:
        return 400;
    }
  }

  /**
   * GET /api/items
   */
  public static async getAll(req: Request, res: Response) {
    const t0 = performance.now();
    const { category, query } = req.query;

    const result = await itemService.getItems({
      category: category as string,
      query: query as string,
    });

    const tTransport = performance.now() - t0;
    return ItemController.sendResponse(
      req,
      res,
      200,
      result.data,
      undefined,
      undefined,
      result.traces,
      tTransport
    );
  }

  /**
   * GET /api/items/:id
   */
  public static async getById(req: Request, res: Response) {
    const t0 = performance.now();
    const { id } = req.params;

    const result = await itemService.getItemById(id);
    const tTransport = performance.now() - t0;

    if (!result.success) {
      const status = ItemController.mapErrorCodeToStatus(result.errorCode);
      return ItemController.sendResponse(
        req,
        res,
        status,
        undefined,
        result.error,
        result.errorCode,
        result.traces,
        tTransport
      );
    }

    return ItemController.sendResponse(
      req,
      res,
      200,
      result.data,
      undefined,
      undefined,
      result.traces,
      tTransport
    );
  }

  /**
   * POST /api/items
   */
  public static async create(req: Request, res: Response) {
    const t0 = performance.now();
    const { name, category, priority, status, description, tags } = req.body;

    const result = await itemService.createItem({
      name,
      category,
      priority,
      status,
      description,
      tags,
    });

    const tTransport = performance.now() - t0;

    if (!result.success) {
      const status = ItemController.mapErrorCodeToStatus(result.errorCode);
      return ItemController.sendResponse(
        req,
        res,
        status,
        undefined,
        result.error,
        result.errorCode,
        result.traces,
        tTransport
      );
    }

    return ItemController.sendResponse(
      req,
      res,
      201, // Created
      result.data,
      undefined,
      undefined,
      result.traces,
      tTransport
    );
  }

  /**
   * PUT /api/items/:id
   */
  public static async update(req: Request, res: Response) {
    const t0 = performance.now();
    const { id } = req.params;
    const updates = req.body;

    const result = await itemService.updateItem(id, updates);
    const tTransport = performance.now() - t0;

    if (!result.success) {
      const status = ItemController.mapErrorCodeToStatus(result.errorCode);
      return ItemController.sendResponse(
        req,
        res,
        status,
        undefined,
        result.error,
        result.errorCode,
        result.traces,
        tTransport
      );
    }

    return ItemController.sendResponse(
      req,
      res,
      200,
      result.data,
      undefined,
      undefined,
      result.traces,
      tTransport
    );
  }

  /**
   * DELETE /api/items/:id
   */
  public static async delete(req: Request, res: Response) {
    const t0 = performance.now();
    const { id } = req.params;

    const result = await itemService.deleteItem(id);
    const tTransport = performance.now() - t0;

    if (!result.success) {
      const status = ItemController.mapErrorCodeToStatus(result.errorCode);
      return ItemController.sendResponse(
        req,
        res,
        status,
        undefined,
        result.error,
        result.errorCode,
        result.traces,
        tTransport
      );
    }

    return ItemController.sendResponse(
      req,
      res,
      200,
      result.data,
      undefined,
      undefined,
      result.traces,
      tTransport
    );
  }

  /**
   * POST /api/reset
   */
  public static async reset(req: Request, res: Response) {
    const t0 = performance.now();
    const result = await itemService.resetToSeed();
    const tTransport = performance.now() - t0;

    return ItemController.sendResponse(
      req,
      res,
      200,
      result.data,
      undefined,
      undefined,
      result.traces,
      tTransport
    );
  }
}
