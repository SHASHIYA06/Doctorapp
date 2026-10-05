/**
 * Main patient PWA entry point
 */

import React from 'react';
import { PatientIntakeStepper, PatientIntakeData } from './PatientIntakeStepper';

interface AppState {
  currentPage: 'home' | 'intake' | 'consent' | 'waiting';
}

export default function PatientApp() {
  const [state, setState] = React.useState<AppState>({ currentPage: 'home' });

  const handleStartIntake = () => {
    setState({ currentPage: 'intake' });
  };

  const handleIntakeComplete = async (data: PatientIntakeData) => {
    console.log('Intake completed:', data);

    // Call API to register patient
    try {
      const response = await fetch('/v1/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          first_name: data.about_you.first_name,
          last_name: data.about_you.last_name,
          date_of_birth: data.about_you.date_of_birth,
          gender: data.about_you.gender,
          contact_phone: data.about_you.contact_phone,
        }),
      });

      if (response.ok) {
        setState({ currentPage: 'waiting' });
      }
    } catch (err) {
      console.error('Failed to create patient:', err);
    }
  };

  return (
    <div>
      {state.currentPage === 'home' && (
        <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-400 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
              <p className="text-gray-600 mb-6">
                Connect with healthcare practitioners in your preferred modality
              </p>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Allopathic Medicine</p>
                  <p className="text-xs text-gray-600">Evidence-based clinical medicine</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Ayurveda</p>
                  <p className="text-xs text-gray-600">Traditional wellness</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Homeopathy</p>
                  <p className="text-xs text-gray-600">Natural remedies</p>
                </div>
              </div>

              <button
                onClick={handleStartIntake}
                className="w-full px-4 py-3 bg-blue-600 rounded-lg text-white font-semibold hover:bg-blue-700 transition"
              >
                Start Your Intake
              </button>

              <p className="text-xs text-gray-500 mt-4">
                By continuing, you agree to our privacy policy and terms of service
              </p>
            </div>
          </div>
        </div>
      )}

      {state.currentPage === 'intake' && (
        <PatientIntakeStepper
          onComplete={handleIntakeComplete}
          onCancel={() => setState({ currentPage: 'home' })}
        />
      )}

      {state.currentPage === 'waiting' && (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="max-w-md w-full mx-auto px-4 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Intake Submitted</h2>
              <p className="text-gray-600 mb-4">
                A clinician will review your information and contact you shortly to discuss your
                care plan.
              </p>
              <p className="text-sm text-gray-500">
                In the meantime, you can view your health information in your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
