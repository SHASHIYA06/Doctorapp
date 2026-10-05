import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { consultationsAPI } from '../api/consultations';
import { FiPlus, FiFileText, FiMessageCircle, FiCreditCard, FiLogOut } from 'react-icons/fi';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const data = await consultationsAPI.getPatientConsultations();
        setConsultations(data.consultations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Healthcare Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.firstName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate('/patient/new-complaint')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg flex flex-col items-center gap-2 transition"
          >
            <FiPlus size={24} />
            <span>New Complaint</span>
          </button>

          <button
            onClick={() => navigate('/patient/prescriptions')}
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg flex flex-col items-center gap-2 transition"
          >
            <FiFileText size={24} />
            <span>Prescriptions</span>
          </button>

          <button
            onClick={() => navigate('/patient/chat')}
            className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg flex flex-col items-center gap-2 transition"
          >
            <FiMessageCircle size={24} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => navigate('/patient/payments')}
            className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg flex flex-col items-center gap-2 transition"
          >
            <FiCreditCard size={24} />
            <span>Payments</span>
          </button>
        </div>

        {/* Consultations List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Consultations</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No consultations yet. Start by creating a complaint.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Chief Complaint</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          consultation.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          consultation.status === 'diagnosed' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {consultation.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {consultation.doctorName || 'Pending'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {consultation.chiefComplaint || 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={consultation.isPaid ? 'text-green-600 font-semibold' : 'text-red-600'}>
                          {consultation.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(consultation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <button
                          onClick={() => navigate(`/patient/consultation/${consultation.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          View
                        </button>
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
