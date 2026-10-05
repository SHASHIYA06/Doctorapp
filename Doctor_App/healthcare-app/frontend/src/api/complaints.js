import client from './client';

export const complaintsAPI = {
  submitComplaint: async (chiefComplaint, symptoms, duration, severity) => {
    const response = await client.post('/complaints/submit', {
      chiefComplaint,
      symptoms,
      duration,
      severity
    });
    return response.data;
  },

  getMyComplaints: async () => {
    const response = await client.get('/complaints/my-complaints');
    return response.data;
  },

  getComplaintDetails: async (complaintId) => {
    const response = await client.get(`/complaints/${complaintId}`);
    return response.data;
  },

  getComplaintDocuments: async (complaintId) => {
    const response = await client.get(`/complaints/${complaintId}/documents`);
    return response.data;
  },

  uploadDocument: async (complaintId, file, documentType) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const response = await client.post(
      `/complaints/${complaintId}/upload-document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  getAssignedComplaints: async () => {
    const response = await client.get('/complaints/assigned');
    return response.data;
  },

  assignDoctor: async (complaintId, doctorUserId) => {
    const response = await client.put(`/complaints/${complaintId}/assign-doctor`, {
      doctorUserId
    });
    return response.data;
  }
};
