/**
 * Layer 3: Business Logic Layer (BLL) / Domain Service
 * 
 * Responsibility:
 * - Implements business rules and domain validations.
 * - Enforces business policies (e.g., minimum name length, duplicate prevention, status workflows).
 * - Calculates domain metrics and attributes (payload size estimates, tag normalization).
 * - Coordinates transactional flows between the API Controller and the Data Access Layer.
 * - Collects LayerTrace data showing duration and decisions made in the Business Logic tier.
 */

import type { Item, ItemCategory, ItemPriority, ItemStatus, LayerTrace } from '../../src/types/index.ts';
import { repository } from '../db/store.ts';

export interface CreateItemInput {
  name: string;
  category: ItemCategory;
  priority: ItemPriority;
  status?: ItemStatus;
  description?: string;
  tags?: string[];
}

export interface UpdateItemInput {
  name?: string;
  category?: ItemCategory;
  priority?: ItemPriority;
  status?: ItemStatus;
  description?: string;
  tags?: string[];
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  traces: LayerTrace[];
}

class ItemBusinessService {
  private readonly validCategories: ItemCategory[] = ['Infrastructure', 'Database', 'Microservice', 'Client', 'Security'];
  private readonly validPriorities: ItemPriority[] = ['low', 'medium', 'high', 'critical'];
  private readonly validStatuses: ItemStatus[] = ['active', 'maintenance', 'deprecated'];

  /**
   * Retrieves all items with optional domain filtering
   */
  public async getItems(filter?: { category?: string; query?: string }): Promise<ServiceResult<Item[]>> {
    const start = performance.now();
    const traces: LayerTrace[] = [];

    // Layer 3 Execution
    traces.push({
      layer: 'Business Logic (Service)',
      component: 'ItemBusinessService',
      action: 'Filtering and query sanitization rules applied',
      durationMs: 0.2,
      details: `Processed filters: category=${filter?.category || 'all'}, query="${filter?.query || ''}"`,
    });

    // Delegate to Layer 4 (DAL)
    const { items, trace: dalTrace } = await repository.findAll(filter);
    traces.push(dalTrace);

    const bllEnd = performance.now();
    traces[0].durationMs = Number((bllEnd - start - dalTrace.durationMs).toFixed(2));

    return {
      success: true,
      data: items,
      traces,
    };
  }

