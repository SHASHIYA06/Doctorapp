/**
 * Supplier Management Service
 * Manages suppliers, inventory, ratings, and logistics
 */

import { v4 as uuidv4 } from 'uuid';
import { Supplier, SupplierRating, InventoryItem, SupplierMetrics } from './types';

/**
 * Supplier Database - Seed Data
 */
export const suppliers: Supplier[] = [
  {
    id: uuidv4(),
    name: 'Apollo Pharmacy',
    registration_number: 'AP-2020-001',
    type: 'pharmacy_chain',
    locations: ['Hyderabad', 'Bangalore', 'Chennai', 'Delhi', 'Mumbai'],
    contact_email: 'suppliers@apollopharmacy.in',
    contact_phone: '+91-40-23607777',
    website: 'https://www.apollopharmacy.com',
    license_number: 'PH-LIC-2020-001',
    license_expiry: '2025-12-31',
    gst_number: '27AABCA1234A2Z5',
    pan_number: 'AABCA1234A',
    bank_account: '****4567',
    ifsc_code: 'HDFC0001234',
    average_rating: 4.8,
    total_reviews: 523,
    delivery_days: 1,
    delivery_cost: 0,
    free_delivery_above: 500,
    return_policy_days: 7,
    medicines_catalog: 250,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Medplus',
    registration_number: 'MP-2019-001',
    type: 'online_pharmacy',
    locations: ['Hyderabad', 'Bangalore', 'Chennai'],
    contact_email: 'info@medplus.in',
    contact_phone: '+91-44-42103000',
    website: 'https://www.medplus.in',
    license_number: 'PH-LIC-2019-005',
    license_expiry: '2025-06-30',
    gst_number: '33AABCA1234B2Z9',
    pan_number: 'AABCA1234B',
    bank_account: '****5678',
    ifsc_code: 'ICIC0002345',
    average_rating: 4.7,
    total_reviews: 892,
    delivery_days: 1,
    delivery_cost: 0,
    free_delivery_above: 300,
    return_policy_days: 10,
    medicines_catalog: 180,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'NetMeds',
    registration_number: 'NM-2018-001',
    type: 'online_pharmacy',
    locations: ['All India'],
    contact_email: 'suppliers@netmeds.com',
    contact_phone: '+91-40-66556000',
    website: 'https://www.netmeds.com',
    license_number: 'PH-LIC-2018-003',
    license_expiry: '2026-03-31',
    gst_number: '29AABCA1234C2Z7',
    pan_number: 'AABCA1234C',
    bank_account: '****6789',
    ifsc_code: 'AXIS0003456',
    average_rating: 4.6,
    total_reviews: 654,
    delivery_days: 2,
    delivery_cost: 20,
    free_delivery_above: 500,
    return_policy_days: 7,
    medicines_catalog: 200,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Ayurvedic Store',
    registration_number: 'AS-2021-001',
    type: 'specialty_store',
    locations: ['Mumbai', 'Delhi', 'Bangalore'],
    contact_email: 'ayurveda@store.in',
    contact_phone: '+91-22-61111111',
    website: 'https://www.ayurvedicstore.in',
    license_number: 'PH-LIC-2021-002',
    license_expiry: '2024-12-31',
    gst_number: '27AABCA1234D2Z3',
    pan_number: 'AABCA1234D',
    bank_account: '****7890',
    ifsc_code: 'SBIN0004567',
    average_rating: 4.9,
    total_reviews: 432,
    delivery_days: 2,
    delivery_cost: 15,
    free_delivery_above: 800,
    return_policy_days: 14,
    medicines_catalog: 120,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Homeo Center',
    registration_number: 'HC-2020-001',
    type: 'specialty_store',
    locations: ['Delhi', 'Lucknow', 'Kanpur'],
    contact_email: 'homeo@center.in',
    contact_phone: '+91-120-4444444',
    website: 'https://www.homeocenter.in',
    license_number: 'PH-LIC-2020-004',
    license_expiry: '2025-09-30',
    gst_number: '09AABCA1234E2Z1',
    pan_number: 'AABCA1234E',
    bank_account: '****8901',
    ifsc_code: 'IDBI0005678',
    average_rating: 4.8,
    total_reviews: 432,
    delivery_days: 2,
    delivery_cost: 10,
    free_delivery_above: 600,
    return_policy_days: 10,
    medicines_catalog: 95,
    is_verified: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Supplier Service Class
 */
export class SupplierService {
  private suppliers: Map<string, Supplier> = new Map();
  private inventory: Map<string, InventoryItem[]> = new Map();
  private ratings: SupplierRating[] = [];
  private metrics: Map<string, SupplierMetrics> = new Map();

  constructor() {
    // Initialize suppliers
    suppliers.forEach(supplier => {
      this.suppliers.set(supplier.id, supplier);
      this.inventory.set(supplier.id, []);
    });
  }

  /**
   * Get all suppliers
   */
  getAllSuppliers(filter?: { type?: string; is_active?: boolean }): Supplier[] {
    let result = Array.from(this.suppliers.values());
    
    if (filter?.type) {
      result = result.filter(s => s.type === filter.type);
    }
    
    if (filter?.is_active !== undefined) {
      result = result.filter(s => s.is_active === filter.is_active);
    }

    return result.sort((a, b) => b.average_rating - a.average_rating);
  }

  /**
   * Get supplier by ID
   */
  getSupplier(supplierId: string): Supplier | null {
    return this.suppliers.get(supplierId) || null;
  }

  /**
   * Get supplier metrics
   */
  getSupplierMetrics(supplierId: string): SupplierMetrics | null {
    if (!this.metrics.has(supplierId)) {
      const supplier = this.suppliers.get(supplierId);
      if (!supplier) return null;

      const metrics: SupplierMetrics = {
        supplier_id: supplierId,
        total_orders: Math.floor(Math.random() * 1000 + 100),
        total_revenue: Math.floor(Math.random() * 10000000 + 1000000),
        average_order_value: Math.floor(Math.random() * 5000 + 1000),
        order_fulfillment_rate: 0.95 + Math.random() * 0.05,
        on_time_delivery_rate: 0.92 + Math.random() * 0.08,
        return_rate: Math.random() * 0.05,
        customer_satisfaction_score: 4.5 + Math.random() * 0.5,
        total_products: 150 + Math.floor(Math.random() * 350),
        active_products: 140 + Math.floor(Math.random() * 330),
        out_of_stock_products: Math.floor(Math.random() * 15),
        average_response_time_hours: Math.floor(Math.random() * 24 + 1),
        settlement_status: 'completed',
        last_settlement_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      this.metrics.set(supplierId, metrics);
    }
    return this.metrics.get(supplierId) || null;
  }

  /**
   * Add supplier rating/review
   */
  rateSupplier(
    supplierId: string,
    rating: number,
    review: string,
    orderId: string,
    reviewerName: string
  ): SupplierRating {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const newRating: SupplierRating = {
      id: uuidv4(),
      supplier_id: supplierId,
      rating: Math.max(1, Math.min(5, rating)),
      review,
      order_id: orderId,
      reviewer_name: reviewerName,
      helpful_count: 0,
      not_helpful_count: 0,
      created_at: new Date().toISOString(),
    };

    this.ratings.push(newRating);

    // Update supplier average rating
    const supplierRatings = this.ratings.filter(r => r.supplier_id === supplierId);
    const avgRating = supplierRatings.reduce((sum, r) => sum + r.rating, 0) / supplierRatings.length;
    supplier.average_rating = parseFloat(avgRating.toFixed(1));
    supplier.total_reviews = supplierRatings.length;

    return newRating;
  }

  /**
   * Get supplier reviews
   */
  getSupplierReviews(supplierId: string, limit: number = 10): SupplierRating[] {
    return this.ratings
      .filter(r => r.supplier_id === supplierId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Update inventory for supplier
   */
  updateInventory(supplierId: string, medicineId: string, quantity: number, price_inr: number): void {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const inventory = this.inventory.get(supplierId) || [];
    const item = inventory.find(i => i.medicine_id === medicineId);

    if (item) {
      item.quantity = quantity;
      item.price_inr = price_inr;
      item.updated_at = new Date().toISOString();
    } else {
      inventory.push({
        id: uuidv4(),
        supplier_id: supplierId,
        medicine_id: medicineId,
        quantity,
        price_inr,
        price_usd: price_inr / 83,
        min_stock_level: 10,
        reorder_quantity: 50,
        last_restocked: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    this.inventory.set(supplierId, inventory);
  }

  /**
   * Get available suppliers for medicine
   */
  getAvailableSuppliersForMedicine(medicineId: string, quantity: number = 1): Array<{
    supplier: Supplier;
    price_inr: number;
    price_usd: number;
    available_quantity: number;
    delivery_days: number;
    rating: number;
  }> {
    const results = [];

    for (const [supplierId, inventoryItems] of this.inventory.entries()) {
      const item = inventoryItems.find(i => i.medicine_id === medicineId);
      
      if (item && item.quantity >= quantity) {
        const supplier = this.suppliers.get(supplierId);
        if (supplier && supplier.is_active) {
          results.push({
            supplier,
            price_inr: item.price_inr,
            price_usd: item.price_usd,
            available_quantity: item.quantity,
            delivery_days: supplier.delivery_days,
            rating: supplier.average_rating,
          });
        }
      }
    }

    // Sort by rating and price
    return results.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.price_inr - b.price_inr;
    });
  }

  /**
   * Get best price for medicine
   */
  getBestPrice(medicineId: string, quantity: number = 1): {
    supplier: Supplier;
    price_inr: number;
    price_usd: number;
    savings: number;
  } | null {
    const suppliers = this.getAvailableSuppliersForMedicine(medicineId, quantity);
    if (suppliers.length === 0) return null;

    const best = suppliers[0];
    const max = Math.max(...suppliers.map(s => s.price_inr));
    const savings = max - best.price_inr;

    return {
      supplier: best.supplier,
      price_inr: best.price_inr,
      price_usd: best.price_usd,
      savings,
    };
  }

  /**
   * Add new supplier
   */
  addSupplier(supplier: Supplier): Supplier {
    const newSupplier = {
      ...supplier,
      id: uuidv4(),
      is_verified: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.suppliers.set(newSupplier.id, newSupplier);
    this.inventory.set(newSupplier.id, []);

    return newSupplier;
  }

  /**
   * Verify supplier
   */
  verifySupplier(supplierId: string): boolean {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return false;

    supplier.is_verified = true;
    supplier.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * Deactivate supplier
   */
  deactivateSupplier(supplierId: string, reason: string): boolean {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return false;

    supplier.is_active = false;
    supplier.updated_at = new Date().toISOString();
    console.log(`Supplier ${supplierId} deactivated. Reason: ${reason}`);

    return true;
  }

  /**
   * Get suppliers by type
   */
  getSuppliersByType(type: string): Supplier[] {
    return this.getAllSuppliers({ type, is_active: true });
  }

  /**
   * Search suppliers
   */
  searchSuppliers(query: string): Supplier[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.suppliers.values())
      .filter(s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.contact_email.toLowerCase().includes(lowerQuery) ||
        s.locations.some(loc => loc.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.average_rating - a.average_rating);
  }
}

export default SupplierService;
