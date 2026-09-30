/**
 * Symptom Checker Component
 * Interactive symptom checking with AI analysis
 * Beautiful UI with step-by-step symptom selection and recommendations
 */

import React, { useState, useRef, useEffect } from 'react';
import '../styles/SymptomChecker.css';

interface Symptom {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

interface SymptomCheckerResult {
  possibleConditions: Array<{
    name: string;
    confidence: number;
    description: string;
    whenToSeekHelp: string;
    selfCareSteps: string[];
  }>;
  urgencyLevel: 'low' | 'moderate' | 'high' | 'emergency';
  recommendations: string[];
  suggestedSpecialists: string[];
  estimatedCareLevel: 'self-care' | 'primary-care' | 'urgent-care' | 'emergency';
}

const commonSymptoms: Symptom[] = [
  // Respiratory
  {
    id: 'cough',
    name: 'Cough',
    description: 'Persistent or recurring cough',
    category: 'respiratory',
    icon: '🫁'
  },
  {
    id: 'sore-throat',
    name: 'Sore Throat',
    description: 'Pain or discomfort in throat',
    category: 'respiratory',
    icon: '🤕'
  },
  {
    id: 'congestion',
    name: 'Nasal Congestion',
    description: 'Blocked or runny nose',
    category: 'respiratory',
    icon: '👃'
  },
  {
    id: 'shortness-breath',
    name: 'Shortness of Breath',
    description: 'Difficulty breathing or catching breath',
    category: 'respiratory',
    icon: '😤'
  },

  // Digestive
  {
    id: 'nausea',
    name: 'Nausea',
    description: 'Feeling sick to stomach',
    category: 'digestive',
    icon: '🤢'
  },
  {
    id: 'stomach-pain',
    name: 'Abdominal Pain',
    description: 'Pain or cramps in stomach area',
    category: 'digestive',
    icon: '🫂'
  },
  {
    id: 'diarrhea',
    name: 'Diarrhea',
    description: 'Loose or frequent stools',
    category: 'digestive',
    icon: '🚽'
  },
  {
    id: 'constipation',
    name: 'Constipation',
    description: 'Difficulty passing stools',
    category: 'digestive',
    icon: '🔄'
  },

  // Neurological
  {
    id: 'headache',
    name: 'Headache',
    description: 'Pain in head or scalp',
    category: 'neurological',
    icon: '🤕'
  },
  {
    id: 'dizziness',
    name: 'Dizziness',
    description: 'Feeling lightheaded or spinning',
    category: 'neurological',
    icon: '🌀'
  },
  {
    id: 'fatigue',
    name: 'Fatigue',
    description: 'Extreme tiredness or exhaustion',
    category: 'neurological',
    icon: '😴'
  },
  {
    id: 'brain-fog',
    name: 'Brain Fog',
    description: 'Difficulty concentrating or thinking clearly',
    category: 'neurological',
    icon: '🧠'
  },

  // Cardiovascular
  {
    id: 'chest-pain',
    name: 'Chest Pain',
    description: 'Discomfort or pain in chest',
    category: 'cardiovascular',
    icon: '💔'
  },
  {
    id: 'palpitations',
    name: 'Heart Palpitations',
    description: 'Feeling heart racing or fluttering',
    category: 'cardiovascular',
    icon: '💗'
  },
  {
    id: 'high-bp',
    name: 'High Blood Pressure',
    description: 'Elevated blood pressure readings',
    category: 'cardiovascular',
    icon: '📈'
  },

  // Musculoskeletal
  {
    id: 'joint-pain',
    name: 'Joint Pain',
    description: 'Pain in joints or arthralgias',
    category: 'musculoskeletal',
    icon: '🦴'
  },
  {
    id: 'muscle-ache',
    name: 'Muscle Aches',
    description: 'Soreness or pain in muscles',
    category: 'musculoskeletal',
    icon: '💪'
  },
  {
    id: 'back-pain',
    name: 'Back Pain',
    description: 'Pain in upper, middle, or lower back',
    category: 'musculoskeletal',
    icon: '🔙'
  },

  // Dermatological
  {
    id: 'rash',
    name: 'Skin Rash',
    description: 'Red, itchy, or irritated skin',
    category: 'dermatological',
    icon: '🔴'
  },
  {
    id: 'itching',
    name: 'Itching',
    description: 'Persistent itching sensation',
    category: 'dermatological',
    icon: '🤔'
  },
  {
    id: 'acne',
    name: 'Acne',
    description: 'Pimples or other skin blemishes',
    category: 'dermatological',
    icon: '⚪'
  },

  // General
  {
    id: 'fever',
    name: 'Fever',
    description: 'Elevated body temperature',
    category: 'general',
    icon: '🌡️'
  },
  {
    id: 'chills',
    name: 'Chills',
    description: 'Feeling cold or shaking',
    category: 'general',
    icon: '❄️'
  },
  {
    id: 'sweating',
    name: 'Sweating',
    description: 'Excessive perspiration',
    category: 'general',
    icon: '💦'
  }
];

const categoryIcons: Record<string, string> = {
  respiratory: '🫁',
  digestive: '🍽️',
  neurological: '🧠',
  cardiovascular: '❤️',
  musculoskeletal: '🦴',
  dermatological: '🩹',
  general: '⚕️'
};

export const SymptomChecker: React.FC = () => {
  const [step, setStep] = useState<'select' | 'duration' | 'severity' | 'analysis'>('select');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [symptomDetails, setSymptomsDetails] = useState<
    Record<string, { duration: string; severity: 'mild' | 'moderate' | 'severe' }>
  >({});
  const [analysisResult, setAnalysisResult] = useState<SymptomCheckerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMedicineRecommendation, setShowMedicineRecommendation] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState('');
  const analyzeTimeoutRef = useRef<NodeJS.Timeout>();

