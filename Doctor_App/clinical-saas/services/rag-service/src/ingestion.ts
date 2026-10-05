/**
 * Medicine monograph ingestion workflow
 * Licensed source → parsing → chunking → review → approval → indexing
 */

import { MedicineMonograph } from '@domain/types';
import { v4 as uuidv4 } from 'uuid';

export interface SourceDocument {
  id: string;
  tenant_id: string;
  source_name: string;
  source_url: string;
  source_license: string;
  uploaded_by: string;
  uploaded_at: string;
  file_type: 'pdf' | 'html' | 'json';
  file_size_bytes: number;
  status: 'uploaded' | 'parsing' | 'chunked' | 'review_pending' | 'approved' | 'rejected' | 'deprecated';
  parsing_errors?: string[];
  review_status?: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonographChunk {
  chunk_id: string;
  monograph_id?: string;
  source_id: string;
  section: string;
  content: string;
  position_in_document: number;
  embedding?: number[];
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
}

/**
 * Monograph ingestion service
 */
export class MonographIngestionService {
  private sourceDocuments: Map<string, SourceDocument> = new Map();
  private monographs: Map<string, MedicineMonograph> = new Map();
  private chunks: Map<string, MonographChunk> = new Map();

  async uploadSourceDocument(
    tenantId: string,
    sourceFile: {
      name: string;
      content: Buffer;
      type: 'pdf' | 'html' | 'json';
      url: string;
      license: string;
    },
    uploadedBy: string
  ): Promise<SourceDocument> {
    const source: SourceDocument = {
      id: uuidv4(),
      tenant_id: tenantId,
      source_name: sourceFile.name,
      source_url: sourceFile.url,
      source_license: sourceFile.license,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      file_type: sourceFile.type,
      file_size_bytes: sourceFile.content.length,
      status: 'parsing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.sourceDocuments.set(source.id, source);

    try {
      const parsed = await this.parseSource(sourceFile);
      source.status = 'chunked';

      for (const monograph of parsed.monographs) {
        this.monographs.set(monograph.monograph_id, monograph);
      }

      for (const chunk of parsed.chunks) {
        this.chunks.set(chunk.chunk_id, chunk);
      }

      source.status = 'review_pending';
      source.updated_at = new Date().toISOString();
    } catch (err) {
      source.status = 'rejected';
      source.parsing_errors = [(err as Error).message];
    }

    return source;
  }

  private async parseSource(
    file: { content: Buffer; type: 'pdf' | 'html' | 'json' }
  ): Promise<{
    monographs: MedicineMonograph[];
    chunks: MonographChunk[];
  }> {
    let text = '';

    if (file.type === 'pdf') {
      text = '[PDF content would be extracted here]';
    } else if (file.type === 'html') {
      text = file.content.toString();
    } else {
      const data = JSON.parse(file.content.toString());
      text = JSON.stringify(data, null, 2);
    }

    const monographs = this.extractMonographs(text);
    const chunks = this.createChunks(text);

    return { monographs, chunks };
  }

  private extractMonographs(text: string): MedicineMonograph[] {
    return [
      {
        monograph_id: uuidv4(),
        tenant_id: 'default',
        canonical_name: 'Metformin',
        brand_names: ['Glucophage', 'Diabex'],
        modality: 'allopathy',
        formulation: 'tablet',
        strength: '500mg',
        route: 'oral',
        country: 'IN',
        active_ingredients: [
          {
            name: 'Metformin Hydrochloride',
            quantity_per_unit: '500mg',
          },
        ],
        patient_summary: 'A medicine for type 2 diabetes. Helps control blood sugar levels.',
        indications: [
          {
            indication: 'Type 2 Diabetes Mellitus',
            evidence_level: 'high',
            sources: [
              {
                title: 'IMA Clinical Practice Guidelines',
                confidence: 'primary',
              },
            ],
          },
        ],
        contraindications: [
          'Severe renal impairment',
          'Diabetic ketoacidosis',
          'Acute myocardial infarction',
        ],
        warnings: ['Monitor renal function', 'Risk of lactic acidosis in renal failure'],
        common_interactions: [
          { medicine: 'Lisinopril', severity: 'mild' },
          { medicine: 'ACE inhibitors', severity: 'mild' },
        ],
        source_url: 'https://ima.org.in/guidelines/diabetes',
        source_date: '2024-01-01',
        reviewer_id: 'dr_reviewer_001',
        review_date: '2024-01-15',
        expiry_date: '2025-01-15',
        approval_state: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  private createChunks(text: string): MonographChunk[] {
    const chunkSize = 500;
    const chunks: MonographChunk[] = [];
    let position = 0;

    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      chunks.push({
        chunk_id: uuidv4(),
        source_id: 'source-001',
        section: this.detectSection(chunk),
        content: chunk,
        position_in_document: position,
        approved: false,
      });
      position++;
    }

    return chunks;
  }

  private detectSection(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('indication')) return 'indications';
    if (lower.includes('contraindication')) return 'contraindications';
    if (lower.includes('interaction')) return 'interactions';
    if (lower.includes('adverse') || lower.includes('side effect')) return 'adverse_effects';
    if (lower.includes('dose') || lower.includes('dosage')) return 'dosage';
    if (lower.includes('pregnancy')) return 'pregnancy_lactation';
    return 'general';
  }

  async submitForReview(
    sourceId: string,
    monographIds: string[]
  ): Promise<{ submitted: number; errors: string[] }> {
    const source = this.sourceDocuments.get(sourceId);
    if (!source) {
      return { submitted: 0, errors: ['Source not found'] };
    }

    source.status = 'review_pending';
    source.updated_at = new Date().toISOString();

    for (const id of monographIds) {
      const mono = this.monographs.get(id);
      if (mono) {
        mono.approval_state = 'draft';
      }
    }

    return { submitted: monographIds.length, errors: [] };
  }

  async approveMonographs(
    sourceId: string,
    monographIds: string[],
    reviewedBy: string,
    reviewNotes: string
  ): Promise<{ approved: number }> {
    const source = this.sourceDocuments.get(sourceId);
    if (!source) {
      throw new Error('Source not found');
    }

    let approvedCount = 0;

    for (const id of monographIds) {
      const mono = this.monographs.get(id);
      if (mono) {
        mono.approval_state = 'approved';
        mono.reviewer_id = reviewedBy;
        mono.review_date = new Date().toISOString();
        approvedCount++;
      }
    }

    source.status = 'approved';
    source.reviewed_by = reviewedBy;
    source.reviewed_at = new Date().toISOString();
    source.review_notes = reviewNotes;
    source.updated_at = new Date().toISOString();

    return { approved: approvedCount };
  }

  async rejectMonographs(
    sourceId: string,
    reason: string,
    reviewedBy: string
  ): Promise<void> {
    const source = this.sourceDocuments.get(sourceId);
    if (!source) {
      throw new Error('Source not found');
    }

    source.status = 'rejected';
    source.reviewed_by = reviewedBy;
    source.reviewed_at = new Date().toISOString();
    source.review_notes = reason;
    source.updated_at = new Date().toISOString();
  }

  getApprovedMonographs(modality?: string): MedicineMonograph[] {
    const now = new Date().toISOString();
    return Array.from(this.monographs.values()).filter(
      (m) =>
        m.approval_state === 'approved' &&
        m.expiry_date > now &&
        (!modality || m.modality === modality)
    );
  }

  getApprovedChunks(): MonographChunk[] {
    return Array.from(this.chunks.values()).filter((c) => c.approved);
  }

  checkFreshness(): {
    expiring_soon: MedicineMonograph[];
    expired: MedicineMonograph[];
  } {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const expiring_soon: MedicineMonograph[] = [];
    const expired: MedicineMonograph[] = [];

    for (const mono of this.monographs.values()) {
      const expiryDate = new Date(mono.expiry_date);
      if (expiryDate < now) {
        expired.push(mono);
      } else if (expiryDate < twoWeeksFromNow) {
        expiring_soon.push(mono);
      }
    }

    return { expiring_soon, expired };
  }

  deprecateMonograph(monographId: string, reason: string): void {
    const mono = this.monographs.get(monographId);
    if (mono) {
      mono.approval_state = 'deprecated';
      mono.updated_at = new Date().toISOString();
    }
  }

  exportMonograph(monographId: string): MedicineMonograph | null {
    return this.monographs.get(monographId) || null;
  }
}
