import client from './client';

export interface Medicine {
  id: number;
  name: string;
  genericName?: string;
  description?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  price: number;
  stockQuantity: number;
  category?: string;
  requiresPrescription: boolean;
  isActive: boolean;
}

export const medicinesAPI = {
  getAll: async () => {
    const response = await client.get<Medicine[]>('/medicines');
    return response.data;
  },

  search: async (query: string) => {
    const response = await client.get<Medicine[]>(`/medicines/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getById: async (medicineId: number) => {
    const response = await client.get<Medicine>(`/medicines/${medicineId}`);
    return response.data;
  },

  create: async (data: Partial<Medicine>) => {
    const response = await client.post<Medicine>('/medicines', data);
    return response.data;
  },

  update: async (medicineId: number, data: Partial<Medicine>) => {
    const response = await client.put<Medicine>(`/medicines/${medicineId}`, data);
    return response.data;
  },

  delete: async (medicineId: number) => {
    const response = await client.delete(`/medicines/${medicineId}`);
    return response.data;
  },

  getByCategory: async (category: string) => {
    const response = await client.get<Medicine[]>(`/medicines/category/${category}`);
    return response.data;
  }
};
