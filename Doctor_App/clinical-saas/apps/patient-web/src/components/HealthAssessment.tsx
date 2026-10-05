/**
 * Health Assessment Component
 * Comprehensive health questionnaires with scoring and recommendations
 * Supports multiple assessment types: general, chronic disease, lifestyle, mental health, nutrition, exercise
 */

import React, { useState } from 'react';
import '../styles/HealthAssessment.css';

type AssessmentType = 'general' | 'chronic-disease' | 'lifestyle' | 'mental-health' | 'nutrition' | 'exercise';

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple-choice' | 'yes-no' | 'text';
  category: string;
  options?: string[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
  description?: string;
}

interface AssessmentResult {
  score: number;
  interpretation: string;
  recommendations: string[];
  category: AssessmentType;
}

const assessmentQuestions: Record<AssessmentType, AssessmentQuestion[]> = {
  'general': [
    {
      id: 'general-1',
      question: 'How would you rate your overall health?',
      type: 'scale',
      category: 'health-status',
      scale: { min: 1, max: 5, minLabel: 'Poor', maxLabel: 'Excellent' }
    },
    {
      id: 'general-2',
      question: 'Do you have any chronic conditions?',
      type: 'yes-no',
      category: 'health-status'
    },
    {
      id: 'general-3',
      question: 'How many days in the past month did illness keep you from work or activities?',
      type: 'scale',
      category: 'functionality',
      scale: { min: 0, max: 30, minLabel: 'None', maxLabel: 'All month' }
    },
    {
      id: 'general-4',
      question: 'How often do you visit your doctor for preventive care?',
      type: 'multiple-choice',
      category: 'preventive-care',
      options: ['Annually', 'Every 2 years', 'Occasionally', 'Only when sick', 'Never']
    },
    {
      id: 'general-5',
      question: 'When was your last health checkup?',
      type: 'multiple-choice',
      category: 'preventive-care',
      options: ['Within 6 months', 'Within 1 year', 'Within 2 years', 'More than 2 years', "Can't remember"]
    }
  ],
  'chronic-disease': [
    {
      id: 'chronic-1',
      question: 'Which chronic condition(s) do you have?',
      type: 'multiple-choice',
      category: 'diagnosis',
      options: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'COPD', 'Arthritis', 'Thyroid', 'Other', 'None'],
      description: 'Select all that apply'
    },
    {
      id: 'chronic-2',
      question: 'How long have you had this condition?',
      type: 'multiple-choice',
      category: 'duration',
      options: ['Less than 1 year', '1-2 years', '2-5 years', '5-10 years', 'More than 10 years']
    },
    {
      id: 'chronic-3',
      question: 'How well is your condition controlled?',
      type: 'scale',
      category: 'control',
      scale: { min: 1, max: 5, minLabel: 'Very Poorly', maxLabel: 'Very Well' }
    },
    {
      id: 'chronic-4',
      question: 'How many medications do you take regularly?',
      type: 'scale',
      category: 'medications',
      scale: { min: 0, max: 10, minLabel: 'None', maxLabel: '10+' }
    },
    {
      id: 'chronic-5',
      question: 'How often do you monitor your condition?',
      type: 'multiple-choice',
      category: 'monitoring',
      options: ['Daily', 'Weekly', 'Monthly', 'Occasionally', 'Never']
    }
  ],
  'lifestyle': [
    {
      id: 'lifestyle-1',
      question: 'How many hours of sleep do you get per night?',
      type: 'scale',
      category: 'sleep',
      scale: { min: 0, max: 12, minLabel: 'None', maxLabel: '12+ hours' }
    },
    {
      id: 'lifestyle-2',
      question: 'How would you describe your stress level?',
      type: 'scale',
      category: 'stress',
      scale: { min: 1, max: 5, minLabel: 'Very Low', maxLabel: 'Very High' }
    },
    {
      id: 'lifestyle-3',
      question: 'How often do you exercise?',
      type: 'multiple-choice',
      category: 'exercise',
      options: ['Daily', '3-5 times per week', '1-2 times per week', 'Occasionally', 'Never']
    },
    {
      id: 'lifestyle-4',
      question: 'Do you smoke or use tobacco?',
      type: 'yes-no',
      category: 'tobacco'
    },
    {
      id: 'lifestyle-5',
      question: 'How many alcoholic drinks do you consume per week?',
      type: 'scale',
      category: 'alcohol',
      scale: { min: 0, max: 21, minLabel: 'None', maxLabel: '21+' }
    }
  ],
  'mental-health': [
    {
      id: 'mental-1',
      question: 'How often have you felt down, depressed, or hopeless?',
      type: 'multiple-choice',
      category: 'mood',
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    },
    {
      id: 'mental-2',
      question: 'How often have you lost interest in activities you enjoy?',
      type: 'multiple-choice',
      category: 'anhedonia',
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    },
    {
      id: 'mental-3',
      question: 'How anxious do you feel?',
      type: 'scale',
      category: 'anxiety',
      scale: { min: 1, max: 5, minLabel: 'Not Anxious', maxLabel: 'Very Anxious' }
    },
    {
      id: 'mental-4',
      question: 'Have you been diagnosed with a mental health condition?',
      type: 'yes-no',
      category: 'diagnosis'
    },
    {
      id: 'mental-5',
      question: 'How satisfied are you with your current life?',
      type: 'scale',
      category: 'satisfaction',
      scale: { min: 1, max: 5, minLabel: 'Very Unsatisfied', maxLabel: 'Very Satisfied' }
    }
  ],
  'nutrition': [
    {
      id: 'nutrition-1',
      question: 'How many servings of fruits/vegetables do you eat daily?',
      type: 'multiple-choice',
      category: 'produce',
      options: ['0-1 serving', '2-3 servings', '4-5 servings', '6+ servings']
    },
    {
      id: 'nutrition-2',
      question: 'How often do you eat processed or fast foods?',
      type: 'multiple-choice',
      category: 'processed-foods',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Daily']
    },
    {
      id: 'nutrition-3',
      question: 'How much water do you drink daily (cups)?',
      type: 'scale',
      category: 'hydration',
      scale: { min: 0, max: 12, minLabel: 'None', maxLabel: '12+' }
    },
    {
      id: 'nutrition-4',
      question: 'Do you follow any specific diet?',
      type: 'multiple-choice',
      category: 'diet-type',
      options: ['No specific diet', 'Vegetarian', 'Vegan', 'Keto', 'Mediterranean', 'Other']
    },
    {
      id: 'nutrition-5',
      question: 'Have you received professional dietary counseling?',
      type: 'yes-no',
      category: 'counseling'
    }
  ],
  'exercise': [
    {
      id: 'exercise-1',
      question: 'How many minutes of moderate exercise per week?',
      type: 'scale',
      category: 'duration',
      scale: { min: 0, max: 300, minLabel: 'None', maxLabel: '300+' }
    },
    {
      id: 'exercise-2',
      question: 'How would you rate your fitness level?',
      type: 'scale',
      category: 'fitness',
      scale: { min: 1, max: 5, minLabel: 'Very Poor', maxLabel: 'Excellent' }
    },
    {
      id: 'exercise-3',
      question: 'Do you include strength training in your routine?',
      type: 'multiple-choice',
      category: 'strength',
      options: ['Yes, 3+ times/week', 'Yes, 1-2 times/week', 'Occasionally', 'No']
    },
    {
      id: 'exercise-4',
      question: 'Do physical limitations affect your ability to exercise?',
      type: 'yes-no',
      category: 'limitations'
    },
    {
      id: 'exercise-5',
      question: 'When did you last increase exercise intensity?',
      type: 'multiple-choice',
      category: 'progression',
      options: ['Within 1 month', 'Within 3 months', 'Within 6 months', 'More than 6 months', 'Never']
    }
  ]
};

