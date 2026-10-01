import client from './client';

export const medicinesAPI = {
  getAllMedicines: async (search = null, category = null) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    const response = await client.get(`/medicines?${params.toString()}`);
    return response.data;
  },

  getMedicineById: async (medicineId) => {
    const response = await client.get(`/medicines/${medicineId}`);
    return response.data;
  },

  addMedicine: async (name, genericName, category, strength, dosageForm, price, stock, description) => {
    const response = await client.post('/medicines', {
      name,
      genericName,
      category,
      strength,
      dosageForm,
      price,
      stock,
      description
    });
    return response.data;
  },

  updateMedicine: async (medicineId, updates) => {
    const response = await client.put(`/medicines/${medicineId}`, updates);
    return response.data;
  },

  deleteMedicine: async (medicineId) => {
    const response = await client.delete(`/medicines/${medicineId}`);
    return response.data;
  },

  getMedicinesByCategory: async (category) => {
    const response = await client.get(`/medicines/category/${category}`);
    return response.data;
  },

  getLowStockMedicines: async (threshold = 10) => {
    const response = await client.get(`/medicines/admin/low-stock?threshold=${threshold}`);
    return response.data;
  }
};
