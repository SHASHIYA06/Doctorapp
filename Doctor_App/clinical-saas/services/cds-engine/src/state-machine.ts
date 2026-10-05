/**
 * Complete LangGraph State Machine Implementation
 * Binds graph nodes, edges, and conditional routing
 */

import { CDSState, CDSPhase, ClinicianDecision, Recommendation } from './types';
import { CDSGraph, getNextPhase, routeEdge } from './graph';

/**
 * State Update Type
 */
export type StateUpdate = Partial<CDSState>;

/**
 * Node Handler Type
 */
export type NodeHandler = (state: CDSState) => Promise<StateUpdate>;

/**
 * Edge Condition Type
 */
export type EdgeCondition = (state: CDSState) => boolean;

/**
 * Graph Definition
 */
interface GraphNode {
  id: string;
  handler: NodeHandler;
}

interface GraphEdge {
  source: string;
  target: string;
  condition?: EdgeCondition;
}

/**
 * LangGraph CDS State Machine
 */
export class CDSStateMachine {
  private nodes: Map<string, NodeHandler> = new Map();
  private edges: GraphEdge[] = [];
  private graph: CDSGraph;

  constructor(graph: CDSGraph) {
    this.graph = graph;
    this.registerNodes();
    this.registerEdges();
  }

  /**
   * Register all state machine nodes
   */
  private registerNodes(): void {
    this.nodes.set('initialize', (state) => this.graph.initializeSession(state));
    this.nodes.set('gather_evidence', (state) => this.graph.gatherEvidence(state));
    this.nodes.set('analyze_evidence', (state) => this.graph.analyzeEvidence(state));
    this.nodes.set('generate_recommendations', (state) =>
      this.graph.generateRecommendations(state)
    );
    this.nodes.set('perform_safety_check', (state) => this.graph.performSafetyCheck(state));
    this.nodes.set('draft_care_plan', (state) => this.graph.draftCarePlan(state));
    this.nodes.set('complete_session', (state) => this.graph.completeCDSSession(state));
    this.nodes.set('error_handler', (state) => this.graph.handleError(state, new Error('Generic error')));
  }

  /**
   * Register state machine edges with conditions
   */
  private registerEdges(): void {
    this.edges = [
      {
        source: 'initialize',
        target: 'gather_evidence',
      },
      {
        source: 'gather_evidence',
        target: 'analyze_evidence',
        condition: (state) => state.evidence.evidence_completeness_score > 0.5,
      },
      {
        source: 'gather_evidence',
        target: 'gather_evidence',
        condition: (state) => state.evidence.evidence_completeness_score <= 0.5,
      },
      {
        source: 'analyze_evidence',
        target: 'generate_recommendations',
        condition: (state) => state.analysis !== undefined,
      },
      {
        source: 'analyze_evidence',
        target: 'error_handler',
        condition: (state) => state.analysis === undefined && state.completion_status === 'error',
      },
      {
        source: 'generate_recommendations',
        target: 'perform_safety_check',
        condition: (state) => state.recommendations.length > 0,
      },
      {
        source: 'perform_safety_check',
        target: 'draft_care_plan',
      },
      {
        source: 'draft_care_plan',
        target: 'complete_session',
      },
      {
        source: 'complete_session',
        target: 'complete_session',
      },
    ];
  }

  /**
   * Execute the state machine
   */
  async execute(initialState: CDSState): Promise<CDSState> {
    let state = initialState;
    let currentNodeId = 'initialize';
    let iterations = 0;
    const maxIterations = 20; // Prevent infinite loops

    while (iterations < maxIterations) {
      iterations++;

      // Get current node handler
      const handler = this.nodes.get(currentNodeId);
      if (!handler) {
        throw new Error(`Unknown node: ${currentNodeId}`);
      }

      try {
        // Execute node
        const update = await handler(state);
        state = { ...state, ...update };

        // Check for terminal states
        if (state.completion_status === 'completed' || state.completion_status === 'error') {
          break;
        }

        // Route to next node
        const nextNodeId = this.getNextNode(currentNodeId, state);
        if (!nextNodeId) {
          break;
        }

        currentNodeId = nextNodeId;
      } catch (error) {
        console.error(`Error in node ${currentNodeId}:`, error);
        state = {
          ...state,
          completion_status: 'error',
          errors: [
            ...state.errors,
            {
              message: error instanceof Error ? error.message : 'Unknown error',
              phase: state.phase,
              timestamp: new Date().toISOString(),
              resolved: false,
            },
          ],
        };
        break;
      }
    }

    if (iterations >= maxIterations) {
      throw new Error('State machine exceeded maximum iterations');
    }

    return state;
  }

