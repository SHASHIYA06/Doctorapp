/**
 * Patient intake stepper component
 * Step: About you → Current medicines → Allergies → Your concern → Safety check → Consent → Review
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

// Validation schemas
const AboutYouSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  date_of_birth: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 18;
  }, 'Patient must be 18 or older'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  contact_phone: z.string().regex(/^\+?\d{10,}$/, 'Valid phone number required'),
  preferred_language: z.enum(['en', 'hi', 'kn', 'ta', 'te', 'ml']).default('en'),
});

const MedicinesSchema = z.object({
  current_medicines: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
    })
  ),
  previous_medicines: z.array(z.string()),
});

const AllergiesSchema = z.object({
  allergies: z.array(
    z.object({
      substance: z.string(),
      category: z.enum(['medication', 'food', 'environmental', 'other']),
      severity: z.enum(['mild', 'moderate', 'severe']),
    })
  ),
});

const ConcernSchema = z.object({
  chief_complaint: z.string().min(10, 'Please describe your concern'),
  duration: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe']),
});

export interface PatientIntakeData {
  about_you: z.infer<typeof AboutYouSchema>;
  medicines: z.infer<typeof MedicinesSchema>;
  allergies: z.infer<typeof AllergiesSchema>;
  concern: z.infer<typeof ConcernSchema>;
  modality: 'allopathy' | 'ayurveda' | 'homeopathy';
  consent_signed: boolean;
}

interface PatientIntakeStepper {
  onComplete: (data: PatientIntakeData) => void;
  onCancel: () => void;
}

export const PatientIntakeStepper: React.FC<PatientIntakeStepper> = ({
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<PatientIntakeData>>({});

  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onBlur',
  });

  const steps = [
    {
      title: 'About You',
      description: 'Basic information',
    },
    {
      title: 'Current Medicines',
      description: 'What are you taking?',
    },
    {
      title: 'Allergies',
      description: 'Any allergies or intolerances?',
    },
    {
      title: 'Your Concern',
      description: 'What brings you here?',
    },
    {
      title: 'Safety Check',
      description: 'Quick health screening',
    },
    {
      title: 'Consent',
      description: 'Agree to treatment terms',
    },
    {
      title: 'Review',
      description: 'Confirm your information',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleStepComplete = async (stepData: any) => {
    setData({ ...data, ...stepData });
    handleNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Patient Intake</h1>
          <p className="text-gray-600 mt-1">
            Help us understand your health to provide better care
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex justify-between">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    i < step
                      ? 'bg-green-500 text-white'
                      : i === step
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i < step ? <CheckCircle size={20} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      i < step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-semibold text-gray-900">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{steps[step].title}</h2>
          <p className="text-gray-600 mb-6">{steps[step].description}</p>

          <form onSubmit={handleSubmit((formData) => handleStepComplete(formData))}>
            {/* Step 0: About You */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register('first_name', { required: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs mt-1">First name required</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register('last_name', { required: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    {...register('date_of_birth', { required: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    {...register('contact_phone', { required: true })}
                    placeholder="+91-9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    {...register('preferred_language')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="kn">Kannada</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="ml">Malayalam</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 1-4: Placeholder for other steps */}
            {step > 0 && step < 7 && (
              <div className="flex items-center justify-center h-40 text-gray-500">
                <p>Step {step + 1} form content goes here</p>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Privacy & Consent</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Your information will be used only for clinical decision support. You can
                      export or delete your data at any time.
                    </p>
                  </div>
                </div>

                <label className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    {...register('consent_signed')}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I consent to the collection and use of my health information for clinical
                    decision support
                  </span>
                </label>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={step === 0 ? onCancel : handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {step === 0 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
              >
                {step === steps.length - 1 ? 'Complete' : 'Continue'}
                {step < steps.length - 1 && <ChevronRight size={16} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
