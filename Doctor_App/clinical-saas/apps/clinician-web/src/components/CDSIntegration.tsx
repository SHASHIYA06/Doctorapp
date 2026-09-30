/**
 * Clinical Decision Support Integration Component
 * Displays AI-powered clinical recommendations, evidence-based guidelines, and treatment options
 */

import React, { useState } from 'react';
import '../styles/CDSIntegration.css';

interface CDSRecommendation {
  id: string;
  type: 'diagnosis' | 'treatment' | 'monitoring' | 'prevention' | 'referral';
  title: string;
  description: string;
  confidence: number;
  evidenceLevel: 'high' | 'moderate' | 'low';
  references: string[];
  actionableItems: string[];
  riskFactors: string[];
  createdAt: string;
  reviewed: boolean;
  reviewNotes?: string;
}

interface CaseData {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  medicalHistory: string[];
  medications: string[];
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
}

type FilterType = 'all' | 'diagnosis' | 'treatment' | 'monitoring' | 'prevention' | 'referral';
type SortType = 'confidence' | 'evidence' | 'type';

const typeIcons: Record<string, string> = {
  diagnosis: '🔍',
  treatment: '💊',
  monitoring: '📊',
  prevention: '🛡️',
  referral: '👨‍⚕️'
};

const typeLabels: Record<string, string> = {
  diagnosis: 'Diagnosis',
  treatment: 'Treatment',
  monitoring: 'Monitoring',
  prevention: 'Prevention',
  referral: 'Specialist Referral'
};

const evidenceColors: Record<string, { bg: string; color: string; text: string }> = {
  high: { bg: '#d1fae5', color: '#065f46', text: 'High Evidence' },
  moderate: { bg: '#fef3c7', color: '#92400e', text: 'Moderate Evidence' },
  low: { bg: '#fee2e2', color: '#7f1d1d', text: 'Low Evidence' }
};

