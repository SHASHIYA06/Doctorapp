/**
 * Medicines Marketplace Component
 * Beautiful, responsive marketplace for browsing and purchasing medicines
 * Features: Search, filter by modality, supplier comparison, price comparison
 */

import React, { useState, useMemo } from 'react';
import './MedicinesMarketplace.css';

interface Medicine {
  id: string;
  generic_name: string;
  brand_names: string[];
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  therapeutic_category: string;
  strength: string;
  indications: string[];
  price_inr: number;
  price_usd: number;
  requires_prescription: boolean;
  otc_available: boolean;
}

interface Supplier {
  id: string;
  name: string;
  rating: number;
  price_inr: number;
  delivery_days: number;
}

interface MedicineWithSuppliers extends Medicine {
  suppliers: Supplier[];
  best_price: number;
}

export const MedicinesMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<'all' | 'allopathy' | 'ayurveda' | 'homeopathy'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_low_to_high' | 'price_high_to_low' | 'rating' | 'delivery'>('price_low_to_high');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineWithSuppliers | null>(null);

  // Mock data - In production, this would come from the marketplace service
  const medicines: MedicineWithSuppliers[] = useMemo(() => [
    {
      id: '1',
      generic_name: 'Amoxicillin',
      brand_names: ['Amoxyl', 'Moxcil'],
      modality: 'allopathy',
      therapeutic_category: 'Antibiotic',
      strength: '500mg',
      indications: ['Bacterial infections', 'Respiratory infections'],
      price_inr: 45,
      price_usd: 0.54,
      requires_prescription: true,
      otc_available: false,
      suppliers: [
        { id: 's1', name: 'Apollo Pharmacy', rating: 4.8, price_inr: 45, delivery_days: 1 },
        { id: 's2', name: 'Medplus', rating: 4.7, price_inr: 48, delivery_days: 1 },
      ],
      best_price: 45,
    },
    {
      id: '2',
      generic_name: 'Ashwagandha',
      brand_names: ['Ashwagandha Capsules', 'Withanium'],
      modality: 'ayurveda',
      therapeutic_category: 'Adaptogen',
      strength: '500mg',
      indications: ['Stress relief', 'Sleep improvement'],
      price_inr: 200,
      price_usd: 2.40,
      requires_prescription: false,
      otc_available: true,
      suppliers: [
        { id: 's3', name: 'Ayurvedic Store', rating: 4.9, price_inr: 200, delivery_days: 2 },
        { id: 's1', name: 'Apollo Pharmacy', rating: 4.8, price_inr: 220, delivery_days: 1 },
      ],
      best_price: 200,
    },
    {
      id: '3',
      generic_name: 'Arnica Montana',
      brand_names: ['Arnica 30CH', 'Arnica 200CH'],
      modality: 'homeopathy',
      therapeutic_category: 'Trauma/Injuries',
      strength: '30CH',
      indications: ['Bruises', 'Muscle soreness'],
      price_inr: 50,
      price_usd: 0.60,
      requires_prescription: false,
      otc_available: true,
      suppliers: [
        { id: 's4', name: 'Homeo Center', rating: 4.8, price_inr: 50, delivery_days: 2 },
      ],
      best_price: 50,
    },
  ], []);

  // Filter and sort medicines
  const filteredMedicines = useMemo(() => {
    let filtered = medicines;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.generic_name.toLowerCase().includes(query) ||
        m.brand_names.some(b => b.toLowerCase().includes(query)) ||
        m.therapeutic_category.toLowerCase().includes(query)
      );
    }

    // Apply modality filter
    if (selectedModality !== 'all') {
      filtered = filtered.filter(m => m.modality === selectedModality);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.therapeutic_category === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low_to_high':
          return a.best_price - b.best_price;
        case 'price_high_to_low':
          return b.best_price - a.best_price;
        case 'delivery':
          return Math.min(...a.suppliers.map(s => s.delivery_days)) -
                 Math.min(...b.suppliers.map(s => s.delivery_days));
        case 'rating':
          return Math.max(...b.suppliers.map(s => s.rating)) -
                 Math.max(...a.suppliers.map(s => s.rating));
        default:
          return 0;
      }
    });

    return filtered;
  }, [medicines, searchQuery, selectedModality, selectedCategory, sortBy]);

  const handleAddToCart = (medicineId: string) => {
    const newCart = new Map(cart);
    newCart.set(medicineId, (newCart.get(medicineId) || 0) + 1);
    setCart(newCart);
  };

  const handleRemoveFromCart = (medicineId: string) => {
    const newCart = new Map(cart);
    const quantity = newCart.get(medicineId) || 0;
    if (quantity > 1) {
      newCart.set(medicineId, quantity - 1);
    } else {
      newCart.delete(medicineId);
    }
    setCart(newCart);
  };

  const cartTotal = Array.from(cart.entries()).reduce((sum, [medicineId, quantity]) => {
    const medicine = medicines.find(m => m.id === medicineId);
    return sum + (medicine?.best_price || 0) * quantity;
  }, 0);

  const cartItemCount = Array.from(cart.values()).reduce((sum, q) => sum + q, 0);

  return (
    <div className="medicines-marketplace">
      {/* Header */}
      <header className="marketplace-header">
        <h1>💊 Medicine Marketplace</h1>
        <p>Find and compare medicines across 3 modalities with best prices and fastest delivery</p>
      </header>

      <div className="marketplace-container">
        {/* Sidebar Filters */}
        <aside className="marketplace-sidebar">
          <div className="filter-section">
            <h3>Filter by Modality</h3>
            <div className="filter-group">
              {['all', 'allopathy', 'ayurveda', 'homeopathy'].map(mod => (
                <label key={mod} className="filter-label">
                  <input
                    type="radio"
                    name="modality"
                    value={mod}
                    checked={selectedModality === mod}
                    onChange={(e) => setSelectedModality(e.target.value as any)}
                  />
                  <span>
                    {mod === 'all' && '🌍 All Medicines'}
                    {mod === 'allopathy' && '⚕️ Allopathy'}
                    {mod === 'ayurveda' && '🌿 Ayurveda'}
                    {mod === 'homeopathy' && '✨ Homeopathy'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="filter-select"
            >
              <option value="price_low_to_high">💰 Price: Low to High</option>
              <option value="price_high_to_low">💰 Price: High to Low</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="delivery">🚚 Fastest Delivery</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>View Mode</h3>
            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ⚏ Grid
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                ≡ List
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="filter-section cart-summary">
            <h3>🛒 Cart Summary</h3>
            <p className="cart-count">Items: <strong>{cartItemCount}</strong></p>
            <p className="cart-total">Total: <strong>₹{cartTotal.toFixed(2)}</strong></p>
            {cartItemCount > 0 && (
              <button className="checkout-btn">Proceed to Checkout</button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="marketplace-content">
          {/* Search Bar */}
          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search medicines by name, brand, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-results">
              {filteredMedicines.length} medicines found
            </span>
          </div>

          {/* Medicines Grid/List */}
          {filteredMedicines.length > 0 ? (
            <div className={`medicines-container ${viewMode}`}>
              {filteredMedicines.map(medicine => (
                <div key={medicine.id} className="medicine-card">
                  {/* Modality Badge */}
                  <span className={`modality-badge ${medicine.modality}`}>
                    {medicine.modality === 'allopathy' && '⚕️ Allopathy'}
                    {medicine.modality === 'ayurveda' && '🌿 Ayurveda'}
                    {medicine.modality === 'homeopathy' && '✨ Homeopathy'}
                  </span>

                  {/* Prescription Badge */}
                  {medicine.requires_prescription && (
                    <span className="prescription-badge">Rx Required</span>
                  )}

                  {/* Medicine Info */}
                  <div className="medicine-info">
                    <h4>{medicine.generic_name}</h4>
                    <p className="brand-names">{medicine.brand_names.join(', ')}</p>
                    <p className="strength">{medicine.strength}</p>
                    <p className="category">{medicine.therapeutic_category}</p>
                  </div>

                  {/* Indications */}
                  <div className="medicine-indications">
                    <strong>Uses:</strong>
                    <div className="indication-tags">
                      {medicine.indications.slice(0, 2).map((ind, idx) => (
                        <span key={idx} className="tag">{ind}</span>
                      ))}
                      {medicine.indications.length > 2 && (
                        <span className="tag more">+{medicine.indications.length - 2}</span>
                      )}
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div className="supplier-info">
                    <strong>{medicine.suppliers.length} suppliers</strong>
                    <div className="top-supplier">
                      <span className="supplier-name">{medicine.suppliers[0].name}</span>
                      <span className="rating">⭐ {medicine.suppliers[0].rating}</span>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="medicine-footer">
                    <div className="price-section">
                      <span className="price">₹{medicine.best_price}</span>
                      <span className="price-usd">${medicine.price_usd}</span>
                    </div>

                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(medicine.id)}
                    >
                      + Add to Cart
                    </button>

                    <button
                      className="details-btn"
                      onClick={() => setSelectedMedicine(medicine)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>😢 No medicines found matching your search.</p>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </main>
      </div>

      {/* Medicine Details Modal */}
      {selectedMedicine && (
        <div className="modal-overlay" onClick={() => setSelectedMedicine(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedMedicine(null)}
            >
              ✕
            </button>

            <div className="modal-body">
              <h2>{selectedMedicine.generic_name}</h2>
              <p className="brand-names">{selectedMedicine.brand_names.join(', ')}</p>
              <p className="strength">{selectedMedicine.strength}</p>

              <div className="modal-section">
                <h3>Indications</h3>
                <ul>
                  {selectedMedicine.indications.map((ind, idx) => (
                    <li key={idx}>{ind}</li>
                  ))}
                </ul>
              </div>

              <div className="modal-section">
                <h3>Available Suppliers</h3>
                <div className="suppliers-list">
                  {selectedMedicine.suppliers.map(supplier => (
                    <div key={supplier.id} className="supplier-item">
                      <div>
                        <strong>{supplier.name}</strong>
                        <p>Rating: ⭐ {supplier.rating}</p>
                        <p>Delivery: {supplier.delivery_days} day(s)</p>
                      </div>
                      <div className="supplier-price">
                        <p className="price">₹{supplier.price_inr}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleAddToCart(selectedMedicine.id);
                    setSelectedMedicine(null);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicinesMarketplace;
