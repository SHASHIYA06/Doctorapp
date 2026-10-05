/**
 * Order Management Service
 * Handles order creation, tracking, cancellation, and fulfillment
 */

import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem, OrderStatus, OrderTracking, OrderReturn } from './types';

export type OrderFilterOptions = {
  status?: OrderStatus;
  patient_id?: string;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
};

/**
 * Order Service Class
 */
export class OrderService {
  private orders: Map<string, Order> = new Map();
  private orderTracking: Map<string, OrderTracking> = new Map();
  private returns: Map<string, OrderReturn> = new Map();
  private orderCounter: number = 1000;

  /**
   * Create new order
   */
  createOrder(
    patientId: string,
    items: OrderItem[],
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
    const orderId = `ORD-${Date.now()}-${++this.orderCounter}`;

    const subtotal = items.reduce((sum, item) => sum + item.price_inr * item.quantity, 0);
    const tax = subtotal * 0.12; // 12% GST
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + tax + shipping;

    const order: Order = {
      id: orderId,
      patient_id: patientId,
      supplier_id: items[0].supplier_id, // Assuming single supplier for simplicity
      items,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'pending',
      subtotal,
      tax,
      shipping_cost: shipping,
      total,
      shipping_address: shippingAddress,
      estimated_delivery: this.getEstimatedDelivery(items[0].delivery_days || 1),
      actual_delivery: null,
      notes: '',
      prescription_required: prescriptionRequired,
      prescription_file: prescriptionFile,
      special_instructions: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.orders.set(orderId, order);

    // Create tracking record
    this.orderTracking.set(orderId, {
      id: uuidv4(),
      order_id: orderId,
      status: 'order_placed',
      location: 'Order Processing Center',
      timestamp: new Date().toISOString(),
      description: 'Order received and being prepared',
      events: [
        {
          status: 'order_placed',
          timestamp: new Date().toISOString(),
          description: 'Order placed by patient',
          location: 'Online',
        },
      ],
    });

    return order;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Get orders with filters
   */
  getOrders(filters?: OrderFilterOptions): Order[] {
    let results = Array.from(this.orders.values());

    if (filters?.status) {
      results = results.filter(o => o.status === filters.status);
    }

    if (filters?.patient_id) {
      results = results.filter(o => o.patient_id === filters.patient_id);
    }

    if (filters?.supplier_id) {
      results = results.filter(o => o.supplier_id === filters.supplier_id);
    }

    if (filters?.start_date) {
      const startDate = new Date(filters.start_date);
      results = results.filter(o => new Date(o.created_at) >= startDate);
    }

    if (filters?.end_date) {
      const endDate = new Date(filters.end_date);
      results = results.filter(o => new Date(o.created_at) <= endDate);
    }

    if (filters?.min_amount) {
      results = results.filter(o => o.total >= filters.min_amount!);
    }

    if (filters?.max_amount) {
      results = results.filter(o => o.total <= filters.max_amount!);
    }

    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.status = newStatus;
    order.notes = notes || '';
    order.updated_at = new Date().toISOString();

    // Update tracking
    const tracking = this.orderTracking.get(orderId);
    if (tracking) {
      tracking.status = newStatus;
      tracking.timestamp = new Date().toISOString();
      tracking.events.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        description: this.getStatusDescription(newStatus),
        location: this.getStatusLocation(newStatus),
      });
    }

    // Mark delivery if completed
    if (newStatus === 'delivered') {
      order.actual_delivery = new Date().toISOString();
      order.payment_status = 'completed';
    }

    return order;
  }

  /**
   * Mark payment as completed
   */
  markPaymentCompleted(orderId: string, transactionId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.payment_status = 'completed';
    order.updated_at = new Date().toISOString();
    console.log(`Payment completed for order ${orderId}. Transaction: ${transactionId}`);

    return order;
  }

