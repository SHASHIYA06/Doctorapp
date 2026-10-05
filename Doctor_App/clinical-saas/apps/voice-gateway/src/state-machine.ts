/**
 * Voice call state machine for clinical intake
 * Manages: identification → consent → intake questions → triage → handoff
 */

import { v4 as uuidv4 } from 'uuid';

export type VoiceCallState =
  | 'started'
  | 'language_selection'
  | 'identity_verification'
  | 'consent_recording'
  | 'voice_consent'
  | 'intake_questions'
  | 'triage_assessment'
  | 'emergency_escalation'
  | 'urgent_callback'
  | 'plan_summary'
  | 'appointment'
  | 'ended';

export interface VoiceSession {
  session_id: string;
  tenant_id: string;
  patient_id?: string;
  call_id: string;
  state: VoiceCallState;

  language: string;
  channel: 'webrtc' | 'pstn';
  phone_number?: string;

  caller_verified: boolean;
  voice_consent_given: boolean;
  recording_consent_given: boolean;
  recording_id?: string;

  transcript_parts: { text: string; confidence: number; timestamp: string }[];
  full_transcript?: string;
  transcript_confirmed: boolean;

  intake_responses: Record<string, string>;
  triage_result?: {
    level: 'emergency' | 'urgent' | 'routine' | 'no_red_flag';
    triggered_rules: string[];
    message: string;
  };

  started_at: string;
  ended_at?: string;
  duration_seconds?: number;

  handoff_to_clinician?: boolean;
  callback_scheduled?: string;

  audit_event_id: string;
}

/**
 * Voice call state machine executor
 */
export class VoiceCallStateMachine {
  private session: VoiceSession;
  private stateHandlers: Record<VoiceCallState, () => Promise<void>>;

  constructor(callId: string, tenantId: string, channel: 'webrtc' | 'pstn') {
    this.session = {
      session_id: uuidv4(),
      tenant_id: tenantId,
      call_id: callId,
      state: 'started',
      language: 'en',
      channel,
      transcript_parts: [],
      intake_responses: {},
      caller_verified: false,
      voice_consent_given: false,
      recording_consent_given: false,
      transcript_confirmed: false,
      started_at: new Date().toISOString(),
      audit_event_id: uuidv4(),
    };

    // Initialize state handlers
    this.stateHandlers = {
      started: this.handleStart.bind(this),
      language_selection: this.handleLanguageSelection.bind(this),
      identity_verification: this.handleIdentityVerification.bind(this),
      consent_recording: this.handleConsentRecording.bind(this),
      voice_consent: this.handleVoiceConsent.bind(this),
      intake_questions: this.handleIntakeQuestions.bind(this),
      triage_assessment: this.handleTriageAssessment.bind(this),
      emergency_escalation: this.handleEmergencyEscalation.bind(this),
      urgent_callback: this.handleUrgentCallback.bind(this),
      plan_summary: this.handlePlanSummary.bind(this),
      appointment: this.handleAppointment.bind(this),
      ended: this.handleEnded.bind(this),
    };
  }

  private async handleStart(): Promise<void> {
    console.log('[Voice] Call started', this.session.call_id);
    this.session.state = 'language_selection';
  }

  private async handleLanguageSelection(): Promise<void> {
    console.log('[Voice] Language selection');
    // TTS: "Welcome. Please select your language: English (1), Hindi (2), Kannada (3)..."
    // User input: 1-6
    this.session.language = 'en'; // Default or selected
    this.session.state = 'identity_verification';
  }

  private async handleIdentityVerification(): Promise<void> {
    console.log('[Voice] Identity verification');
    // TTS: "Please state your full name"
    // ASR: captures name
    // Then: "Thank you. We have your information on file."
    this.session.caller_verified = true;
    this.session.state = 'consent_recording';
  }

  private async handleConsentRecording(): Promise<void> {
    console.log('[Voice] Consent for recording');
    // TTS: "For quality purposes, we may record this call. Do you consent? Press 1 for yes, 2 for no."
    // User input: 1 or 2
    this.session.recording_consent_given = true; // Or false based on user
    this.session.state = 'voice_consent';
  }

  private async handleVoiceConsent(): Promise<void> {
    console.log('[Voice] Clinical consent');
    // TTS: Versioned consent text
    // "I confirm I am seeking clinical decision support and understand this is not a substitute for an examination."
    // User confirms with 1
    this.session.voice_consent_given = true;
    this.session.state = 'intake_questions';
  }

