/**
 * Voice WebRTC & PSTN gateway
 * Handles: ASR (automatic speech recognition), TTS, session management
 */

import { VoiceCallStateMachine, VoiceSession } from './state-machine';

export interface VoiceGatewayConfig {
  asr_provider: 'google' | 'aws' | 'azure';
  tts_provider: 'google' | 'aws' | 'azure';
  supported_languages: string[];
  emergency_number: string; // e.g., '108' for India
}

/**
 * Voice gateway service
 */
export class VoiceGateway {
  private config: VoiceGatewayConfig;
  private activeSessions: Map<string, VoiceCallStateMachine> = new Map();

  constructor(config: VoiceGatewayConfig) {
    this.config = config;
  }

  /**
   * Start a new voice call session
   */
  async startCall(tenantId: string, channel: 'webrtc' | 'pstn', phoneNumber?: string): Promise<VoiceSession> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const stateMachine = new VoiceCallStateMachine(callId, tenantId, channel);

    // Execute first state
    await stateMachine.step();

    this.activeSessions.set(callId, stateMachine);

    return stateMachine.getSession();
  }

  /**
   * Process ASR (speech-to-text) result
   * Called when ASR returns interim or final transcript
   */
  async processASRResult(
    callId: string,
    transcript: string,
    confidence: number,
    isFinal: boolean
  ): Promise<{ action: 'continue' | 'confirm' | 'retry'; message: string }> {
    const stateMachine = this.activeSessions.get(callId);
    if (!stateMachine) {
      return { action: 'retry', message: 'Session not found' };
    }

    const session = stateMachine.getSession();

    if (isFinal) {
      stateMachine.addTranscriptPart(transcript, confidence);

      // Low confidence check
      if (confidence < 0.7) {
        return {
          action: 'retry',
          message: `I didn't catch that clearly. Could you please repeat?`,
        };
      }

      return {
        action: 'confirm',
        message: `I heard: "${transcript}". Is that correct? Say yes to continue or repeat to try again.`,
      };
    } else {
      // Interim result - show to user but don't store yet
      return {
        action: 'continue',
        message: `(Hearing: "${transcript}...")`,
      };
    }
  }

  /**
   * User confirms or corrects transcript
   */
  async confirmTranscript(
    callId: string,
    confirmed: boolean,
    correctedText?: string
  ): Promise<void> {
    const stateMachine = this.activeSessions.get(callId);
    if (!stateMachine) {
      throw new Error('Session not found');
    }

    if (confirmed) {
      stateMachine.confirmTranscript(correctedText);
    }
    // If not confirmed, user will re-record via ASR
  }

  /**
   * Progress to next state
   */
  async nextState(callId: string): Promise<VoiceSession> {
    const stateMachine = this.activeSessions.get(callId);
    if (!stateMachine) {
      throw new Error('Session not found');
    }

    await stateMachine.step();
    return stateMachine.getSession();
  }

  /**
   * Get current session state
   */
  getSession(callId: string): VoiceSession | null {
    const stateMachine = this.activeSessions.get(callId);
    return stateMachine ? stateMachine.getSession() : null;
  }

  /**
   * Check for emergency escalation
   */
  isEmergencyEscalation(callId: string): boolean {
    const session = this.getSession(callId);
    return session?.triage_result?.level === 'emergency' ?? false;
  }

  /**
   * Get emergency script if applicable
   */
  getEmergencyScript(callId: string): string | null {
    const stateMachine = this.activeSessions.get(callId);
    return stateMachine ? stateMachine.getEmergencyScript() : null;
  }

  /**
   * End call and clean up
   */
  async endCall(callId: string): Promise<VoiceSession> {
    const stateMachine = this.activeSessions.get(callId);
    if (!stateMachine) {
      throw new Error('Session not found');
    }

    const session = stateMachine.getSession();
    this.activeSessions.delete(callId);

    return session;
  }

  /**
   * Play audio to user (TTS)
   * In production, integrates with voice provider
   */
  async playAudio(callId: string, text: string, language: string): Promise<void> {
    console.log(`[TTS] Playing audio in ${language}:`);
    console.log(text);
    // Call TTS provider (Google, AWS, or Azure)
    // Stream audio to WebRTC/PSTN connection
  }

  /**
   * Listen for user speech (ASR)
   * In production, streams audio to ASR provider
   */
  async listenForSpeech(callId: string, language: string): Promise<string> {
    console.log(`[ASR] Listening for speech in ${language}`);
    // Stream audio from WebRTC/PSTN to ASR provider
    // Return final transcript
    return 'Mock transcript from user';
  }

  /**
   * Detect silence and timeouts
   */
  async detectSilence(callId: string, timeoutSeconds: number = 30): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[Voice] Silence detected after ${timeoutSeconds}s`);
        resolve(true);
      }, timeoutSeconds * 1000);
    });
  }

  /**
   * Handle human handoff (clinician pickup)
   */
  async handoffToClinician(callId: string, clinicianPhone: string): Promise<void> {
    const session = this.getSession(callId);
    if (!session) {
      throw new Error('Session not found');
    }

    console.log(`[Voice] Transferring call to clinician: ${clinicianPhone}`);
    // Initiate warm transfer via PSTN or internal routing
    session.handoff_to_clinician = true;
  }
}
