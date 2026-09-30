/**
 * Clinician Dashboard - Main app entry
 * Workspace for reviewing patient intakes, drafting plans, signing care plans
 */

import React, { useState } from 'react';
import { ClinicianWorkspace } from './ClinicianWorkspace';
import { CareplanReview } from './CareplanReview';
import './index.css';

type WorkspaceView = 'dashboard' | 'patient_review' | 'careplan_sign';

interface AppState {
  currentView: WorkspaceView;
  selectedPatientId?: string;
  selectedPlanId?: string;
}

export default function ClinicianApp() {
  const [state, setState] = useState<AppState>({ currentView: 'dashboard' });

  const handleSelectPatient = (patientId: string) => {
    setState({ currentView: 'patient_review', selectedPatientId: patientId });
  };

  const handleReviewPlan = (planId: string) => {
    setState({ currentView: 'careplan_sign', selectedPlanId: planId });
  };

  const handleBackToDashboard = () => {
    setState({ currentView: 'dashboard' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {state.currentView === 'dashboard' && (
        <ClinicianWorkspace onSelectPatient={handleSelectPatient} />
      )}

      {state.currentView === 'patient_review' && state.selectedPatientId && (
        <CareplanReview
          patientId={state.selectedPatientId}
          onReviewPlan={handleReviewPlan}
          onBack={handleBackToDashboard}
        />
      )}

      {state.currentView === 'careplan_sign' && state.selectedPlanId && (
        <CarePlanSigningWorkflow
          planId={state.selectedPlanId}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}

/**
 * Care plan signing workflow with safety alerts and MFA
 */
function CarePlanSigningWorkflow({
  planId,
  onBack,
}: {
  planId: string;
  onBack: () => void;
}) {
  const [step, setStep] = useState<'review' | 'alerts' | 'confirm' | 'mfa' | 'signed'>('review');
  const [mfaToken, setMfaToken] = useState('');
  const [overridingAlerts, setOverridingAlerts] = useState(false);
  const [overrideRationale, setOverrideRationale] = useState('');

  // Mock data for demo
  const mockPlan = {
    plan_id: planId,
    patient_name: 'John Doe',
    modality: 'allopathy',
    problem_list: ['Hypertension', 'Type 2 Diabetes'],
    assessment: 'Patient presents with stable hypertension and diabetes. BP 145/90, fasting glucose 165.',
    plan: 'Continue current medications. Increase physical activity to 30 mins daily.',
    counselling: 'Discussed diet modifications and exercise benefits.',
    warning_signs: ['Chest pain', 'Severe headache', 'Vision changes'],
    follow_up: '2 weeks',
  };

  const mockAlerts = [
    {
      type: 'interaction',
      severity: 'warning',
      message: 'Metformin + ACE inhibitor: monitor renal function',
    },
    {
      type: 'allergy',
      severity: 'info',
      message: 'Patient has penicillin allergy - noted for future prescriptions',
    },
  ];

  const handleSignPlan = async () => {
    if (step !== 'mfa' || !mfaToken) {
      return;
    }

    try {
      const response = await fetch(`/v1/care-plans/${planId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-MFA-Token': mfaToken,
        },
        body: JSON.stringify({
          clinician_id: localStorage.getItem('clinician_id'),
          override_safety_alerts: overridingAlerts,
          override_rationale: overrideRationale,
        }),
      });

      if (response.ok) {
        setStep('signed');
      }
    } catch (err) {
      console.error('Failed to sign plan:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Care Plan Review</h1>
          <p className="text-gray-600 mt-1">{mockPlan.patient_name} - {mockPlan.modality}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Back
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {(['review', 'alerts', 'confirm', 'mfa', 'signed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            disabled={s === 'mfa' && step !== 'confirm'}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              step === s
                ? 'bg-blue-500 text-white'
                : step > s || s === 'signed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
            }`}
          >
            {s === 'review' && 'Review'}
            {s === 'alerts' && 'Safety Alerts'}
            {s === 'confirm' && 'Confirm'}
            {s === 'mfa' && 'MFA Verify'}
            {s === 'signed' && 'Signed ✓'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {step === 'review' && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Care Plan Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Problem List</p>
                  <p className="font-medium">{mockPlan.problem_list.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Follow-up</p>
                  <p className="font-medium">{mockPlan.follow_up}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Assessment</p>
              <p className="text-gray-900 mt-2">{mockPlan.assessment}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-gray-900 mt-2">{mockPlan.plan}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Counselling</p>
              <p className="text-gray-900 mt-2">{mockPlan.counselling}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Warning Signs for Escalation</p>
              <ul className="list-disc list-inside text-gray-900 mt-2">
                {mockPlan.warning_signs.map((sign) => (
                  <li key={sign}>{sign}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep('alerts')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Review Safety Alerts
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {step === 'alerts' && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Safety Alerts & Interactions</h2>
              <div className="space-y-3">
                {mockAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{alert.type.toUpperCase()}</p>
                    <p className="text-gray-700 mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {mockAlerts.some((a) => a.severity === 'warning') && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={overridingAlerts}
                    onChange={(e) => setOverridingAlerts(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Override Safety Alerts</p>
                    <p className="text-sm text-gray-600 mt-1">
                      If overriding, you must provide rationale
                    </p>
                  </div>
                </label>

                {overridingAlerts && (
                  <textarea
                    value={overrideRationale}
                    onChange={(e) => setOverrideRationale(e.target.value)}
                    placeholder="Why are you overriding these alerts?"
                    className="w-full mt-3 p-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                  />
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep('confirm')}
                disabled={overridingAlerts && !overrideRationale}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Proceed to Confirmation
              </button>
              <button
                onClick={() => setStep('review')}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-medium text-gray-900">Confirm Care Plan Signature</p>
              <p className="text-sm text-gray-700 mt-2">
                You are about to sign this care plan. This action is immutable and will be logged
                in the patient's audit trail.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Plan ID: <span className="font-mono">{planId}</span></p>
              <p className="text-sm text-gray-600">
                Modality: <span className="font-medium">{mockPlan.modality}</span>
              </p>
              {overridingAlerts && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Override Rationale:</p>
                  <p className="text-sm text-gray-700 mt-1">{overrideRationale}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep('mfa')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Verify with MFA
              </button>
              <button
                onClick={() => setStep('alerts')}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'mfa' && (
          <div className="p-6 space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="font-medium text-gray-900">Multi-Factor Authentication Required</p>
              <p className="text-sm text-gray-700 mt-2">
                For security, please verify your identity with an MFA code
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter MFA Code
              </label>
              <input
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-600 mt-2">
                Check your authenticator app or SMS
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSignPlan}
                disabled={!mfaToken || mfaToken.length < 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Sign & Confirm
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'signed' && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Care Plan Signed</h3>
              <p className="text-gray-600 mt-2">
                The care plan has been securely signed and recorded in the patient's immutable audit trail.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-600">Signature Timestamp</p>
              <p className="font-mono text-sm text-gray-900">{new Date().toISOString()}</p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
