import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptionsAPI } from '../api/prescriptions';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';

export default function Prescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const data = await prescriptionsAPI.getPatientPrescriptions();
        setPrescriptions(data.prescriptions || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const handleViewDetails = async (prescriptionId) => {
    try {
      const data = await prescriptionsAPI.getPrescriptionDetails(prescriptionId);
      setSelectedPrescription(data);
      setShowDetails(true);
    } catch (err) {
      setError('Failed to load prescription details');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading prescriptions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No prescriptions yet. Contact your doctor to get a prescription.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Prescription #{prescription.id}</h3>
                      <p className="text-sm text-gray-600">
                        {prescription.doctorName || 'N/A'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                      prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {prescription.status}
                    </span>
                  </div>

                  <div className="mb-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Chief Complaint:</p>
                    <p>{prescription.chiefComplaint || 'N/A'}</p>
                  </div>

                  <div className="mb-6 text-sm">
                    <p className="font-medium text-gray-900 mb-2">Medicines:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {prescription.items?.slice(0, 3).map((item, idx) => (
                        <li key={idx}>{item.medicineName} - {item.dosage}</li>
                      ))}
                      {prescription.items?.length > 3 && (
                        <li className="text-blue-600">+{prescription.items.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  <div className="mb-4 text-xs text-gray-500">
                    Prescribed: {new Date(prescription.prescribedAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => handleViewDetails(prescription.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FiDownload />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="sticky top-0 bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Prescription Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Header Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Prescription Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Doctor Name</p>
                      <p className="font-semibold text-gray-900">{selectedPrescription.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Doctor Email</p>
                      <p className="font-semibold text-gray-900">{selectedPrescription.doctorEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPrescription.prescribedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold text-gray-900 capitalize">{selectedPrescription.status}</p>
                    </div>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Chief Complaint</h3>
                  <p className="text-gray-700">{selectedPrescription.chiefComplaint}</p>
                </div>

                {/* Medicines */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Medicines</h3>
                  <div className="space-y-3">
                    {selectedPrescription.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Medicine</p>
                            <p className="font-semibold text-gray-900">{item.medicineName}</p>
                            <p className="text-xs text-gray-500">{item.genericName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Dosage Form</p>
                            <p className="font-semibold text-gray-900">{item.dosageForm}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Dosage</p>
                            <p className="font-semibold text-gray-900">{item.dosage}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Frequency</p>
                            <p className="font-semibold text-gray-900">{item.frequency}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-semibold text-gray-900">{item.duration}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Price</p>
                            <p className="font-semibold text-gray-900">₹{item.price}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <div className="mt-3 text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                            <strong>Notes:</strong> {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