  /**
   * Cancel order
   */
  cancelOrder(orderId: string, reason: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    // Can only cancel orders in certain statuses
    const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    order.status = 'cancelled';
    order.notes = reason;
    order.updated_at = new Date().toISOString();

    // Add tracking event
    const tracking = this.orderTracking.get(orderId);
    if (tracking) {
      tracking.events.push({
        status: 'cancelled',
        timestamp: new Date().toISOString(),
        description: `Order cancelled: ${reason}`,
        location: 'N/A',
      });
    }

    return order;
  }

  /**
   * Get order tracking
   */
  getOrderTracking(orderId: string): OrderTracking | null {
    return this.orderTracking.get(orderId) || null;
  }

  /**
   * Request return
   */
  requestReturn(
    orderId: string,
    items: Array<{ item_id: string; reason: string; quantity: number }>
  ): OrderReturn {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const returnId = `RET-${Date.now()}`;
    const returnAmount = items.reduce((sum, item) => {
      const orderItem = order.items.find(oi => oi.id === item.item_id);
      return sum + (orderItem?.price_inr || 0) * item.quantity;
    }, 0);

    const orderReturn: OrderReturn = {
      id: returnId,
      order_id: orderId,
      patient_id: order.patient_id,
      items,
      reason: items.map(i => i.reason).join(', '),
      status: 'pending',
      return_amount: returnAmount,
      refund_status: 'pending',
      notes: '',
      return_tracking_number: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.returns.set(returnId, orderReturn);
    return orderReturn;
  }

  /**
   * Get returns for order
   */
  getReturnsForOrder(orderId: string): OrderReturn[] {
    return Array.from(this.returns.values())
      .filter(r => r.order_id === orderId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Process return refund
   */
  processReturnRefund(returnId: string, approved: boolean = true): OrderReturn | null {
    const orderReturn = this.returns.get(returnId);
    if (!orderReturn) return null;

    if (approved) {
      orderReturn.status = 'approved';
      orderReturn.refund_status = 'processing';
    } else {
      orderReturn.status = 'rejected';
      orderReturn.refund_status = 'cancelled';
    }

    orderReturn.updated_at = new Date().toISOString();
    return orderReturn;
  }

  /**
   * Get order analytics
   */
  getOrderAnalytics(patientId?: string): {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    orders_by_status: Record<OrderStatus, number>;
    recent_orders: Order[];
  } {
    let orders = patientId 
      ? this.getOrders({ patient_id: patientId })
      : Array.from(this.orders.values());

    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const ordersByStatus: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    };

    orders.forEach(o => {
      ordersByStatus[o.status]++;
    });

    return {
      total_orders: orders.length,
      total_spent: totalSpent,
      average_order_value: orders.length > 0 ? totalSpent / orders.length : 0,
      orders_by_status: ordersByStatus,
      recent_orders: orders.slice(0, 5),
    };
  }

  /**
   * Helper: Get estimated delivery date
   */
  private getEstimatedDelivery(deliveryDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + deliveryDays);
    return date.toISOString();
  }

  /**
   * Helper: Get status description
   */
  private getStatusDescription(status: OrderStatus): string {
    const descriptions: Record<OrderStatus, string> = {
      pending: 'Order is pending confirmation',
      confirmed: 'Order has been confirmed by supplier',
      processing: 'Order is being prepared for shipment',
      shipped: 'Order has been shipped',
      delivered: 'Order has been delivered',
      cancelled: 'Order has been cancelled',
      returned: 'Order has been returned',
    };
    return descriptions[status] || 'Status updated';
  }

  /**
   * Helper: Get status location
   */
  private getStatusLocation(status: OrderStatus): string {
    const locations: Record<OrderStatus, string> = {
      pending: 'Supplier Warehouse',
      confirmed: 'Supplier Warehouse',
      processing: 'Supplier Warehouse',
      shipped: 'Transit',
      delivered: 'Delivery Address',
      cancelled: 'N/A',
      returned: 'Return Center',
    };
    return locations[status] || 'Unknown';
  }
}

export default OrderService;