export const HealthAssessment: React.FC = () => {
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const assessmentTypes: Array<{ type: AssessmentType; label: string; icon: string; description: string }> = [
    {
      type: 'general',
      label: 'General Health',
      icon: '🏥',
      description: 'Assess your overall health status'
    },
    {
      type: 'chronic-disease',
      label: 'Chronic Disease',
      icon: '💊',
      description: 'Evaluate management of chronic conditions'
    },
    {
      type: 'lifestyle',
      label: 'Lifestyle',
      icon: '🏃',
      description: 'Review sleep, stress, exercise, and habits'
    },
    {
      type: 'mental-health',
      label: 'Mental Health',
      icon: '🧠',
      description: 'Screen for mood and mental well-being'
    },
    {
      type: 'nutrition',
      label: 'Nutrition',
      icon: '🥗',
      description: 'Evaluate your dietary habits'
    },
    {
      type: 'exercise',
      label: 'Fitness & Exercise',
      icon: '💪',
      description: 'Assess your physical activity level'
    }
  ];

  const startAssessment = (type: AssessmentType) => {
    setSelectedAssessment(type);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
  };

  const currentQuestion = selectedAssessment
    ? assessmentQuestions[selectedAssessment][currentQuestionIndex]
    : null;

  const progress = selectedAssessment
    ? ((currentQuestionIndex + 1) / assessmentQuestions[selectedAssessment].length) * 100
    : 0;

  const handleAnswer = (value: string | number) => {
    if (currentQuestion) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: value
      });
    }
  };

  const handleNext = () => {
    if (!selectedAssessment) return;

    if (currentQuestionIndex < assessmentQuestions[selectedAssessment].length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Complete assessment
      completeAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const completeAssessment = () => {
    if (!selectedAssessment) return;

    const questions = assessmentQuestions[selectedAssessment];
    let score = 0;
    let totalPoints = 0;

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer === undefined) return;

      if (q.type === 'scale' && q.scale) {
        const numAnswer = typeof answer === 'string' ? parseInt(answer) : answer;
        const maxScale = q.scale.max;
        score += (numAnswer / maxScale) * 100;
        totalPoints += 100;
      } else if (q.type === 'yes-no') {
        // "No" to risk factors = higher score
        const isNo = String(answer).toLowerCase() === 'no';
        score += isNo ? 100 : 0;
        totalPoints += 100;
      } else if (q.type === 'multiple-choice') {
        const choiceScore = getHealthyChoiceScore(q.id, String(answer));
        score += choiceScore;
        totalPoints += 100;
      }
    });

    const finalScore = totalPoints > 0 ? Math.round(score / (totalPoints / 100)) : 0;

    const result: AssessmentResult = {
      score: finalScore,
      interpretation: interpretScore(selectedAssessment, finalScore),
      recommendations: generateRecommendations(selectedAssessment, finalScore),
      category: selectedAssessment
    };

    setResult(result);
  };

  const getHealthyChoiceScore = (questionId: string, answer: string): number => {
    const healthyChoices: Record<string, Record<string, number>> = {
      'general-4': {
        'Annually': 100,
        'Every 2 years': 80,
        'Occasionally': 50,
        'Only when sick': 20,
        'Never': 0
      },
      'general-5': {
        'Within 6 months': 100,
        'Within 1 year': 80,
        'Within 2 years': 40,
        'More than 2 years': 20,
        "Can't remember": 10
      },
      'lifestyle-3': {
        'Daily': 100,
        '3-5 times per week': 90,
        '1-2 times per week': 70,
        'Occasionally': 40,
        'Never': 10
      },
      'nutrition-1': {
        '6+ servings': 100,
        '4-5 servings': 90,
        '2-3 servings': 70,
        '0-1 serving': 30
      },
      'nutrition-2': {
        'Never': 100,
        'Rarely': 80,
        'Sometimes': 60,
        'Often': 30,
        'Daily': 10
      }
    };

    return healthyChoices[questionId]?.[answer] ?? 50;
  };

  const interpretScore = (type: AssessmentType, score: number): string => {
    if (score >= 80) {
      return 'Excellent! You are maintaining great health habits.';
    } else if (score >= 60) {
      return 'Good! You are doing well, but there is room for improvement.';
    } else if (score >= 40) {
      return 'Fair. Consider making some lifestyle changes.';
    } else {
      return 'Poor. We recommend consulting with a healthcare provider.';
    }
  };

  const generateRecommendations = (type: AssessmentType, score: number): string[] => {
    const recommendations: Record<AssessmentType, string[]> = {
      'general': [
        'Schedule a comprehensive health checkup if you haven\'t had one recently',
        'Get recommended vaccinations',
        'Monitor your vital signs regularly',
        'Maintain a healthy lifestyle'
      ],
      'chronic-disease': [
        'Ensure medication adherence',
        'Monitor your condition regularly',
        'Keep all medical appointments',
        'Work with your healthcare team on treatment goals'
      ],
      'lifestyle': [
        'Aim for 7-9 hours of sleep daily',
        'Practice stress management techniques',
        'Exercise at least 150 minutes per week',
        'Avoid tobacco and limit alcohol'
      ],
      'mental-health': [
        'Consider speaking with a mental health professional',
        'Practice mindfulness and meditation',
        'Maintain social connections',
        'Seek support when needed'
      ],
      'nutrition': [
        'Increase intake of fruits and vegetables',
        'Reduce processed food consumption',
        'Stay well hydrated',
        'Consider consulting a nutritionist'
      ],
      'exercise': [
        'Increase aerobic activity',
        'Include strength training',
        'Start gradually and increase intensity',
        'Find activities you enjoy'
      ]
    };

    let recs = recommendations[type];
    if (score < 60) {
      recs = [
        ...recs,
        'Set specific, achievable health goals',
        'Track your progress regularly'
      ];
    }

    return recs.slice(0, 5);
  };

  if (result) {
    return (
      <div className="health-assessment-container">
        <div className="assessment-content">
          <div className="result-container">
            <div className="score-display">
              <div className="score-circle">
                <svg className="score-svg" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="score-bg" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="score-fill"
                    style={{
                      strokeDashoffset: 283 - (result.score / 100) * 283
                    }}
                  />
                </svg>
                <div className="score-text">
                  <span className="score-value">{result.score}</span>
                  <span className="score-label">/ 100</span>
                </div>
              </div>

              <div className="result-interpretation">
                <h2>{assessmentTypes.find((t) => t.type === result.category)?.label} Score</h2>
                <p className="interpretation">{result.interpretation}</p>
              </div>
            </div>

            <div className="recommendations-container">
              <h3>Recommendations</h3>
              <ul className="recommendations-list">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx}>
                    <span className="rec-number">{idx + 1}</span>
                    <span className="rec-text">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="btn-primary" onClick={() => setResult(null)}>
              Take Another Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedAssessment) {
    return (
      <div className="health-assessment-container">
        <div className="assessment-content">
          <div className="selection-container">
            <h1>Health Assessments</h1>
            <p className="subtitle">Choose an assessment to evaluate your health</p>

            <div className="assessment-grid">
              {assessmentTypes.map((assessment) => (
                <button
                  key={assessment.type}
                  className="assessment-card"
                  onClick={() => startAssessment(assessment.type)}
                >
                  <div className="card-icon">{assessment.icon}</div>
                  <h3>{assessment.label}</h3>
                  <p>{assessment.description}</p>
                  <div className="card-arrow">→</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="health-assessment-container">
      <div className="assessment-content">
        <div className="quiz-container">
          <div className="quiz-header">
            <button className="btn-back" onClick={() => setSelectedAssessment(null)}>
              ← Back
            </button>
            <h2>{assessmentTypes.find((t) => t.type === selectedAssessment)?.label} Assessment</h2>
            <div className="progress-info">
              {currentQuestionIndex + 1} / {selectedAssessment ? assessmentQuestions[selectedAssessment].length : 0}
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {currentQuestion && (
            <div className="question-container">
              <h3 className="question-text">{currentQuestion.question}</h3>
              {currentQuestion.description && (
                <p className="question-description">{currentQuestion.description}</p>
              )}

              <div className="answer-options">
                {currentQuestion.type === 'scale' && currentQuestion.scale && (
                  <div className="scale-container">
                    <div className="scale-labels">
                      <span>{currentQuestion.scale.minLabel}</span>
                      <span>{currentQuestion.scale.maxLabel}</span>
                    </div>
                    <div className="scale-buttons">
                      {Array.from(
                        { length: currentQuestion.scale.max - currentQuestion.scale.min + 1 },
                        (_, i) => currentQuestion.scale.min + i
                      ).map((value) => (
                        <button
                          key={value}
                          className={`scale-btn ${answers[currentQuestion.id] === value ? 'selected' : ''}`}
                          onClick={() => handleAnswer(value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'yes-no' && (
                  <div className="yes-no-options">
                    {['Yes', 'No'].map((option) => (
                      <button
                        key={option}
                        className={`yes-no-btn ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                        onClick={() => handleAnswer(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                  <div className="multiple-choice-options">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option}
                        className={`choice-btn ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                        onClick={() => handleAnswer(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'text' && (
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Enter your answer..."
                    value={String(answers[currentQuestion.id] || '')}
                    onChange={(e) => handleAnswer(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          <div className="quiz-actions">
            <button
              className="btn-secondary"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!answers[currentQuestion?.id || '']}
            >
              {currentQuestionIndex === (selectedAssessment ? assessmentQuestions[selectedAssessment].length - 1 : 0)
                ? 'Complete'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthAssessment;
