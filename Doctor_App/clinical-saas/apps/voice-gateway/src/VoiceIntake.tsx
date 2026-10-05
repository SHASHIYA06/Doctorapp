/**
 * Voice intake UI component for web/mobile PWA
 * Real-time ASR transcript with correction workflow
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle } from 'lucide-react';

interface VoiceIntakeProps {
  tenantId: string;
  onComplete: (transcript: string, consent: boolean) => void;
  onCancel: () => void;
}

export function VoiceIntake({ tenantId, onComplete, onCancel }: VoiceIntakeProps) {
  const [step, setStep] = useState<'welcome' | 'recording' | 'confirm' | 'emergency' | 'complete'>(
    'welcome'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = 'en-IN'; // India English

    recognition.onstart = () => {
      console.log('[ASR] Started listening');
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;

        if (isFinal) {
          final += transcript + ' ';
          setConfidence(event.results[i][0].confidence);
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('[ASR] Error:', event.error);
    };

    recognition.onend = () => {
      console.log('[ASR] Stopped listening');
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Timer for recording duration
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please enable microphone access to use voice intake');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setInterimTranscript('');
    startRecording();
  };

  const handleConfirm = () => {
    stopRecording();
    // In a real app, check triage result
    const isEmergency = transcript.toLowerCase().includes('chest pain');
    if (isEmergency) {
      setEmergencyTriggered(true);
      setStep('emergency');
    } else {
      setStep('complete');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        {step === 'welcome' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic size={32} className="text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Voice Intake</h1>
            <p className="text-gray-600 mb-6">
              Describe your symptoms and medical history using your voice. You'll be able to review and correct
              the transcript before proceeding.
            </p>

            <div className="space-y-4 mb-6">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordingConsent}
                  onChange={(e) => setRecordingConsent(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-700">
                  I consent to recording this call for quality purposes (optional)
                </span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceConsent}
                  onChange={(e) => setVoiceConsent(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-700">
                  I understand this is clinical decision support, not a clinical diagnosis or prescription
                </span>
              </label>
            </div>

            <button
              onClick={() => {
                setStep('recording');
                startRecording();
              }}
              disabled={!voiceConsent}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Start Recording
            </button>

            <button
              onClick={onCancel}
              className="w-full mt-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'recording' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className={`w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse`}>
              <Mic size={32} className="text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recording...</h2>
            <p className="text-gray-600 mb-4">Tell us about your concern. You have up to 2 minutes.</p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left min-h-24">
              <p className="text-gray-900 text-sm mb-2">{transcript}</p>
              {interimTranscript && (
                <p className="text-gray-500 text-sm italic">(hearing: {interimTranscript}...)</p>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-6">
              Recording time: {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  stopRecording();
                  setStep('confirm');
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Done Recording
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-400"
              >
                Clear & Retry
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Transcript</h2>
            <p className="text-gray-600 mb-4">Please review what we heard and make corrections if needed.</p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm text-gray-900 max-h-40 overflow-y-auto">
              {transcript || '(No transcript recorded)'}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corrections (if needed)
              </label>
              <textarea
                placeholder="Edit the transcript here or leave blank to accept as-is"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Confirm & Continue
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Re-record
              </button>
            </div>
          </div>
        )}

        {step === 'emergency' && (
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-600">
            <div className="flex items-start mb-4">
              <AlertCircle size={32} className="text-red-600 mr-3 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Urgent Care Needed</h2>
                <p className="text-red-600 font-semibold mt-1">Please seek emergency care immediately</p>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg mb-6 text-sm text-gray-900">
              <p className="font-medium mb-2">
                I'm concerned your symptoms may need urgent care. I cannot assess this safely.
              </p>
              <p className="mb-2">
                Please contact your local emergency service now or go to the nearest emergency department.
              </p>
              <p className="font-bold">Emergency Number: 108</p>
            </div>

            <div className="space-y-3">
              <a
                href="tel:108"
                className="block px-4 py-3 bg-red-600 text-white rounded-lg font-semibold text-center hover:bg-red-700"
              >
                Call Emergency (108)
              </a>
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Intake Submitted</h2>
            <p className="text-gray-600 mb-4">
              Your information has been recorded and transcribed. A clinician will review and contact you shortly.
            </p>

            <button
              onClick={() => onComplete(transcript, recordingConsent)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
