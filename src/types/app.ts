// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface InventoryItems {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    sku?: string;
    category?: 'electronics' | 'furniture' | 'office';
    quantity?: number;
    min_quantity?: number;
    unit_price?: number;
    location?: string;
  };
}

export const APP_IDS = {
  INVENTORY_ITEMS: '698494eea42675c0592289b9',
} as const;

// Helper Types for creating new records
export type CreateInventoryItems = InventoryItems['fields'];