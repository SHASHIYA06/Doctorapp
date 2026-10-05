import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { diagnosesAPI } from '../api/diagnoses';
import { FiArrowLeft } from 'react-icons/fi';

export default function AddDiagnosis() {
  const navigate = useNavigate();
  const { consultationId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    diagnosis: '',
    findings: '',
    icdCode: '',
    treatmentPlan: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await diagnosesAPI.addDiagnosis(
        parseInt(consultationId),
        formData.diagnosis,
        formData.findings,
        formData.icdCode,
        formData.treatmentPlan
      );

      navigate(`/doctor/add-prescription/${consultationId}`);
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
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Diagnosis</h1>
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
            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis *
              </label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                placeholder="e.g., Acute Myocardial Infarction"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Findings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Findings *
              </label>
              <textarea
                name="findings"
                value={formData.findings}
                onChange={handleInputChange}
                placeholder="Describe your clinical findings and observations..."
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* ICD Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ICD-10 Code
              </label>
              <input
                type="text"
                name="icdCode"
                value={formData.icdCode}
                onChange={handleInputChange}
                placeholder="e.g., I21.9"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Treatment Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Plan *
              </label>
              <textarea
                name="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={handleInputChange}
                placeholder="Describe the treatment plan and recommendations..."
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Submitting...' : 'Save Diagnosis & Continue'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/doctor/dashboard')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Next Step:</strong> After saving the diagnosis, you'll be able to create a prescription with medicines for this patient.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
