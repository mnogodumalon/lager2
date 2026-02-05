// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface InventoryItems {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    sku?: string;
    category?: string;
    quantity?: number;
    min_quantity?: number;
    unit_price?: number;
    location?: string;
  };
}

export interface Categories {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
  };
}

export interface Locations {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    description?: string;
  };
}

export const APP_IDS = {
  INVENTORY_ITEMS: '698494eea42675c0592289b9',
  CATEGORIES: '69849c0c5f0cf3a1c2e74b63',
  LOCATIONS: '69849c0d44cdadf0f64c5a81',
} as const;

// Helper Types for creating new records
export type CreateInventoryItems = InventoryItems['fields'];
export type CreateCategories = Categories['fields'];
export type CreateLocations = Locations['fields'];