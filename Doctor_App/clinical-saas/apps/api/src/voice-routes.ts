/**
 * Voice API endpoints
 * Routes for WebRTC/PSTN voice call management
 */

import express, { Request, Response } from 'express';
import { VoiceGateway } from './gateway';
import { authenticate, enforceTenantIsolation, rbac, auditLog } from '../api/src/rbac';

const router = express.Router();

const voiceGateway = new VoiceGateway({
  asr_provider: 'google',
  tts_provider: 'google',
  supported_languages: ['en', 'hi', 'kn', 'ta', 'te', 'ml'],
  emergency_number: '108',
});

/**
 * POST /v1/voice/start-call
 * Initiate a new voice call session (WebRTC or PSTN)
 */
router.post('/start-call', authenticate, enforceTenantIsolation, auditLog('create'), async (req: Request, res: Response) => {
  const { channel, phone_number } = req.body;

  if (!['webrtc', 'pstn'].includes(channel)) {
    return res.status(400).json({ error: 'Invalid channel: webrtc or pstn required' });
  }

  try {
    const session = await voiceGateway.startCall(
      (req as any).user.tenant_id,
      channel,
      phone_number
    );

    res.status(201).json({
      session_id: session.session_id,
      call_id: session.call_id,
      state: session.state,
      language: session.language,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start call' });
  }
});

/**
 * POST /v1/voice/asr-result
 * Process speech-to-text result
 */
router.post('/asr-result', authenticate, async (req: Request, res: Response) => {
  const { call_id, transcript, confidence, is_final } = req.body;

  try {
    const result = await voiceGateway.processASRResult(
      call_id,
      transcript,
      confidence,
      is_final
    );

    // Check for emergency escalation
    if (voiceGateway.isEmergencyEscalation(call_id)) {
      return res.json({
        ...result,
        emergency_script: voiceGateway.getEmergencyScript(call_id),
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process ASR' });
  }
});

/**
 * POST /v1/voice/confirm-transcript
 * Patient confirms or corrects transcript
 */
router.post('/confirm-transcript', authenticate, async (req: Request, res: Response) => {
  const { call_id, confirmed, corrected_text } = req.body;

  try {
    await voiceGateway.confirmTranscript(call_id, confirmed, corrected_text);
    const session = voiceGateway.getSession(call_id);
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm transcript' });
  }
});

/**
 * POST /v1/voice/next-state
 * Progress to next state in call flow
 */
router.post('/next-state', authenticate, async (req: Request, res: Response) => {
  const { call_id } = req.body;

  try {
    const session = await voiceGateway.nextState(call_id);
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to progress to next state' });
  }
});

/**
 * GET /v1/voice/session/:call_id
 * Get current session state
 */
router.get('/session/:call_id', authenticate, (req: Request, res: Response) => {
  const session = voiceGateway.getSession(req.params.call_id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ session });
});

/**
 * POST /v1/voice/end-call
 * End voice call and clean up
 */
router.post('/end-call', authenticate, auditLog('delete'), async (req: Request, res: Response) => {
  const { call_id } = req.body;

  try {
    const session = await voiceGateway.endCall(call_id);
    res.json({
      call_id,
      duration_seconds: session.duration_seconds,
      transcript: session.full_transcript,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end call' });
  }
});

export default router;
