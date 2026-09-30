/**
 * Clinician workspace dashboard
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface PatientCase {
  id: string;
  name: string;
  age: number;
  modality: string;
  status: 'pending_review' | 'ready_for_plan' | 'awaiting_signature';
  chief_complaint: string;
  intake_time: string;
  priority: 'urgent' | 'routine';
}

export function ClinicianWorkspace({ onSelectPatient }: { onSelectPatient: (id: string) => void }) {
  const [cases, setCases] = useState<PatientCase[]>([
    {
      id: 'p-001',
      name: 'Rajesh Kumar',
      age: 45,
      modality: 'allopathy',
      status: 'pending_review',
      chief_complaint: 'Hypertension, occasional headaches',
      intake_time: '2 hours ago',
      priority: 'routine',
    },
    {
      id: 'p-002',
      name: 'Priya Sharma',
      age: 32,
      modality: 'ayurveda',
      status: 'awaiting_signature',
      chief_complaint: 'Digestive issues, fatigue',
      intake_time: '30 minutes ago',
      priority: 'routine',
    },
    {
      id: 'p-003',
      name: 'Amit Patel',
      age: 28,
      modality: 'homeopathy',
      status: 'ready_for_plan',
      chief_complaint: 'Allergic rhinitis, seasonal symptoms',
      intake_time: '15 minutes ago',
      priority: 'urgent',
    },
  ]);

  const statusColors: Record<string, string> = {
    pending_review: 'bg-yellow-100 text-yellow-800',
    ready_for_plan: 'bg-blue-100 text-blue-800',
    awaiting_signature: 'bg-purple-100 text-purple-800',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <AlertCircle size={16} />;
      case 'ready_for_plan':
        return <Clock size={16} />;
      case 'awaiting_signature':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'Pending Review';
      case 'ready_for_plan':
        return 'Ready for Plan';
      case 'awaiting_signature':
        return 'Awaiting Signature';
      default:
        return status;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinician Dashboard</h1>
          <p className="text-gray-600 mt-1">Review and manage patient intakes</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Pending Review</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {cases.filter((c) => c.status === 'pending_review').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Ready for Plan</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {cases.filter((c) => c.status === 'ready_for_plan').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium">Awaiting Signature</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {cases.filter((c) => c.status === 'awaiting_signature').length}
            </p>
          </div>
        </div>

        {/* Cases list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Cases</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {cases.map((case_) => (
              <div
                key={case_.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => onSelectPatient(case_.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{case_.name}</h3>
                      <span className="text-sm text-gray-500">{case_.age} years</span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          case_.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {case_.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{case_.chief_complaint}</p>
                    <p className="text-gray-500 text-xs mt-1">{case_.intake_time}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{case_.modality}</p>
                      <div
                        className={`mt-1 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${statusColors[case_.status]}`}
                      >
                        {getStatusIcon(case_.status)}
                        {getStatusLabel(case_.status)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(case_.id);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
