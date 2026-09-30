/**
 * useCDSSession Hook
 * React hook for managing CDS session state and API interactions
 */

import { useState, useCallback, useEffect } from 'react';
import { CDSState } from '@clinical-saas/cds-engine';

interface UseCDSSessionResult {
  session: CDSState | null;
  loading: boolean;
  error: Error | null;
  loadSession: (sessionId: string) => Promise<void>;
  executePhase: () => Promise<void>;
  submitEvidence: (evidence: any) => Promise<void>;
  recordDecision: (recommendationId: string, decision: string, rationale?: string) => Promise<void>;
  getRecommendations: () => Promise<any[]>;
  getCareplan: () => Promise<any>;
  validateAgainstTriage: () => Promise<any>;
}

export function useCDSSession(): UseCDSSessionResult {
  const [session, setSession] = useState<CDSState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/v1/cds/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load CDS session');
      const data = await response.json();
      setSession(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const executePhase = useCallback(async () => {
    if (!session) throw new Error('No active CDS session');

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/v1/cds/sessions/${session.session_id}/execute`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to execute phase');
      const updated = await response.json();
      setSession((s) => (s ? { ...s, ...updated } : null));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const submitEvidence = useCallback(
    async (evidence: any) => {
      if (!session) throw new Error('No active CDS session');

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/v1/cds/sessions/${session.session_id}/evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evidence),
        });
        if (!response.ok) throw new Error('Failed to submit evidence');
        await loadSession(session.session_id);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [session, loadSession]
  );

  const recordDecision = useCallback(
    async (recommendationId: string, decision: string, rationale?: string) => {
      if (!session) throw new Error('No active CDS session');

      setLoading(true);
      setError(null);
      try {
        const body: any = {
          recommendation_id: recommendationId,
          decision,
        };

        if (decision === 'override' && rationale) {
          body.override_justification = rationale;
        }

        const response = await fetch(`/v1/cds/sessions/${session.session_id}/decisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error('Failed to record decision');
        await loadSession(session.session_id);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [session, loadSession]
  );

  const getRecommendations = useCallback(async () => {
    if (!session) throw new Error('No active CDS session');

    try {
      const response = await fetch(`/v1/cds/sessions/${session.session_id}/recommendations`);
      if (!response.ok) throw new Error('Failed to get recommendations');
      const data = await response.json();
      return data.recommendations || [];
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return [];
    }
  }, [session]);

  const getCareplan = useCallback(async () => {
    if (!session) throw new Error('No active CDS session');

    try {
      const response = await fetch(`/v1/cds/sessions/${session.session_id}/careplan`);
      if (!response.ok) throw new Error('Failed to get careplan');
      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    }
  }, [session]);

  const validateAgainstTriage = useCallback(async () => {
    if (!session) throw new Error('No active CDS session');

    try {
      const response = await fetch(
        `/v1/cds/sessions/${session.session_id}/validate-against-triage`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to validate');
      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    }
  }, [session]);

  return {
    session,
    loading,
    error,
    loadSession,
    executePhase,
    submitEvidence,
    recordDecision,
    getRecommendations,
    getCareplan,
    validateAgainstTriage,
  };
}

export default useCDSSession;