  /**
   * Determine next node based on current state
   */
  private getNextNode(currentNodeId: string, state: CDSState): string | null {
    const outgoingEdges = this.edges.filter((e) => e.source === currentNodeId);

    // Find edges that match conditions
    for (const edge of outgoingEdges) {
      if (!edge.condition || edge.condition(state)) {
        return edge.target;
      }
    }

    // No matching edge found
    return null;
  }

  /**
   * Get node graph for visualization
   */
  getGraphVisualization(): object {
    return {
      nodes: Array.from(this.nodes.keys()).map((id) => ({
        id,
        label: id.replace(/_/g, ' ').toUpperCase(),
      })),
      edges: this.edges.map((e) => ({
        source: e.source,
        target: e.target,
        condition: e.condition ? e.condition.toString() : 'always',
      })),
    };
  }

  /**
   * Test node independently
   */
  async testNode(nodeId: string, state: CDSState): Promise<StateUpdate> {
    const handler = this.nodes.get(nodeId);
    if (!handler) {
      throw new Error(`Unknown node: ${nodeId}`);
    }
    return handler(state);
  }
}

/**
 * Clinician Decision Router
 * Routes based on clinician review decisions
 */
export function routeClinicianDecision(
  decision: ClinicianDecision,
  recommendation: Recommendation
): 'accept' | 'override' | 'request_alternative' | 'reject' {
  switch (decision.decision) {
    case 'accept':
      return 'accept';
    case 'override':
      if (!decision.override_justification) {
        throw new Error('Override requires justification');
      }
      return 'override';
    case 'request_alternative':
      return 'request_alternative';
    case 'reject':
      return 'reject';
    default:
      throw new Error(`Unknown decision: ${decision.decision}`);
  }
}

/**
 * Session Progress Calculator
 */
export function calculateSessionProgress(state: CDSState): {
  phase: number;
  totalPhases: number;
  percentComplete: number;
  phaseName: string;
} {
  const phases: CDSPhase[] = [
    'initialized',
    'evidence_gathering',
    'analysis',
    'recommendation',
    'review',
    'draft_plan',
    'complete',
  ];

  const currentPhaseIndex = phases.indexOf(state.phase);
  const totalPhases = phases.length;
  const percentComplete = Math.round(((currentPhaseIndex + 1) / totalPhases) * 100);

  return {
    phase: currentPhaseIndex + 1,
    totalPhases,
    percentComplete,
    phaseName: state.phase.replace(/_/g, ' ').toUpperCase(),
  };
}

/**
 * Session State Validator
 */
export function validateCDSState(state: CDSState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!state.session_id) errors.push('Missing session_id');
  if (!state.patient_id) errors.push('Missing patient_id');
  if (!state.clinician_id) errors.push('Missing clinician_id');
  if (!state.modality) errors.push('Missing modality');
  if (!state.triage_result) errors.push('Missing triage_result');

  // Consistency checks
  if (state.phase === 'complete' && state.completion_status !== 'completed') {
    errors.push('Phase is complete but completion_status is not "completed"');
  }

  if (state.phase === 'recommendation' && state.analysis === undefined) {
    errors.push('Phase is recommendation but analysis is undefined');
  }

  if (state.phase === 'draft_plan' && state.draft_careplan === undefined) {
    errors.push('Phase is draft_plan but draft_careplan is undefined');
  }

  // Evidence validation
  if (state.evidence && state.evidence.patient_history) {
    if (!state.evidence.patient_history.chief_complaint) {
      errors.push('Patient history missing chief complaint');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * State Snapshot for Debugging
 */
export function captureStateSnapshot(state: CDSState): object {
  return {
    session_id: state.session_id,
    phase: state.phase,
    completion_status: state.completion_status,
    timestamp: new Date().toISOString(),
    evidence_completeness: state.evidence.evidence_completeness_score,
    recommendations_count: state.recommendations.length,
    clinician_decisions_count: state.clinician_decisions.length,
    errors_count: state.errors.filter((e) => !e.resolved).length,
    safety_alerts_count: state.safety_alerts.length,
    phase_duration_ms: state.last_updated
      ? new Date(state.last_updated).getTime() - new Date(state.created_at).getTime()
      : 0,
  };
}
