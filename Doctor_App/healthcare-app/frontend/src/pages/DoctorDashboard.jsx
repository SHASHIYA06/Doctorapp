import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { consultationsAPI } from '../api/consultations';
import { FiLogOut, FiMessageCircle } from 'react-icons/fi';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const data = await consultationsAPI.getUnassignedConsultations();
        setConsultations(data.consultations || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
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

  const handleAccept = async (consultationId) => {
    try {
      await consultationsAPI.acceptConsultation(consultationId);
      // Refresh list
      const data = await consultationsAPI.getUnassignedConsultations();
      setConsultations(data.consultations || []);
    } catch (err) {
      setError('Failed to accept consultation');
    }
  };

  const filteredConsultations = consultations.filter(c => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'assigned') return c.status === 'assigned';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
            <p className="text-sm text-gray-600">Welcome, Dr. {user?.lastName}!</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate('/doctor/chat')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              <FiMessageCircle />
              Chat
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Consultations
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'assigned'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Assigned to Me
          </button>
        </div>

        {/* Consultations Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Consultations {filteredConsultations.length > 0 && `(${filteredConsultations.length})`}
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No consultations available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Patient</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Chief Complaint</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultations.map((consultation) => (
                    <tr key={consultation.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {consultation.patientName}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {consultation.chiefComplaint}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.severity === 'severe'
                            ? 'bg-red-100 text-red-800'
                            : consultation.severity === 'moderate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {consultation.severity || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.status === 'pending'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {consultation.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(consultation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm space-x-2">
                        {consultation.status === 'pending' && (
                          <button
                            onClick={() => handleAccept(consultation.id)}
                            className="text-green-600 hover:text-green-800 font-semibold"
                          >
                            Accept
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigate(
                              `/doctor/patient/${consultation.patientName}/consultation/${consultation.id}`
                            )
                          }
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
