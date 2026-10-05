import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationsAPI } from '../api/consultations';
import { paymentsAPI } from '../api/payments';
import { FiArrowLeft, FiCreditCard } from 'react-icons/fi';

export default function Payments() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const data = await consultationsAPI.getPatientConsultations();
        setConsultations(data.consultations || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  const handlePayment = async (consultationId) => {
    setProcessingId(consultationId);
    try {
      const data = await paymentsAPI.createCheckoutSession(consultationId);
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create checkout session');
      setProcessingId(null);
    }
  };

  const unpaidConsultations = consultations.filter(c => !c.isPaid && c.status === 'diagnosed');

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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : null}

        {/* Unpaid Consultations */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Payments</h2>
          {unpaidConsultations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No pending payments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unpaidConsultations.map((consultation) => (
                <div key={consultation.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Consultation #{consultation.id}</h3>
                      <p className="text-sm text-gray-600">{consultation.doctorName || 'Pending doctor assignment'}</p>
                    </div>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Due:</span>
                        <span className="font-semibold text-gray-900">₹500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="text-yellow-600 font-semibold">Pending</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Complaint:</span>
                        <span className="text-gray-900">{consultation.chiefComplaint || 'N/A'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePayment(consultation.id)}
                      disabled={processingId === consultation.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <FiCreditCard />
                      {processingId === consultation.id ? 'Processing...' : 'Pay Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paid Consultations */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
          {consultations.filter(c => c.isPaid).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No payment history</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.filter(c => c.isPaid).map((consultation) => (
                    <tr key={consultation.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">#{consultation.id}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{consultation.doctorName || 'N/A'}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">₹500</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Paid
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(consultation.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