  /**
   * Retrieves a single item by ID
   */
  public async getItemById(id: string): Promise<ServiceResult<Item>> {
    const start = performance.now();
    const traces: LayerTrace[] = [];

    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid entity identifier provided',
        errorCode: 'ERR_INVALID_ID',
        traces: [
          {
            layer: 'Business Logic (Service)',
            component: 'ItemBusinessService',
            action: 'ID validation rule failed',
            durationMs: Number((performance.now() - start).toFixed(2)),
            details: 'Identifier must be a non-empty string.',
          },
        ],
      };
    }

    const { item, trace: dalTrace } = await repository.findById(id);
    traces.push(dalTrace);

    if (!item) {
      traces.unshift({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Entity lookup evaluated: Not Found',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: `Entity with ID "${id}" does not exist in domain registry.`,
      });

      return {
        success: false,
        error: `Resource with identifier '${id}' was not found.`,
        errorCode: 'ERR_NOT_FOUND',
        traces,
      };
    }

    traces.unshift({
      layer: 'Business Logic (Service)',
      component: 'ItemBusinessService',
      action: 'Entity lookup confirmed active',
      durationMs: Number((performance.now() - start - dalTrace.durationMs).toFixed(2)),
      details: `Verified entity status: "${item.status}", priority: "${item.priority}".`,
    });

    return {
      success: true,
      data: item,
      traces,
    };
  }

  /**
   * Creates a new item, executing business validation and persistence
   */
  public async createItem(input: CreateItemInput): Promise<ServiceResult<Item>> {
    const start = performance.now();
    const traces: LayerTrace[] = [];

    // Business Rule 1: Name validation (length between 3 and 100)
    if (!input.name || input.name.trim().length < 3) {
      traces.push({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Business rule check failed: Name too short',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: 'Entity name must be at least 3 characters long.',
      });
      return {
        success: false,
        error: 'Business rule violation: Item name must be at least 3 characters.',
        errorCode: 'ERR_VALIDATION_NAME_LENGTH',
        traces,
      };
    }

    if (input.name.trim().length > 100) {
      traces.push({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Business rule check failed: Name exceeds max length',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: 'Entity name cannot exceed 100 characters.',
      });
      return {
        success: false,
        error: 'Business rule violation: Item name exceeds 100 characters.',
        errorCode: 'ERR_VALIDATION_NAME_LENGTH',
        traces,
      };
    }

    // Business Rule 2: Category validation
    if (!this.validCategories.includes(input.category)) {
      traces.push({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Business rule check failed: Invalid category',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: `Category must be one of: ${this.validCategories.join(', ')}`,
      });
      return {
        success: false,
        error: `Business rule violation: Category '${input.category}' is invalid. Allowed: ${this.validCategories.join(', ')}`,
        errorCode: 'ERR_INVALID_CATEGORY',
        traces,
      };
    }

    // Business Rule 3: Priority validation
    if (!this.validPriorities.includes(input.priority)) {
      traces.push({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Business rule check failed: Invalid priority',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: `Priority must be one of: ${this.validPriorities.join(', ')}`,
      });
      return {
        success: false,
        error: `Business rule violation: Priority '${input.priority}' is invalid. Allowed: ${this.validPriorities.join(', ')}`,
        errorCode: 'ERR_INVALID_PRIORITY',
        traces,
      };
    }

    // Business Rule 4: Duplicate name prevention
    const { item: existing, trace: dupTrace } = await repository.findByName(input.name);
    traces.push(dupTrace);

    if (existing) {
      traces.unshift({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Business rule check failed: Duplicate entity name',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: `An entity with name '${input.name}' already exists with ID '${existing.id}'.`,
      });
      return {
        success: false,
        error: `Business rule violation: An entity named '${input.name}' already exists.`,
        errorCode: 'ERR_DUPLICATE_NAME',
        traces,
      };
    }

    // Domain Enrichment: Compute payload size, tags, timestamps
    const cleanTags = (input.tags || [])
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
    if (!cleanTags.includes(input.category.toLowerCase())) {
      cleanTags.push(input.category.toLowerCase());
    }

    const generatedId = `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const estimatedSize = Number((0.5 + Math.random() * 15 + input.name.length * 0.1).toFixed(1));

    const newItem: Item = {
      id: generatedId,
      name: input.name.trim(),
      category: input.category,
      priority: input.priority,
      status: input.status || 'active',
      description: input.description?.trim() || `Configured ${input.category} component within layered system.`,
      tags: cleanTags,
      payloadSizeKb: estimatedSize,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Delegate persistence to Layer 4
    const { item: persisted, trace: dalTrace } = await repository.create(newItem);
    traces.push(dalTrace);

    const bllDuration = Number((performance.now() - start - dalTrace.durationMs - dupTrace.durationMs).toFixed(2));
    traces.unshift({
      layer: 'Business Logic (Service)',
      component: 'ItemBusinessService',
      action: 'Domain validation passed & Entity enriched',
      durationMs: Math.max(0.1, bllDuration),
      details: `Generated ID '${generatedId}', calculated payload size ${estimatedSize}KB, sanitized ${cleanTags.length} tags.`,
    });

    return {
      success: true,
      data: persisted,
      traces,
    };
  }

  /**
   * Updates an existing item with business rule evaluation
   */
  public async updateItem(id: string, updates: UpdateItemInput): Promise<ServiceResult<Item>> {
    const start = performance.now();
    const traces: LayerTrace[] = [];

    // Check existence first
    const { item: existing, trace: checkTrace } = await repository.findById(id);
    traces.push(checkTrace);

    if (!existing) {
      traces.unshift({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Update rejected: Target not found',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: `Cannot update non-existent entity with ID '${id}'.`,
      });
      return {
        success: false,
        error: `Resource with identifier '${id}' was not found.`,
        errorCode: 'ERR_NOT_FOUND',
        traces,
      };
    }

    // Validate update fields if present
    if (updates.name !== undefined) {
      if (updates.name.trim().length < 3) {
        return {
          success: false,
          error: 'Business rule violation: Updated name must be at least 3 characters.',
          errorCode: 'ERR_VALIDATION_NAME_LENGTH',
          traces: [
            {
              layer: 'Business Logic (Service)',
              component: 'ItemBusinessService',
              action: 'Validation failed on update payload',
              durationMs: 0.2,
              details: 'Name length below minimum constraint.',
            },
          ],
        };
      }
    }

    if (updates.category !== undefined && !this.validCategories.includes(updates.category)) {
      return {
        success: false,
        error: `Invalid category '${updates.category}'.`,
        errorCode: 'ERR_INVALID_CATEGORY',
        traces: [
          {
            layer: 'Business Logic (Service)',
            component: 'ItemBusinessService',
            action: 'Validation failed: Invalid category',
            durationMs: 0.2,
          },
        ],
      };
    }

    if (updates.priority !== undefined && !this.validPriorities.includes(updates.priority)) {
      return {
        success: false,
        error: `Invalid priority '${updates.priority}'.`,
        errorCode: 'ERR_INVALID_PRIORITY',
        traces: [
          {
            layer: 'Business Logic (Service)',
            component: 'ItemBusinessService',
            action: 'Validation failed: Invalid priority',
            durationMs: 0.2,
          },
        ],
      };
    }

    // Delegate persistence to Layer 4
    const { item: updated, trace: dalTrace } = await repository.update(id, updates);
    traces.push(dalTrace);

    traces.unshift({
      layer: 'Business Logic (Service)',
      component: 'ItemBusinessService',
      action: 'Business rules approved update; incremented version',
      durationMs: Number((performance.now() - start - dalTrace.durationMs - checkTrace.durationMs).toFixed(2)),
      details: `Entity '${id}' bumped to version ${updated?.version}.`,
    });

    return {
      success: true,
      data: updated || undefined,
      traces,
    };
  }

  /**
   * Deletes an item by ID
   */
  public async deleteItem(id: string): Promise<ServiceResult<{ deletedId: string }>> {
    const start = performance.now();
    const traces: LayerTrace[] = [];

    // Verify entity
    const { item: existing, trace: checkTrace } = await repository.findById(id);
    traces.push(checkTrace);

    if (!existing) {
      traces.unshift({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Delete rejected: Target not found',
        durationMs: 0.2,
        details: `Cannot delete non-existent entity with ID '${id}'.`,
      });
      return {
        success: false,
        error: `Resource with identifier '${id}' was not found.`,
        errorCode: 'ERR_NOT_FOUND',
        traces,
      };
    }

    // Prevent deletion of protected system infrastructure components
    if (existing.priority === 'critical' && existing.id.startsWith('node-srv')) {
      traces.unshift({
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Business policy blocked deletion of critical root component',
        durationMs: 0.3,
        details: 'System policy prevents removing the primary gateway component.',
      });
      return {
        success: false,
        error: 'Business rule violation: Protected root infrastructure component cannot be removed.',
        errorCode: 'ERR_PROTECTED_ENTITY',
        traces,
      };
    }

    const { success, trace: dalTrace } = await repository.delete(id);
    traces.push(dalTrace);

    traces.unshift({
      layer: 'Business Logic (Service)',
      component: 'ItemBusinessService',
      action: 'Domain authorization granted for deletion',
      durationMs: Number((performance.now() - start - dalTrace.durationMs - checkTrace.durationMs).toFixed(2)),
      details: `Entity '${id}' successfully removed from domain.`,
    });

    return {
      success,
      data: { deletedId: id },
      traces,
    };
  }

  /**
   * Reset data to default seed
   */
  public async resetToSeed(): Promise<ServiceResult<{ count: number }>> {
    const start = performance.now();
    repository.seedDefaultData();
    const count = repository.count();

    const traces: LayerTrace[] = [
      {
        layer: 'Business Logic (Service)',
        component: 'ItemBusinessService',
        action: 'Executed domain reset to default seed state',
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: `Initialized database with ${count} verified architectural items.`,
      },
      {
        layer: 'Data Access (Repository)',
        component: 'DataAccessLayer (MemoryDB)',
        action: 'Purged repository and seeded default dataset',
        durationMs: 0.5,
        details: `Loaded standard test dataset.`,
      },
    ];

    return {
      success: true,
      data: { count },
      traces,
    };
  }
}

export const itemService = new ItemBusinessService();
