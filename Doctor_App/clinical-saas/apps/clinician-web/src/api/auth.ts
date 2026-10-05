import client from './client';

export const authAPI = {
  register: async (email, password, firstName, lastName, userType, specialization = null) => {
    const response = await client.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      userType,
      specialization
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await client.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },

  updateProfile: async (firstName, lastName, dateOfBirth, medicalHistory) => {
    const response = await client.put('/auth/profile', {
      firstName,
      lastName,
      dateOfBirth,
      medicalHistory
    });
    return response.data;
  },

  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  }
};