  const toggleSymptom = (symptom: Symptom) => {
    const isSelected = selectedSymptoms.find((s) => s.id === symptom.id);

    if (isSelected) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s.id !== symptom.id));
      const newDetails = { ...symptomDetails };
      delete newDetails[symptom.id];
      setSymptomsDetails(newDetails);
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      setSymptomsDetails({
        ...symptomDetails,
        [symptom.id]: { duration: '1-3 days', severity: 'moderate' }
      });
    }
  };

  const handleSymptomDetailChange = (
    symptomId: string,
    field: 'duration' | 'severity',
    value: string
  ) => {
    setSymptomsDetails({
      ...symptomDetails,
      [symptomId]: {
        ...symptomDetails[symptomId],
        [field]: value
      }
    });
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom');
      return;
    }

    setStep('analysis');
    setIsLoading(true);

    // Simulate AI analysis with slight delay
    analyzeTimeoutRef.current = setTimeout(() => {
      const mockResult: SymptomCheckerResult = {
        possibleConditions: [
          {
            name: 'Common Cold',
            confidence: 75,
            description:
              'A viral infection affecting the upper respiratory tract, commonly caused by rhinoviruses.',
            whenToSeekHelp:
              'Seek medical attention if symptoms persist beyond 10 days or worsen significantly.',
            selfCareSteps: [
              'Stay hydrated with water, tea, and warm soups',
              'Get adequate rest',
              'Use saline nasal drops',
              'Gargle with salt water for sore throat'
            ]
          },
          {
            name: 'Influenza (Flu)',
            confidence: 45,
            description:
              'A more severe viral infection that typically affects the respiratory system and may include body aches.',
            whenToSeekHelp: 'Contact your doctor immediately if you have difficulty breathing or chest pain.',
            selfCareSteps: [
              'Rest completely',
              'Stay hydrated',
              'Take over-the-counter pain relievers',
              'Use a humidifier'
            ]
          },
          {
            name: 'Allergic Rhinitis',
            confidence: 35,
            description: 'An allergic reaction causing inflammation of the nasal passages.',
            whenToSeekHelp: 'See a doctor if symptoms interfere with daily activities or persist.',
            selfCareSteps: [
              'Identify and avoid triggers',
              'Use antihistamines',
              'Keep windows closed during high pollen days',
              'Rinse nasal passages'
            ]
          }
        ],
        urgencyLevel: 'low',
        recommendations: [
          'Rest and allow your body to recover',
          'Maintain good hygiene to prevent spread',
          'Monitor your symptoms closely',
          'Contact a healthcare provider if symptoms worsen'
        ],
        suggestedSpecialists: ['Primary Care Physician', 'ENT Specialist'],
        estimatedCareLevel: 'self-care'
      };

      setAnalysisResult(mockResult);
      setIsLoading(false);
    }, 2000);
  };

  const handleReset = () => {
    setStep('select');
    setSelectedSymptoms([]);
    setSymptomsDetails({});
    setAnalysisResult(null);
    setMedicalHistory('');
  };

  const urgencyColors: Record<string, string> = {
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#ef4444',
    emergency: '#dc2626'
  };

  const groupedSymptoms = commonSymptoms.reduce(
    (acc, symptom) => {
      if (!acc[symptom.category]) {
        acc[symptom.category] = [];
      }
      acc[symptom.category].push(symptom);
      return acc;
    },
    {} as Record<string, Symptom[]>
  );

  if (step === 'analysis' && analysisResult) {
    return (
      <div className="symptom-checker-container">
        <div className="analysis-result">
          <div className="result-header">
            <h2>Symptom Analysis Results</h2>
            <p className="disclaimer">
              ⚠️ This is for educational purposes only. Always consult a healthcare professional for diagnosis.
            </p>
          </div>

          <div className="urgency-indicator" style={{ borderLeftColor: urgencyColors[analysisResult.urgencyLevel] }}>
            <div className="urgency-label">Urgency Level</div>
            <div className="urgency-value" style={{ color: urgencyColors[analysisResult.urgencyLevel] }}>
              {analysisResult.urgencyLevel.toUpperCase()}
            </div>
            <div className="care-level">
              Care Level: <strong>{analysisResult.estimatedCareLevel.replace('-', ' ')}</strong>
            </div>
          </div>

          <div className="conditions-section">
            <h3>Possible Conditions</h3>
            {analysisResult.possibleConditions.map((condition, idx) => (
              <div key={idx} className="condition-card">
                <div className="condition-header">
                  <h4>{condition.name}</h4>
                  <div className="confidence-badge" style={{ width: `${condition.confidence}%` }}>
                    {condition.confidence}% Match
                  </div>
                </div>

                <p className="condition-description">{condition.description}</p>

                <div className="condition-section">
                  <h5>When to Seek Help:</h5>
                  <p>{condition.whenToSeekHelp}</p>
                </div>

                <div className="condition-section">
                  <h5>Self-Care Steps:</h5>
                  <ul className="steps-list">
                    {condition.selfCareSteps.map((step, i) => (
                      <li key={i}>
                        <span className="step-icon">✓</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="recommendations-section">
            <h3>General Recommendations</h3>
            <ul className="recommendations-list">
              {analysisResult.recommendations.map((rec, idx) => (
                <li key={idx}>
                  <span className="rec-icon">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {analysisResult.suggestedSpecialists.length > 0 && (
            <div className="specialists-section">
              <h3>Suggested Specialists</h3>
              <div className="specialists-grid">
                {analysisResult.suggestedSpecialists.map((specialist, idx) => (
                  <div key={idx} className="specialist-badge">
                    {specialist}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn-primary" onClick={handleReset}>
            Check Another Symptom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="symptom-checker-container">
      <div className="checker-content">
        <div className="checker-header">
          <h2>🔍 Symptom Checker</h2>
          <p>Select your symptoms to get an AI-powered health assessment</p>
        </div>

        {/* Medical History Optional Input */}
        {step === 'select' && (
          <div className="medical-history-section">
            <label>Optional: Medical History or Allergies</label>
            <textarea
              placeholder="E.g., Diabetes, Hypertension, Penicillin allergy..."
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* Symptom Selection */}
        {(step === 'select' || step === 'duration') && (
          <div className="symptoms-grid-wrapper">
            {Object.entries(groupedSymptoms).map(([category, symptoms]) => (
              <div key={category} className="category-section">
                <h3 className="category-title">
                  {categoryIcons[category]} {category.replace('-', ' ').toUpperCase()}
                </h3>
                <div className="symptoms-grid">
                  {symptoms.map((symptom) => {
                    const isSelected = selectedSymptoms.find((s) => s.id === symptom.id);
                    return (
                      <button
                        key={symptom.id}
                        className={`symptom-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleSymptom(symptom)}
                      >
                        <span className="symptom-icon">{symptom.icon}</span>
                        <span className="symptom-name">{symptom.name}</span>
                        <span className="symptom-desc">{symptom.description}</span>
                        {isSelected && <span className="checkmark">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Duration and Severity Details */}
        {step === 'duration' && selectedSymptoms.length > 0 && (
          <div className="details-section">
            <h3>Tell us more about your symptoms</h3>
            <div className="details-grid">
              {selectedSymptoms.map((symptom) => (
                <div key={symptom.id} className="detail-card">
                  <h4>
                    {symptom.icon} {symptom.name}
                  </h4>

                  <div className="form-group">
                    <label>How long have you had this symptom?</label>
                    <select
                      value={symptomDetails[symptom.id]?.duration || '1-3 days'}
                      onChange={(e) => handleSymptomDetailChange(symptom.id, 'duration', e.target.value)}
                    >
                      <option value="less-than-24h">Less than 24 hours</option>
                      <option value="1-3 days">1-3 days</option>
                      <option value="4-7 days">4-7 days</option>
                      <option value="1-2 weeks">1-2 weeks</option>
                      <option value="more-than-2-weeks">More than 2 weeks</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Severity?</label>
                    <div className="severity-buttons">
                      {(['mild', 'moderate', 'severe'] as const).map((level) => (
                        <button
                          key={level}
                          className={`severity-btn ${
                            symptomDetails[symptom.id]?.severity === level ? 'active' : ''
                          }`}
                          onClick={() => handleSymptomDetailChange(symptom.id, 'severity', level)}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="checker-actions">
          {step === 'select' && selectedSymptoms.length > 0 && (
            <button className="btn-primary" onClick={() => setStep('duration')}>
              Continue ({selectedSymptoms.length} selected)
            </button>
          )}

          {step === 'duration' && selectedSymptoms.length > 0 && (
            <>
              <button className="btn-secondary" onClick={() => setStep('select')}>
                Back
              </button>
              <button className="btn-primary" onClick={handleAnalyze} disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
              </button>
            </>
          )}
        </div>

        {step === 'select' && selectedSymptoms.length === 0 && (
          <div className="empty-state">
            <p>👈 Select one or more symptoms to get started</p>
          </div>
        )}

        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing your symptoms with AI...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;
