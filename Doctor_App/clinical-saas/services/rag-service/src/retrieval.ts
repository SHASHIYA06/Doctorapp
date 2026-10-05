/**
 * RAG (Retrieval-Augmented Generation) service
 * Retrieves approved monographs and chunks with citations
 */

import { MedicineMonograph } from '@domain/types';

export interface RetrievalResult {
  chunks: {
    chunk_id: string;
    content: string;
    section: string;
    source: string;
    monograph_id: string;
    confidence_score: number;
  }[];
  monographs: MedicineMonograph[];
  retrieval_trace: {
    query: string;
    query_vector?: number[];
    filters_applied: string[];
    results_count: number;
    execution_time_ms: number;
  };
}

/**
 * RAG Retrieval Service
 * Provides approved knowledge with audit trails
 */
export class RAGRetrievalService {
  private approvedMonographs: Map<string, MedicineMonograph>;
  private vectorIndex: Map<string, number[]> = new Map(); // Mock vector store

  constructor(approvedMonographs: MedicineMonograph[]) {
    this.approvedMonographs = new Map(approvedMonographs.map((m) => [m.monograph_id, m]));
  }

  /**
   * Search for monographs by indication or query
   */
  async search(
    query: string,
    modality: string,
    age_group?: 'adult' | 'pediatric',
    safety_context?: { allergies: string[]; active_meds: string[] }
  ): Promise<RetrievalResult> {
    const startTime = Date.now();
    const filters_applied: string[] = [];

    // 1. Filter by modality
    let candidates = Array.from(this.approvedMonographs.values()).filter((m) => m.modality === modality);
    filters_applied.push(`modality:${modality}`);

    // 2. Filter by age appropriateness (if applicable)
    if (age_group) {
      candidates = candidates.filter((m) => {
        if (age_group === 'pediatric' && m.age_restrictions?.includes('pediatric_contraindicated')) {
          return false;
        }
        return true;
      });
      filters_applied.push(`age_group:${age_group}`);
    }

    // 3. Safety filter: exclude if patient has known contraindication
    if (safety_context) {
      candidates = candidates.filter((m) => {
        const hasContraindication = m.contraindications.some((c) =>
          safety_context.allergies.some((a) => c.toLowerCase().includes(a.toLowerCase()))
        );
        return !hasContraindication;
      });
      filters_applied.push('safety_filters_applied');
    }

    // 4. Semantic search (mock: simple substring matching in production, use embeddings)
    const queryLower = query.toLowerCase();
    const scored = candidates.map((m) => {
      let score = 0;

      // Title match
      if (m.canonical_name.toLowerCase().includes(queryLower)) {
        score += 0.8;
      }

      // Indication match
      if (m.indications.some((ind) => ind.indication.toLowerCase().includes(queryLower))) {
        score += 0.6;
      }

      // Brand name match
      if (m.brand_names.some((b) => b.toLowerCase().includes(queryLower))) {
        score += 0.5;
      }

      return { monograph: m, score };
    });

    const topResults = scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => r.monograph);

    filters_applied.push(`query:${query}`);

    const result: RetrievalResult = {
      chunks: topResults.map((m) => ({
        chunk_id: `chunk_${m.monograph_id}`,
        content: m.patient_summary,
        section: 'summary',
        source: m.source_url,
        monograph_id: m.monograph_id,
        confidence_score: 0.85,
      })),
      monographs: topResults,
      retrieval_trace: {
        query,
        filters_applied,
        results_count: topResults.length,
        execution_time_ms: Date.now() - startTime,
      },
    };

    return result;
  }

  /**
   * Get similar medicines (for interactions/contraindications check)
   */
  async getSimilarMedicines(
    medicineName: string,
    modality: string
  ): Promise<MedicineMonograph[]> {
    const searchResults = await this.search(medicineName, modality);
    return searchResults.monographs;
  }

  /**
   * Retrieve full monograph details
   */
  getMonograph(monographId: string): MedicineMonograph | null {
    return this.approvedMonographs.get(monographId) || null;
  }

  /**
   * Check for interactions between medicines
   */
  checkInteractions(
    medicine1: string,
    medicine2: string,
    modality: string
  ): {
    interaction_found: boolean;
    severity?: 'mild' | 'moderate' | 'severe';
    description?: string;
  } {
    const mono1 = Array.from(this.approvedMonographs.values()).find(
      (m) => m.canonical_name.toLowerCase() === medicine1.toLowerCase()
    );

    if (!mono1) {
      return { interaction_found: false };
    }

    const hasInteraction = mono1.common_interactions.some(
      (i) => i.medicine.toLowerCase() === medicine2.toLowerCase()
    );

    if (!hasInteraction) {
      return { interaction_found: false };
    }

    const interaction = mono1.common_interactions.find(
      (i) => i.medicine.toLowerCase() === medicine2.toLowerCase()
    );

    return {
      interaction_found: true,
      severity: interaction?.severity,
      description: `${medicine1} + ${medicine2}: monitor for interactions`,
    };
  }

  /**
   * Verify citation is from approved source
   */
  verifyCitation(monographId: string, sourceUrl?: string): boolean {
    const mono = this.approvedMonographs.get(monographId);
    if (!mono) {
      return false;
    }

    if (sourceUrl && mono.source_url !== sourceUrl) {
      return false;
    }

    // Check if monograph is still approved and not expired
    if (mono.approval_state !== 'approved') {
      return false;
    }

    if (new Date(mono.expiry_date) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Get retrieval statistics for audit
   */
  getRetrievalStats(): {
    total_approved_monographs: number;
    by_modality: Record<string, number>;
    expiring_soon: number;
    expired: number;
  } {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const byModality: Record<string, number> = {
      allopathy: 0,
      ayurveda: 0,
      homeopathy: 0,
    };

    let expiringCount = 0;
    let expiredCount = 0;

    for (const mono of this.approvedMonographs.values()) {
      byModality[mono.modality] = (byModality[mono.modality] || 0) + 1;

      const expiryDate = new Date(mono.expiry_date);
      if (expiryDate < now) {
        expiredCount++;
      } else if (expiryDate < twoWeeksFromNow) {
        expiringCount++;
      }
    }

    return {
      total_approved_monographs: this.approvedMonographs.size,
      by_modality: byModality,
      expiring_soon: expiringCount,
      expired: expiredCount,
    };
  }
}
