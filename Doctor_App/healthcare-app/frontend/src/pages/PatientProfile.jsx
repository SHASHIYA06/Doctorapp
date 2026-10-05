import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { complaintsAPI } from '../api/complaints';
import { diagnosesAPI } from '../api/diagnoses';
import { consultationsAPI } from '../api/consultations';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';

export default function PatientProfile() {
  const navigate = useNavigate();
  const { patientId, consultationId } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('complaint');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch consultation details
        const consData = await consultationsAPI.getConsultationDetails(consultationId);
        setConsultation(consData);

        // Fetch documents
        if (consData.complaint) {
          const docsData = await complaintsAPI.getComplaintDocuments(consData.complaint.id);
          setDocuments(docsData.documents || []);
        }

        // Fetch diagnosis if exists
        if (consData.status === 'diagnosed' || consData.status === 'completed') {
          try {
            const diagData = await diagnosesAPI.getDiagnosis(consultationId);
            setDiagnosis(diagData);
          } catch (err) {
            // Diagnosis might not exist yet
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (consultationId) {
      fetchData();
    }
  }, [consultationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => navigate('/doctor/dashboard')} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
              <FiArrowLeft /> Back
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button onClick={() => navigate('/doctor/dashboard')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <FiArrowLeft /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Patient: {consultation?.patient?.name}
          </h1>
          <p className="text-sm text-gray-600">{consultation?.patient?.email}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('complaint')}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === 'complaint'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Complaint & Documents
            </button>
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === 'diagnosis'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Diagnosis & Prescription
            </button>
          </div>
        </div>

        {/* Complaint Tab */}
        {activeTab === 'complaint' && (
          <div className="space-y-6">
            {/* Chief Complaint */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chief Complaint</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Main Complaint</p>
                  <p className="text-gray-900">{consultation?.complaint?.chiefComplaint}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Symptoms</p>
                  <p className="text-gray-900">{consultation?.complaint?.symptoms}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">Duration</p>
                    <p className="text-gray-900">{consultation?.complaint?.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Severity</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      consultation?.complaint?.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      consultation?.complaint?.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {consultation?.complaint?.severity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Documents</h2>
              {documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">{doc.fileName}</p>
                        <p className="text-sm text-gray-600">
                          {doc.documentType} • {(doc.fileSize / 1024 / 1024).toFixed(2)}MB
                        </p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">
                        <FiDownload />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnosis Tab */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-6">
            {diagnosis ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Diagnosis</h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Diagnosis</p>
                    <p className="text-gray-900">{diagnosis.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Findings</p>
                    <p className="text-gray-900">{diagnosis.findings}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 font-medium">ICD Code</p>
                      <p className="text-gray-900">{diagnosis.icdCode}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Date</p>
                      <p className="text-gray-900">{new Date(diagnosis.diagnosedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Treatment Plan</p>
                    <p className="text-gray-900">{diagnosis.treatmentPlan}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800">No diagnosis added yet. Create one to proceed with prescription.</p>
                <button
                  onClick={() => navigate(`/doctor/add-diagnosis/${consultationId}`)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
                >
                  Add Diagnosis
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
