/**
 * Shopping Cart Component
 * Displays cart items, prices, and checkout options
 */

import React, { useState } from 'react';
import './ShoppingCart.css';

interface CartItem {
  id: string;
  medicine_name: string;
  quantity: number;
  price_inr: number;
  supplier_name: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onRemoveItem: (medicineId: string) => void;
  onUpdateQuantity: (medicineId: string, quantity: number) => void;
  onCheckout: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price_inr * item.quantity, 0);
  const tax = subtotal * 0.12;
  const shipping = subtotal > 500 ? 0 : 50;
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const total = subtotal + tax + shipping - discount;

  const handleApplyCoupon = () => {
    if (couponCode === 'SAVE10') {
      setAppliedCoupon({ code: 'SAVE10', discount: 10 });
    } else if (couponCode === 'SAVE20') {
      setAppliedCoupon({ code: 'SAVE20', discount: 20 });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  if (items.length === 0) {
    return (
      <div className="shopping-cart empty-cart">
        <div className="empty-state">
          <span className="empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Start shopping to add items to your cart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h2>Shopping Cart</h2>
        <span className="item-count">{items.length} items</span>
      </div>

      <div className="cart-container">
        {/* Cart Items */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="item-details">
                <h4>{item.medicine_name}</h4>
                <p className="supplier">{item.supplier_name}</p>
                <p className="unit-price">₹{item.price_inr} each</p>
              </div>

              <div className="quantity-control">
                <button
                  onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="qty-btn"
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                  className="qty-input"
                />
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="qty-btn"
                >
                  +
                </button>
              </div>

              <div className="item-price">
                <p className="total-price">₹{(item.price_inr * item.quantity).toFixed(2)}</p>
              </div>

              <button
                onClick={() => onRemoveItem(item.id)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar: Price Summary and Checkout */}
        <div className="cart-sidebar">
          {/* Coupon Section */}
          <div className="coupon-section">
            <h3>Apply Coupon</h3>
            {appliedCoupon ? (
              <div className="coupon-applied">
                <p>✓ Coupon applied: {appliedCoupon.code}</p>
                <p className="discount-text">Saving {appliedCoupon.discount}%</p>
                <button
                  onClick={handleRemoveCoupon}
                  className="remove-coupon-btn"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="coupon-input"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="apply-coupon-btn"
                >
                  Apply
                </button>
              </div>
            )}
            <p className="coupon-hint">Try: SAVE10 or SAVE20</p>
          </div>

          {/* Price Summary */}
          <div className="price-summary">
            <h3>Order Summary</h3>

            <div className="price-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="price-row">
              <span>Tax (12% GST)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>

            <div className="price-row">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'free' : ''}>
                {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
              </span>
            </div>

            {discount > 0 && (
              <div className="price-row discount">
                <span>Discount ({appliedCoupon?.discount}%)</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}

            <div className="price-row total">
              <span>Total Amount</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            className="checkout-btn"
          >
            Proceed to Checkout
          </button>

          {/* Security Badge */}
          <div className="security-badge">
            <span>🔒</span>
            <p>Secure checkout with encrypted payment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
