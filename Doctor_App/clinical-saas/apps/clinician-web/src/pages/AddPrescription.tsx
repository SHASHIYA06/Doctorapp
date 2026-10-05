import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { prescriptionsAPI } from '../api/prescriptions';
import { medicinesAPI } from '../api/medicines';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function AddPrescription() {
  const navigate = useNavigate();
  const { consultationId } = useParams();
  const [medicines, setMedicines] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [medicineList, setMedicineList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [error, setError] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    medicineId: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });

  // Fetch available medicines
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await medicinesAPI.getAllMedicines();
        setAllMedicines(data.medicines || []);
      } catch (err) {
        setError('Failed to load medicines');
      } finally {
        setLoadingMedicines(false);
      }
    };

    fetchMedicines();
  }, []);

  const handleAddMedicine = () => {
    if (!newMedicine.medicineId || !newMedicine.dosage || !newMedicine.frequency || !newMedicine.duration) {
      setError('Please fill all medicine fields');
      return;
    }

    const medicine = allMedicines.find(m => m.id === parseInt(newMedicine.medicineId));
    if (!medicine) {
      setError('Invalid medicine selected');
      return;
    }

    setMedicines([...medicines, { ...newMedicine, medicineId: parseInt(newMedicine.medicineId) }]);
    setNewMedicine({ medicineId: '', dosage: '', frequency: '', duration: '', notes: '' });
    setError(null);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (medicines.length === 0) {
      setError('Add at least one medicine to the prescription');
      setLoading(false);
      return;
    }

    try {
      await prescriptionsAPI.createPrescription(parseInt(consultationId), medicines);
      navigate('/doctor/dashboard', { state: { message: 'Prescription created successfully!' } });
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Prescription</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Medicine Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Medicine</h2>

            {loadingMedicines ? (
              <p className="text-gray-500">Loading medicines...</p>
            ) : (
              <div className="space-y-4">
                {/* Medicine Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine *
                  </label>
                  <select
                    value={newMedicine.medicineId}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, medicineId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select medicine...</option>
                    {allMedicines.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} ({med.strength} - {med.dosageForm})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={newMedicine.dosage}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, dosage: e.target.value })
                    }
                    placeholder="e.g., 500mg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency *
                  </label>
                  <select
                    value={newMedicine.frequency}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, frequency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select frequency...</option>
                    <option value="Once a day">Once a day</option>
                    <option value="Twice a day">Twice a day</option>
                    <option value="Thrice a day">Thrice a day</option>
                    <option value="Four times a day">Four times a day</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={newMedicine.duration}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, duration: e.target.value })
                    }
                    placeholder="e.g., 7 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={newMedicine.notes}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, notes: e.target.value })
                    }
                    placeholder="e.g., Take with food"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FiPlus /> Add Medicine
                </button>
              </div>
            )}
          </div>

          {/* Prescription List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Prescription Items ({medicines.length})
              </h2>

              {medicines.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No medicines added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medicines.map((med, index) => {
                    const medicine = allMedicines.find(m => m.id === med.medicineId);
                    return (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {medicine?.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {medicine?.strength} - {medicine?.dosageForm}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(index)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Dosage</p>
                            <p className="font-medium text-gray-900">{med.dosage}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Frequency</p>
                            <p className="font-medium text-gray-900">{med.frequency}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-medium text-gray-900">{med.duration}</p>
                          </div>
                        </div>

                        {med.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-xs text-yellow-800">
                              <strong>Notes:</strong> {med.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || medicines.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? 'Creating Prescription...' : 'Create Prescription'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