export const CDSIntegration: React.FC = () => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('confidence');
  const [selectedRecommendation, setSelectedRecommendation] = useState<CDSRecommendation | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock case data
  const caseData: CaseData = {
    id: '1',
    patientName: 'Rajesh Kumar',
    age: 45,
    gender: 'Male',
    chiefComplaint: 'Persistent cough and fever',
    medicalHistory: ['Hypertension (controlled)', 'Type 2 Diabetes', 'Smoking history'],
    medications: ['Lisinopril 10mg', 'Metformin 500mg'],
    vitals: {
      bloodPressure: '140/90',
      heartRate: 92,
      temperature: 38.5,
      oxygenSaturation: 95
    }
  };

  // Mock CDS recommendations
  const [recommendations] = useState<CDSRecommendation[]>([
    {
      id: '1',
      type: 'diagnosis',
      title: 'Community-Acquired Pneumonia (CAP)',
      description:
        'Clinical presentation consistent with CAP. Patient presents with fever, cough, and respiratory symptoms. Smoking history and diabetes are risk factors.',
      confidence: 78,
      evidenceLevel: 'high',
      references: ['IDSA CAP Guidelines 2019', 'Infectious Diseases Society of America'],
      actionableItems: [
        'Order chest X-ray to confirm diagnosis',
        'Perform sputum culture and blood cultures',
        'Check CBC and metabolic panel'
      ],
      riskFactors: [
        'Age > 40 years',
        'Smoking history',
        'Diabetes mellitus',
        'Elevated temperature'
      ],
      createdAt: '2024-01-15T10:30:00',
      reviewed: false
    },
    {
      id: '2',
      type: 'treatment',
      title: 'Antibiotic Therapy - First Line',
      description:
        'For outpatient CAP without comorbidities: Amoxicillin-clavulanate or Fluoroquinolone. Given comorbidities, recommend fluoroquinolone.',
      confidence: 85,
      evidenceLevel: 'high',
      references: [
        'IDSA CAP Guidelines 2019',
        'American Thoracic Society Guidelines'
      ],
      actionableItems: [
        'Prescribe Levofloxacin 750mg daily for 5 days',
        'Alternative: Azithromycin if fluoroquinolone contraindicated',
        'Advise adequate hydration and rest',
        'Set follow-up in 3-5 days'
      ],
      riskFactors: [
        'Drug interactions with current medications',
        'Renal function consideration'
      ],
      createdAt: '2024-01-15T10:35:00',
      reviewed: false
    },
    {
      id: '3',
      type: 'monitoring',
      title: 'Clinical Monitoring Protocol',
      description:
        'Close monitoring recommended given risk factors. Patient should show improvement within 48-72 hours of antibiotic initiation.',
      confidence: 88,
      evidenceLevel: 'high',
      references: ['Clinical Practice Guidelines'],
      actionableItems: [
        'Monitor body temperature daily',
        'Assess symptom improvement at 48-72 hours',
        'Monitor for treatment failure or complications',
        'Watch for signs of sepsis or respiratory distress'
      ],
      riskFactors: [
        'Diabetes may mask symptoms',
        'Age-related complications possible',
        'Consider ICU admission if worsening'
      ],
      createdAt: '2024-01-15T10:40:00',
      reviewed: false
    },
    {
      id: '4',
      type: 'prevention',
      title: 'Prevention Strategies',
      description:
        'Long-term measures to prevent recurrent respiratory infections and manage chronic conditions.',
      confidence: 92,
      evidenceLevel: 'high',
      references: [
        'WHO Guidelines',
        'Public Health Recommendations'
      ],
      actionableItems: [
        'Recommend annual influenza vaccination',
        'Consider pneumococcal vaccination (PPSV23)',
        'Smoking cessation counseling and support',
        'Optimize diabetes and hypertension management'
      ],
      riskFactors: [
        'Smoking is primary modifiable risk factor',
        'Poor glycemic control increases infection risk'
      ],
      createdAt: '2024-01-15T10:45:00',
      reviewed: false
    },
    {
      id: '5',
      type: 'referral',
      title: 'Pulmonology Consultation',
      description:
        'Consider specialist referral if: no improvement after 48-72 hours, recurrent pneumonia, or severe presentation.',
      confidence: 72,
      evidenceLevel: 'moderate',
      references: ['Specialist Consultation Guidelines'],
      actionableItems: [
        'Refer if treatment failure occurs',
        'Refer for recurrent infections (>2 per year)',
        'Consider for chronic lung complications',
        'Urgent referral if respiratory distress develops'
      ],
      riskFactors: [
        'Diabetes increases complication risk',
        'Age-related factors'
      ],
      createdAt: '2024-01-15T10:50:00',
      reviewed: false
    }
  ]);

  // Filter and sort recommendations
  const filteredRecommendations = recommendations
    .filter(r => filterType === 'all' || r.type === filterType)
    .sort((a, b) => {
      switch (sortType) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'evidence':
          const evidenceOrder = { high: 0, moderate: 1, low: 2 };
          return evidenceOrder[a.evidenceLevel] - evidenceOrder[b.evidenceLevel];
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  const toggleItemExpansion = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleGenerateRecommendations = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // In real implementation, this would call the Gemini API
    }, 2000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return '#10b981';
    if (confidence >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="cds-integration">
      <div className="cds-header">
        <h2>🧠 Clinical Decision Support</h2>
        <p>AI-powered recommendations for evidence-based clinical decision making</p>
      </div>

      <div className="case-summary">
        <div className="case-info">
          <h4>{caseData.patientName}, {caseData.age}y {caseData.gender}</h4>
          <p className="chief-complaint">{caseData.chiefComplaint}</p>
        </div>

        <div className="case-vitals">
          <div className="vital">
            <span className="vital-label">BP</span>
            <span className="vital-value">{caseData.vitals.bloodPressure}</span>
          </div>
          <div className="vital">
            <span className="vital-label">HR</span>
            <span className="vital-value">{caseData.vitals.heartRate}</span>
          </div>
          <div className="vital">
            <span className="vital-label">Temp</span>
            <span className="vital-value">{caseData.vitals.temperature}°C</span>
          </div>
          <div className="vital">
            <span className="vital-label">O₂</span>
            <span className="vital-value">{caseData.vitals.oxygenSaturation}%</span>
          </div>
        </div>

        <button
          className={`btn-generate ${isGenerating ? 'loading' : ''}`}
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳ Generating...' : '🤖 Generate New Recommendations'}
        </button>
      </div>

      <div className="cds-controls">
        <div className="filter-group">
          <label>Filter by Type:</label>
          <div className="filter-buttons">
            {(['all', 'diagnosis', 'treatment', 'monitoring', 'prevention', 'referral'] as FilterType[]).map(type => (
              <button
                key={type}
                className={`filter-btn ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? 'All' : typeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            className="sort-select"
          >
            <option value="confidence">Confidence Score</option>
            <option value="evidence">Evidence Level</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      <div className="recommendations-list">
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map(rec => {
            const isExpanded = expandedItems.has(rec.id);
            const evidenceInfo = evidenceColors[rec.evidenceLevel];

            return (
              <div
                key={rec.id}
                className={`recommendation-card ${rec.reviewed ? 'reviewed' : ''}`}
                onClick={() => toggleItemExpansion(rec.id)}
              >
                <div className="rec-header">
                  <div className="rec-title">
                    <span className="rec-icon">{typeIcons[rec.type]}</span>
                    <div className="rec-info">
                      <h4>{rec.title}</h4>
                      <p className="rec-type">{typeLabels[rec.type]}</p>
                    </div>
                  </div>

                  <div className="rec-badges">
                    <div className="confidence-badge" style={{ borderColor: getConfidenceColor(rec.confidence) }}>
                      <span className="value">{rec.confidence}%</span>
                      <span className="label">Confidence</span>
                    </div>

                    <span
                      className="evidence-badge"
                      style={{
                        backgroundColor: evidenceInfo.bg,
                        color: evidenceInfo.color
                      }}
                    >
                      {evidenceInfo.text}
                    </span>

                    {rec.reviewed && <span className="reviewed-badge">✓ Reviewed</span>}
                  </div>

                  <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                </div>

                {isExpanded && (
                  <div className="rec-content">
                    <div className="rec-section">
                      <p className="description">{rec.description}</p>
                    </div>

                    {rec.actionableItems.length > 0 && (
                      <div className="rec-section">
                        <h5>Recommended Actions</h5>
                        <ul className="action-items">
                          {rec.actionableItems.map((item, idx) => (
                            <li key={idx}>
                              <input type="checkbox" className="action-checkbox" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.riskFactors.length > 0 && (
                      <div className="rec-section">
                        <h5>Risk Factors</h5>
                        <div className="risk-factors">
                          {rec.riskFactors.map((factor, idx) => (
                            <span key={idx} className="risk-factor">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {rec.references.length > 0 && (
                      <div className="rec-section">
                        <h5>Evidence Sources</h5>
                        <div className="references">
                          {rec.references.map((ref, idx) => (
                            <div key={idx} className="reference">
                              📚 {ref}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rec-actions">
                      <button className="btn-accept">
                        ✓ Accept & Apply
                      </button>
                      <button className="btn-review">
                        📝 Add Notes
                      </button>
                      <button className="btn-decline">
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No recommendations match your filter</p>
          </div>
        )}
      </div>

      <div className="cds-summary">
        <div className="summary-stat">
          <span className="stat-label">Total Recommendations</span>
          <span className="stat-value">{recommendations.length}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">High Evidence</span>
          <span className="stat-value">
            {recommendations.filter(r => r.evidenceLevel === 'high').length}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Avg Confidence</span>
          <span className="stat-value">
            {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Reviewed</span>
          <span className="stat-value">
            {recommendations.filter(r => r.reviewed).length}/{recommendations.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CDSIntegration;
