/**
 * Marketplace Integration Service
 * Central marketplace service coordinating suppliers, medicines, orders, and commerce
 */

import { v4 as uuidv4 } from 'uuid';
import { SupplierService } from './supplier-service';
import { OrderService } from './order-service';
import { GeminiMedicalClient } from './gemini-integration';
import { completeMedicineDatabase, getMedicinesByModality, searchMedicines, getMedicinesByCondition } from './medicines-database';
import { Medicine, Order, OrderItem } from './types';

/**
 * Marketplace Service Class
 */
export class MarketplaceService {
  private supplierService: SupplierService;
  private orderService: OrderService;
  private geminiClient: GeminiMedicalClient;

  constructor(geminiApiKey: string) {
    this.supplierService = new SupplierService();
    this.orderService = new OrderService();
    this.geminiClient = new GeminiMedicalClient(geminiApiKey);
  }

  /**
   * Get complete medicine catalog
   */
  getMedicineCatalog(): Medicine[] {
    return completeMedicineDatabase;
  }

  /**
   * Get medicines by modality
   */
  getMedicinesByModality(modality: 'allopathy' | 'ayurveda' | 'homeopathy'): Medicine[] {
    return getMedicinesByModality(modality);
  }

  /**
   * Search medicines
   */
  searchMedicines(query: string): Medicine[] {
    return searchMedicines(query);
  }

  /**
   * Get medicines by condition
   */
  getMedicinesByCondition(condition: string): Medicine[] {
    return getMedicinesByCondition(condition);
  }

  /**
   * Get medicine with supplier options
   */
  getMedicineWithSuppliers(medicineId: string, quantity: number = 1): {
    medicine: Medicine | null;
    suppliers: Array<{
      id: string;
      name: string;
      price_inr: number;
      price_usd: number;
      available_quantity: number;
      delivery_days: number;
      rating: number;
    }>;
    best_price: {
      price_inr: number;
      price_usd: number;
      supplier_name: string;
      savings: number;
    } | null;
  } {
    const medicine = completeMedicineDatabase.find(m => m.id === medicineId) || null;
    const suppliers = this.supplierService.getAvailableSuppliersForMedicine(medicineId, quantity);
    const bestPrice = this.supplierService.getBestPrice(medicineId, quantity);

    return {
      medicine,
      suppliers: suppliers.map(s => ({
        id: s.supplier.id,
        name: s.supplier.name,
        price_inr: s.price_inr,
        price_usd: s.price_usd,
        available_quantity: s.available_quantity,
        delivery_days: s.delivery_days,
        rating: s.rating,
      })),
      best_price: bestPrice
        ? {
            price_inr: bestPrice.price_inr,
            price_usd: bestPrice.price_usd,
            supplier_name: bestPrice.supplier.name,
            savings: bestPrice.savings,
          }
        : null,
    };
  }

  /**
   * Create medicine order
   */
  async createMedicineOrder(
    patientId: string,
    medicineItems: Array<{
      medicine_id: string;
      quantity: number;
      supplier_id: string;
    }>,
    shippingAddress: {
      address_line: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    },
    paymentMethod: string,
    prescriptionRequired: boolean = false,
    prescriptionFile?: string
  ): Order {
    // Validate medicines and suppliers
    const orderItems: OrderItem[] = [];

    for (const item of medicineItems) {
      const medicine = completeMedicineDatabase.find(m => m.id === item.medicine_id);
      if (!medicine) {
        throw new Error(`Medicine not found: ${item.medicine_id}`);
      }

      const supplier = this.supplierService.getSupplier(item.supplier_id);
      if (!supplier) {
        throw new Error(`Supplier not found: ${item.supplier_id}`);
      }

      const medicineSupplier = medicine.suppliers.find(s => s.supplier_id === item.supplier_id);
      if (!medicineSupplier) {
        throw new Error(`Medicine not available from supplier ${supplier.name}`);
      }

      orderItems.push({
        id: uuidv4(),
        medicine_id: item.medicine_id,
        medicine_name: medicine.generic_name,
        generic_name: medicine.generic_name,
        brand_name: medicine.brand_names[0],
        quantity: item.quantity,
        strength: medicine.strength,
        dosage_form: medicine.dosage_forms[0],
        price_inr: medicineSupplier.price_inr,
        price_usd: medicineSupplier.price_usd,
        supplier_id: item.supplier_id,
        supplier_name: supplier.name,
        delivery_days: supplier.delivery_days,
        requires_prescription: medicine.requires_prescription,
      });
    }

    // Create order
    return this.orderService.createOrder(
      patientId,
      orderItems,
      shippingAddress,
      paymentMethod,
      prescriptionRequired,
      prescriptionFile
    );
  }

  /**
   * Get patient orders
   */
  getPatientOrders(patientId: string) {
    return this.orderService.getOrders({ patient_id: patientId });
  }

