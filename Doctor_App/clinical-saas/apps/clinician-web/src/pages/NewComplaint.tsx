import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../api/complaints';
import { FiArrowLeft, FiUpload } from 'react-icons/fi';

export default function NewComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    symptoms: '',
    duration: '',
    severity: 'moderate',
    documentType: 'report'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Submit complaint
      const complaintResponse = await complaintsAPI.submitComplaint(
        formData.chiefComplaint,
        formData.symptoms,
        formData.duration,
        formData.severity
      );

      const complaintId = complaintResponse.complaint.id;

      // Upload document if provided
      if (file) {
        await complaintsAPI.uploadDocument(complaintId, file, formData.documentType);
      }

      // Success
      navigate(`/patient/dashboard`, { 
        state: { message: 'Complaint submitted successfully!' } 
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Submit New Complaint</h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Chief Complaint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chief Complaint *
              </label>
              <input
                type="text"
                name="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={handleInputChange}
                placeholder="e.g., Chest pain, Headache, etc."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms *
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                placeholder="Describe your symptoms in detail..."
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 2 days, 1 week, 3 months"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>

            {/* Medical Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Medical Document (Optional)
              </label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              >
                <option value="report">Lab Report</option>
                <option value="xray">X-Ray</option>
                <option value="scan">Scan</option>
                <option value="prescription">Prescription</option>
                <option value="other">Other</option>
              </select>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FiUpload className="mx-auto mb-2 text-gray-400" size={24} />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, images, or documents (max 50MB)
                  </p>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/patient/dashboard')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
