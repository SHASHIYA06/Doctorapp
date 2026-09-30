/**
 * Care plan review component
 * Displays patient intake, triage result, and AI-generated draft
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CareplanReviewProps {
  patientId: string;
  planId?: string;
  onReviewPlan?: (planId: string) => void;
  onBack: () => void;
  onNavigate?: (view: any, id?: string) => void;
}

export function CareplanReview({ patientId, planId, onReviewPlan, onBack, onNavigate }: CareplanReviewProps) {
  // Mock patient data
  const patient = {
    name: 'John Doe',
    age: 45,
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    current_medications: ['Lisinopril 10mg', 'Metformin 500mg'],
  };

  const triageResult = {
    level: 'routine',
    message: 'No emergency flags. Safe to proceed with intake.',
  };

  const aiDraft = {
    id: 'draft-001',
    model: 'claude-3-5-sonnet',
    confidence: 0.92,
    problem_list: ['Essential Hypertension', 'Type 2 Diabetes Mellitus'],
    assessment: '45-year-old male with well-controlled hypertension and diabetes. BP 145/90, recent A1C 7.2%.',
    recommendations: [
      'Continue current antihypertensive and glucose-lowering therapy',
      'Increase physical activity to 30 minutes daily',
      'Dietary modification: reduce sodium intake',
      'Schedule follow-up in 3 months',
    ],
    sources: [
      {
        title: 'AHA Guidelines for Hypertension Management',
        confidence: 'primary',
      },
      {
        title: 'IMA Clinical Practice Guidelines - Type 2 Diabetes',
        confidence: 'primary',
      },
    ],
  };

  const safetyAlerts = [
    {
      type: 'interaction',
      severity: 'warning',
      message: 'Lisinopril + Metformin: monitor renal function quarterly',
    },
    {
      type: 'allergy',
      severity: 'info',
      message: 'Penicillin allergy recorded - avoid beta-lactams',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Review</h1>
          <p className="text-gray-600 mt-1">{patient.name}, {patient.age} years old</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Patient info */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Patient Profile</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Age</p>
                <p className="font-medium text-gray-900">{patient.age}</p>
              </div>
              <div>
                <p className="text-gray-600">Conditions</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.conditions.map((c) => (
                    <span key={c} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-600">Allergies</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.allergies.map((a) => (
                    <span key={a} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-600">Current Medications</p>
                <ul className="text-xs mt-1 space-y-1">
                  {patient.current_medications.map((m) => (
                    <li key={m} className="text-gray-900">• {m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Triage Result</h3>
            <div className={`p-3 rounded-lg text-sm font-medium ${
              triageResult.level === 'emergency'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {triageResult.message}
            </div>
          </div>
        </div>

        {/* Center: AI Draft */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI-Generated Draft</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {(aiDraft.confidence * 100).toFixed(0)}% confidence
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {aiDraft.model}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Problem List</p>
                <ul className="mt-2 space-y-1">
                  {aiDraft.problem_list.map((p) => (
                    <li key={p} className="text-gray-900 text-sm">• {p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium">Assessment</p>
                <p className="text-gray-900 text-sm mt-2">{aiDraft.assessment}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium">Recommendations</p>
                <ul className="mt-2 space-y-1">
                  {aiDraft.recommendations.map((r, i) => (
                    <li key={i} className="text-gray-900 text-sm">• {r}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 font-medium mb-2">Sources</p>
                <ul className="space-y-1">
                  {aiDraft.sources.map((s, i) => (
                    <li key={i} className="text-xs text-gray-700">
                      • {s.title} <span className="text-gray-500">({s.confidence})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Safety alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Safety Alerts</h3>
            <div className="space-y-3">
              {safetyAlerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">{alert.type.toUpperCase()}</p>
                  <p className="text-gray-700 text-sm mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => onReviewPlan('plan-001')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Review & Sign Care Plan
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Request More Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