  private async handleIntakeQuestions(): Promise<void> {
    console.log('[Voice] Intake questions');
    // Approved questions only (no clinical diagnosis)
    const questions = [
      'What brings you in today? Please describe your main concern.',
      'How long have you had this symptom?',
      'Are you currently taking any medicines?',
      'Do you have any known allergies?',
    ];

    for (const question of questions) {
      // TTS: question
      // ASR: capture response
      // Show to user: "I heard... [transcript]. Is that correct? Press 1 for yes, 2 to repeat."
      // If correction needed, re-record
      const response = `User response to: ${question}`;
      this.session.intake_responses[question] = response;
    }

    this.session.state = 'triage_assessment';
  }

  private async handleTriageAssessment(): Promise<void> {
    console.log('[Voice] Triage assessment');
    // Run deterministic triage (no LLM)
    // Mock result:
    this.session.triage_result = {
      level: 'routine',
      triggered_rules: [],
      message: 'No emergency flags detected. A clinician will review your information.',
    };

    if (this.session.triage_result.level === 'emergency') {
      this.session.state = 'emergency_escalation';
    } else if (this.session.triage_result.level === 'urgent') {
      this.session.state = 'urgent_callback';
    } else {
      this.session.state = 'plan_summary';
    }
  }

  private async handleEmergencyEscalation(): Promise<void> {
    console.log('[Voice] EMERGENCY ESCALATION');
    // TTS: Safety script (exact wording, no variation)
    const emergencyScript = `I'm concerned your symptoms may need urgent care. I cannot assess this safely.
Please contact your local emergency service now or go to the nearest emergency department.
If you are in immediate danger, do not wait for a callback.
Help is available 24/7.
Emergency number: 108`;

    console.log('EMERGENCY SCRIPT:', emergencyScript);

    // Play script and offer clinician handoff (optional)
    this.session.state = 'ended';
  }

  private async handleUrgentCallback(): Promise<void> {
    console.log('[Voice] Urgent callback scheduled');
    // Create priority queue item for clinician callback
    // TTS: "A clinician will call you back within 2 hours."
    this.session.callback_scheduled = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    this.session.state = 'appointment';
  }

  private async handlePlanSummary(): Promise<void> {
    console.log('[Voice] Plan summary');
    // If clinician has already signed a plan, TTS the summary
    // Otherwise: "Your information has been received. A clinician will contact you shortly."
    this.session.state = 'appointment';
  }

  private async handleAppointment(): Promise<void> {
    console.log('[Voice] Appointment scheduling');
    // TTS: "Would you like to schedule an appointment? Press 1 for yes, 2 for no."
    // If yes: show available times
    this.session.state = 'ended';
  }

  private async handleEnded(): Promise<void> {
    console.log('[Voice] Call ended');
    this.session.ended_at = new Date().toISOString();
    this.session.duration_seconds = Math.floor(
      (new Date(this.session.ended_at).getTime() - new Date(this.session.started_at).getTime()) /
        1000
    );
  }

  /**
   * Execute state machine step
   */
  async step(): Promise<void> {
    const handler = this.stateHandlers[this.session.state];
    if (!handler) {
      throw new Error(`Unknown state: ${this.session.state}`);
    }
    await handler();
  }

  /**
   * Add transcript part (streaming ASR result)
   */
  addTranscriptPart(text: string, confidence: number): void {
    this.session.transcript_parts.push({
      text,
      confidence,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Confirm or correct transcript
   */
  confirmTranscript(correctedText?: string): void {
    if (correctedText) {
      this.session.full_transcript = correctedText;
    } else {
      this.session.full_transcript = this.session.transcript_parts
        .map((p) => p.text)
        .join(' ');
    }
    this.session.transcript_confirmed = true;
  }

  /**
   * Get current session
   */
  getSession(): VoiceSession {
    return { ...this.session };
  }

  /**
   * Get emergency script if needed
   */
  getEmergencyScript(): string | null {
    if (this.session.triage_result?.level === 'emergency') {
      return `I'm concerned your symptoms may need urgent care. I cannot assess this safely.
Please contact your local emergency service now or go to the nearest emergency department.
If you are in immediate danger, do not wait for a callback.
Help is available 24/7. Emergency number: 108`;
    }
    return null;
  }
}
