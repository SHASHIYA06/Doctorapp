/**
 * RAG API endpoints for medicine monograph retrieval
 */

import express, { Request, Response } from 'express';
import { authenticate, enforceTenantIsolation, rbac } from '../api/src/rbac';
import { RAGRetrievalService } from './retrieval';
import { MonographIngestionService } from './ingestion';

const router = express.Router();

const ingestionService = new MonographIngestionService();
const retrievalService = new RAGRetrievalService([]);

/**
 * POST /v1/monographs/search
 * Search approved medicine monographs
 */
router.post('/search', authenticate, enforceTenantIsolation, async (req: Request, res: Response) => {
  const { query, modality, age_group, allergies, active_medications } = req.body;

  if (!query || !modality) {
    return res.status(400).json({ error: 'query and modality required' });
  }

  try {
    const result = await retrievalService.search(query, modality, age_group, {
      allergies: allergies || [],
      active_meds: active_medications || [],
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Retrieval failed' });
  }
});

/**
 * GET /v1/monographs/:id
 * Get full monograph details
 */
router.get('/:id', authenticate, enforceTenantIsolation, (req: Request, res: Response) => {
  try {
    const mono = retrievalService.getMonograph(req.params.id);
    if (!mono) {
      return res.status(404).json({ error: 'Monograph not found' });
    }

    res.json(mono);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve monograph' });
  }
});

/**
 * POST /v1/monographs/check-interactions
 * Check for drug interactions
 */
router.post('/check-interactions', authenticate, async (req: Request, res: Response) => {
  const { medicine_1, medicine_2, modality } = req.body;

  if (!medicine_1 || !medicine_2 || !modality) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const result = retrievalService.checkInteractions(medicine_1, medicine_2, modality);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Interaction check failed' });
  }
});

/**
 * POST /v1/monographs/upload-source
 * Admin: Upload licensed source document
 */
router.post(
  '/upload-source',
  authenticate,
  rbac('MedicineMonograph', 'create'),
  async (req: Request, res: Response) => {
    const { source_name, source_url, source_license, file_content, file_type } = req.body;

    if (!source_name || !source_url) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    try {
      const source = await ingestionService.uploadSourceDocument(
        (req as any).user.tenant_id,
        {
          name: source_name,
          content: Buffer.from(file_content, 'base64'),
          type: file_type || 'json',
          url: source_url,
          license: source_license,
        },
        (req as any).user.user_id
      );

      res.status(201).json({
        source_id: source.id,
        status: source.status,
        created_at: source.created_at,
      });
    } catch (err) {
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

/**
 * POST /v1/monographs/submit-review
 * Admin: Submit monographs for review
 */
router.post(
  '/submit-review',
  authenticate,
  rbac('MedicineMonograph', 'update'),
  async (req: Request, res: Response) => {
    const { source_id, monograph_ids } = req.body;

    if (!source_id || !Array.isArray(monograph_ids)) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    try {
      const result = await ingestionService.submitForReview(source_id, monograph_ids);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Submission failed' });
    }
  }
);

/**
 * POST /v1/monographs/approve
 * Content Review Council: Approve monographs
 */
router.post(
  '/approve',
  authenticate,
  rbac('MedicineMonograph', 'approve'),
  async (req: Request, res: Response) => {
    const { source_id, monograph_ids, review_notes } = req.body;

    if (!source_id || !Array.isArray(monograph_ids)) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    try {
      const result = await ingestionService.approveMonographs(
        source_id,
        monograph_ids,
        (req as any).user.user_id,
        review_notes || ''
      );

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Approval failed' });
    }
  }
);

/**
 * GET /v1/monographs/stats
 * Admin: Retrieval statistics
 */
router.get('/stats', authenticate, rbac('MedicineMonograph', 'read'), (req: Request, res: Response) => {
  try {
    const stats = retrievalService.getRetrievalStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

export default router;