  /**
   * Get order details
   */
  getOrderDetails(orderId: string) {
    return this.orderService.getOrder(orderId);
  }

  /**
   * Track order
   */
  trackOrder(orderId: string) {
    return this.orderService.getOrderTracking(orderId);
  }

  /**
   * Cancel order
   */
  cancelOrder(orderId: string, reason: string) {
    return this.orderService.cancelOrder(orderId, reason);
  }

  /**
   * Request return
   */
  requestReturn(
    orderId: string,
    items: Array<{ item_id: string; reason: string; quantity: number }>
  ) {
    return this.orderService.requestReturn(orderId, items);
  }

  /**
   * Get suppliers
   */
  getSuppliers(filter?: { type?: string; is_active?: boolean }) {
    return this.supplierService.getAllSuppliers(filter);
  }

  /**
   * Get supplier details
   */
  getSupplierDetails(supplierId: string) {
    return this.supplierService.getSupplier(supplierId);
  }

  /**
   * Get supplier metrics
   */
  getSupplierMetrics(supplierId: string) {
    return this.supplierService.getSupplierMetrics(supplierId);
  }

  /**
   * Rate supplier
   */
  rateSupplier(
    supplierId: string,
    rating: number,
    review: string,
    orderId: string,
    reviewerName: string
  ) {
    return this.supplierService.rateSupplier(supplierId, rating, review, orderId, reviewerName);
  }

  /**
   * Get supplier reviews
   */
  getSupplierReviews(supplierId: string, limit?: number) {
    return this.supplierService.getSupplierReviews(supplierId, limit);
  }

  /**
   * Search suppliers
   */
  searchSuppliers(query: string) {
    return this.supplierService.searchSuppliers(query);
  }

  /**
   * Recommend medicines based on condition with Gemini
   */
  async recommendMedicines(
    condition: string,
    symptoms: string[],
    preferredModality?: 'allopathy' | 'ayurveda' | 'homeopathy'
  ) {
    return this.geminiClient.recommendMedicines(condition, symptoms, preferredModality);
  }

  /**
   * Check medicine interactions
   */
  async checkMedicineInteractions(medicines: string[], age: number) {
    return this.geminiClient.checkMedicineInteractions(medicines, age);
  }

  /**
   * Analyze prescription
   */
  async analyzePrescription(
    medicines: string[],
    indications: string[],
    patientAge: number,
    patientComorbidities?: string[]
  ) {
    return this.geminiClient.analyzePrescription(
      medicines,
      indications,
      patientAge,
      patientComorbidities
    );
  }

  /**
   * Get health metrics analysis
   */
  async analyzeHealthMetrics(
    metrics: Record<string, number | string>,
    metricTypes: string[],
    patientAge: number,
    gender: string
  ) {
    return this.geminiClient.analyzeHealthMetrics(metrics, metricTypes, patientAge, gender);
  }

  /**
   * Generate personalized health plan
   */
  async generateHealthPlan(
    conditions: string[],
    currentMedicines: string[],
    age: number,
    gender: string,
    lifestyle: Record<string, any>
  ) {
    return this.geminiClient.generateHealthPlan(
      conditions,
      currentMedicines,
      age,
      gender,
      lifestyle
    );
  }

  /**
   * Get marketplace statistics
   */
  getMarketplaceStatistics() {
    const allMedicines = this.getMedicineCatalog();
    const allopathyCount = getMedicinesByModality('allopathy').length;
    const ayurvedaCount = getMedicinesByModality('ayurveda').length;
    const homeopathyCount = getMedicinesByModality('homeopathy').length;
    const suppliers = this.getSuppliers();
    const analytics = this.orderService.getOrderAnalytics();

    return {
      total_medicines: allMedicines.length,
      medicines_by_modality: {
        allopathy: allopathyCount,
        ayurveda: ayurvedaCount,
        homeopathy: homeopathyCount,
      },
      total_suppliers: suppliers.length,
      active_suppliers: suppliers.filter(s => s.is_active).length,
      verified_suppliers: suppliers.filter(s => s.is_verified).length,
      suppliers_by_type: {
        pharmacy_chain: suppliers.filter(s => s.type === 'pharmacy_chain').length,
        online_pharmacy: suppliers.filter(s => s.type === 'online_pharmacy').length,
        specialty_store: suppliers.filter(s => s.type === 'specialty_store').length,
      },
      orders_analytics: analytics,
    };
  }

  /**
   * Export medicines catalog to JSON
   */
  exportMedicinesCatalog(): string {
    return JSON.stringify(this.getMedicineCatalog(), null, 2);
  }

  /**
   * Export suppliers list
   */
  exportSuppliersList(): string {
    return JSON.stringify(this.getSuppliers(), null, 2);
  }
}

export default MarketplaceService;
