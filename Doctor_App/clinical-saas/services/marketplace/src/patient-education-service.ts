/**
 * Patient Education & Self-Assessment Service
 * Provides symptom checking, health assessments, and educational content
 * Integrates with Gemini AI for intelligent recommendations
 * 
 * Features:
 * - Symptom checker with AI analysis
 * - Health self-assessment questionnaires
 * - Personalized health education
 * - Risk assessment and recommendations
 * - Learning progress tracking
 * - Wellness tips and preventive care advice
 */

import { GeminiMedicalClient } from './gemini-integration';

export interface Symptom {
  id: string;
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string; // e.g., "2 days", "1 week"
  category: 'respiratory' | 'digestive' | 'musculoskeletal' | 'neurological' | 'cardiovascular' | 'dermatological' | 'other';
}

export interface SymptomCheckerResult {
  id: string;
  patientId: string;
  symptoms: Symptom[];
  possibleConditions: PossibleCondition[];
  urgencyLevel: 'low' | 'moderate' | 'high' | 'emergency';
  recommendations: string[];
  suggestedSpecialists: string[];
  estimatedCareLevel: 'self-care' | 'primary-care' | 'urgent-care' | 'emergency';
  createdAt: Date;
}

export interface PossibleCondition {
  name: string;
  confidence: number; // 0-100
  description: string;
  commonSymptoms: string[];
  whenToSeekHelp: string;
  selfCareSteps: string[];
}

export interface HealthAssessment {
  id: string;
  patientId: string;
  type: 'general' | 'chronic-disease' | 'lifestyle' | 'mental-health' | 'nutrition' | 'exercise';
  questions: AssessmentQuestion[];
  responses: Map<string, string>;
  score: number;
  interpretation: string;
  recommendations: string[];
  completedAt: Date;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'scale' | 'text' | 'yes-no';
  options?: string[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
  category: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  duration: number; // in minutes
  tags: string[];
  views: number;
  rating: number;
}

export interface WellnessRecommendation {
  id: string;
  patientId: string;
  type: 'nutrition' | 'exercise' | 'lifestyle' | 'preventive-care' | 'mental-health';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  timeframe: string;
  actionSteps: string[];
  expectedBenefit: string;
}

export interface RiskAssessment {
  id: string;
  patientId: string;
  riskFactors: RiskFactor[];
  overallRiskScore: number;
  healthGoals: string[];
  preventiveMeasures: string[];
  followUpDate: Date;
}

export interface RiskFactor {
  name: string;
  score: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  interventions: string[];
}

export class PatientEducationService {
  private geminiClient: GeminiMedicalClient;

  constructor(apiKey: string) {
    this.geminiClient = new GeminiMedicalClient(apiKey);
  }

  /**
   * Perform symptom checking analysis
   */
  async checkSymptoms(
    patientId: string,
    symptoms: Symptom[],
    medicalHistory?: string
  ): Promise<SymptomCheckerResult> {
    const promptContext = `
    Patient has reported the following symptoms:
    ${symptoms.map(s => `- ${s.name} (${s.severity}): ${s.description}, Duration: ${s.duration}`).join('\n')}
    
    ${medicalHistory ? `Medical History: ${medicalHistory}` : ''}
    
    Please analyze these symptoms and provide:
    1. List of possible conditions (with confidence scores)
    2. Overall urgency level (low/moderate/high/emergency)
    3. When to seek medical help
    4. Self-care recommendations
    5. Suggested medical specialists
    
    IMPORTANT: This is for educational purposes only. Always recommend medical consultation if uncertain.
    `;

    try {
      const analysisText = await this.geminiClient.analyzeReport(
        'text',
        promptContext,
        'symptom_analysis'
      );

      const result = this.parseSymptomAnalysis(analysisText, patientId, symptoms);
      return result;
    } catch (error) {
      console.error('Error checking symptoms:', error);
      throw new Error('Failed to analyze symptoms');
    }
  }

  /**
   * Parse AI response into structured symptom checker result
   */
  private parseSymptomAnalysis(
    analysisText: string,
    patientId: string,
    symptoms: Symptom[]
  ): SymptomCheckerResult {
    // Extract possible conditions from analysis
    const possibleConditions = this.extractConditions(analysisText);

    // Determine urgency level
    const urgencyLevel = this.determineUrgency(analysisText);

    // Extract recommendations
    const recommendations = this.extractRecommendations(analysisText);

    // Extract suggested specialists
    const suggestedSpecialists = this.extractSpecialists(analysisText);

    // Determine care level
    const estimatedCareLevel = this.determineCareLevel(urgencyLevel);

    return {
      id: this.generateId(),
      patientId,
      symptoms,
      possibleConditions,
      urgencyLevel,
      recommendations,
      suggestedSpecialists,
      estimatedCareLevel,
      createdAt: new Date()
    };
  }

  /**
   * Extract possible conditions from AI analysis
   */
  private extractConditions(text: string): PossibleCondition[] {
    // Parse structured data from analysis
    const conditions: PossibleCondition[] = [];

    // Look for patterns like "Condition Name: XX% confidence"
    const conditionPattern = /(\w+(?:\s+\w+)*)\s*:\s*(\d+)%\s*confidence/gi;
    let match;

    while ((match = conditionPattern.exec(text)) !== null) {
      conditions.push({
        name: match[1],
        confidence: parseInt(match[2]),
        description: this.extractDescription(text, match[1]),
        commonSymptoms: this.extractCommonSymptoms(text, match[1]),
        whenToSeekHelp: this.extractWhenToSeekHelp(text, match[1]),
        selfCareSteps: this.extractSelfCareSteps(text, match[1])
      });
    }

    // If no structured patterns found, create generic conditions
    if (conditions.length === 0) {
      conditions.push({
        name: 'General Health Assessment Needed',
        confidence: 60,
        description: 'Consult with a healthcare provider for proper diagnosis',
        commonSymptoms: [],
        whenToSeekHelp: 'As soon as possible if symptoms persist',
        selfCareSteps: ['Rest', 'Stay hydrated', 'Monitor symptoms']
      });
    }

    return conditions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Extract description for a condition
   */
  private extractDescription(text: string, condition: string): string {
    const pattern = new RegExp(`${condition}.*?(?:about:|description:)?\\s*([^.!?]*[.!?])`, 'i');
    const match = text.match(pattern);
    return match ? match[1].trim() : `${condition} is a health condition that requires proper medical evaluation.`;
  }

  /**
   * Extract common symptoms for a condition
   */
  private extractCommonSymptoms(text: string, condition: string): string[] {
    const pattern = new RegExp(`${condition}.*?common symptoms:?\\s*([^.!?]*(?:[,;]\\s*[^.!?]*)*)`, 'i');
    const match = text.match(pattern);

    if (match) {
      return match[1]
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 5);
    }

    return [];
  }

  /**
   * Extract when to seek help guidance
   */
  private extractWhenToSeekHelp(text: string, condition: string): string {
    const pattern = new RegExp(`${condition}.*?when to seek help:?\\s*([^.!?]*[.!?])`, 'i');
    const match = text.match(pattern);
    return match
      ? match[1].trim()
      : 'Seek medical help if symptoms worsen or persist for more than a few days.';
  }

  /**
   * Extract self-care steps
   */
  private extractSelfCareSteps(text: string, condition: string): string[] {
    const pattern = new RegExp(
      `${condition}.*?self-?care steps?:?\\s*([^.!?]*(?:[,;\\n]\\s*[^.!?]*)*)`,
      'i'
    );
    const match = text.match(pattern);

    if (match) {
      return match[1]
        .split(/[,;\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 5);
    }

    return ['Rest', 'Stay hydrated', 'Follow medical advice', 'Monitor symptoms'];
  }

  /**
   * Determine urgency level from analysis
   */
  private determineUrgency(text: string): 'low' | 'moderate' | 'high' | 'emergency' {
    const emergencyPatterns = /emergency|seek immediate care|call ambulance|911|critical/i;
    const highPatterns = /urgent|as soon as possible|without delay|ASAP/i;
    const moderatePatterns = /moderate|soon|within days/i;

    if (emergencyPatterns.test(text)) return 'emergency';
    if (highPatterns.test(text)) return 'high';
    if (moderatePatterns.test(text)) return 'moderate';
    return 'low';
  }

  /**
   * Extract recommendations from analysis
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const recommendationPattern = /(?:recommend|suggestion|advice)s?:?\s*([^\n]+)/gi;
    let match;

    while ((match = recommendationPattern.exec(text)) !== null) {
      recommendations.push(match[1].trim());
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Consult with a healthcare provider for proper diagnosis',
        'Keep track of your symptoms',
        'Maintain a healthy lifestyle'
      );
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Extract suggested specialists
   */
  private extractSpecialists(text: string): string[] {
    const specialists: string[] = [];
    const specialistPattern = /(?:specialist|consult|see a)s?:?\s*([^\n,;.]+)/gi;
    let match;

    while ((match = specialistPattern.exec(text)) !== null) {
      const specialist = match[1].trim();
      if (specialist.length > 2 && specialist.length < 50) {
        specialists.push(specialist);
      }
    }

    return specialists.slice(0, 3);
  }

  /**
   * Determine care level based on urgency
   */
  private determineCareLevel(urgency: string): 'self-care' | 'primary-care' | 'urgent-care' | 'emergency' {
    switch (urgency) {
      case 'emergency':
        return 'emergency';
      case 'high':
        return 'urgent-care';
      case 'moderate':
        return 'primary-care';
      default:
        return 'self-care';
    }
  }

  /**
   * Get predefined health assessment questionnaire
   */
  async getHealthAssessment(type: HealthAssessment['type']): Promise<HealthAssessment> {
    const questions = this.getAssessmentQuestions(type);

    return {
      id: this.generateId(),
      patientId: '',
      type,
      questions,
      responses: new Map(),
      score: 0,
      interpretation: '',
      recommendations: [],
      completedAt: new Date()
    };
  }

  /**
   * Get assessment questions based on type
   */
  private getAssessmentQuestions(type: HealthAssessment['type']): AssessmentQuestion[] {
    const questionsMap: Record<HealthAssessment['type'], AssessmentQuestion[]> = {
      'general': this.getGeneralHealthQuestions(),
      'chronic-disease': this.getChronicDiseaseQuestions(),
      'lifestyle': this.getLifestyleQuestions(),
      'mental-health': this.getMentalHealthQuestions(),
      'nutrition': this.getNutritionQuestions(),
      'exercise': this.getExerciseQuestions()
    };

    return questionsMap[type];
  }

  private getGeneralHealthQuestions(): AssessmentQuestion[] {
    return [
      {
        id: 'general-1',
        question: 'How would you rate your overall health?',
        type: 'scale',
        category: 'general',
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Poor',
          maxLabel: 'Excellent'
        }
      },
      {
        id: 'general-2',
        question: 'Do you have any chronic conditions?',
        type: 'yes-no',
        category: 'general'
      },
      {
        id: 'general-3',
        question: 'How many days in the past month did illness keep you from work or normal activities?',
        type: 'scale',
        category: 'general',
        scale: {
          min: 0,
          max: 30,
          minLabel: 'None',
          maxLabel: 'All month'
        }
      },
      {
        id: 'general-4',
        question: 'Do you currently take any medications?',
        type: 'yes-no',
        category: 'general'
      },
      {
        id: 'general-5',
        question: 'When was your last health checkup?',
        type: 'multiple-choice',
        category: 'general',
        options: ['Within 6 months', 'Within 1 year', 'Within 2 years', 'More than 2 years ago', "Can't remember"]
      }
    ];
  }

  private getChronicDiseaseQuestions(): AssessmentQuestion[] {
    return [
      {
        id: 'chronic-1',
        question: 'Which chronic condition(s) do you have?',
        type: 'multiple-choice',
        category: 'chronic',
        options: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'COPD', 'Arthritis', 'Other', 'None']
      },
      {
        id: 'chronic-2',
        question: 'How long have you had this condition?',
        type: 'text',
        category: 'chronic'
      },
      {
        id: 'chronic-3',
        question: 'How well is your condition controlled?',
        type: 'scale',
        category: 'chronic',
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Very Poorly',
          maxLabel: 'Excellent'
        }
      },
      {
        id: 'chronic-4',
        question: 'Do you take medications regularly for this condition?',
        type: 'yes-no',
        category: 'chronic'
      },
      {
        id: 'chronic-5',
        question: 'How often do you monitor your condition (e.g., blood pressure, glucose)?',
        type: 'multiple-choice',
        category: 'chronic',
        options: ['Daily', 'Weekly', 'Monthly', 'Occasionally', 'Never']
      }
    ];
  }

  private getLifestyleQuestions(): AssessmentQuestion[] {
    return [
      {
        id: 'lifestyle-1',
        question: 'How many hours of sleep do you get per night?',
        type: 'scale',
        category: 'lifestyle',
        scale: {
          min: 0,
          max: 12,
          minLabel: 'None',
          maxLabel: '12+ hours'
        }
      },
      {
        id: 'lifestyle-2',
        question: 'How would you describe your stress level?',
        type: 'scale',
        category: 'lifestyle',
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Very Low',
          maxLabel: 'Very High'
        }
      },
      {
        id: 'lifestyle-3',
        question: 'Do you exercise regularly?',
        type: 'multiple-choice',
        category: 'lifestyle',
        options: ['Daily', '3-5 times/week', '1-2 times/week', 'Occasionally', 'Never']
      },
      {
        id: 'lifestyle-4',
        question: 'Do you smoke or use tobacco?',
        type: 'yes-no',
        category: 'lifestyle'
      },
      {
        id: 'lifestyle-5',
        question: 'How many alcoholic drinks do you consume per week?',
        type: 'scale',
        category: 'lifestyle',
        scale: {
          min: 0,
          max: 21,
          minLabel: 'None',
          maxLabel: '21+' 
        }
      }
    ];
  }

  private getMentalHealthQuestions(): AssessmentQuestion[] {
    return [
      {
        id: 'mental-1',
        question: 'Over the past 2 weeks, how often have you felt down, depressed, or hopeless?',
        type: 'multiple-choice',
        category: 'mental',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'mental-2',
        question: 'Have you had little interest or pleasure in doing things?',
        type: 'multiple-choice',
        category: 'mental',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
      },
      {
        id: 'mental-3',
        question: 'How anxious do you feel?',
        type: 'scale',
        category: 'mental',
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Not Anxious',
          maxLabel: 'Very Anxious'
        }
      },
      {
        id: 'mental-4',
        question: 'Have you ever been diagnosed with a mental health condition?',
        type: 'yes-no',
        category: 'mental'
      },
      {
        id: 'mental-5',
        question: 'Do you have access to mental health support if needed?',
        type: 'yes-no',
        category: 'mental'
      }
    ];
  }

  private getNutritionQuestions(): AssessmentQuestion[] {
    return [
      {
        id: 'nutrition-1',
        question: 'How many servings of fruits and vegetables do you eat daily?',
        type: 'multiple-choice',
        category: 'nutrition',
        options: ['0-1', '2-3', '4-5', '6+']
      },
      {
        id: 'nutrition-2',
        question: 'How often do you eat processed or fast foods?',
        type: 'multiple-choice',
        category: 'nutrition',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Daily']
      },
      {
        id: 'nutrition-3',
        question: 'How much water do you drink daily (in cups)?',
        type: 'scale',
        category: 'nutrition',
        scale: {
          min: 0,
          max: 12,
          minLabel: 'None',
          maxLabel: '12+' 
        }
      },
      {
        id: 'nutrition-4',
        question: 'Do you follow any specific diet?',
        type: 'multiple-choice',
        category: 'nutrition',
        options: ['No specific diet', 'Vegetarian', 'Vegan', 'Keto', 'Mediterranean', 'Other']
      },
      {
        id: 'nutrition-5',
        question: 'Have you ever received dietary counseling?',
        type: 'yes-no',
        category: 'nutrition'
      }
    ];
  }

  private getExerciseQuestions(): AssessmentQuestion[] {
    return [
      {
        id: 'exercise-1',
        question: 'How many minutes of moderate exercise do you get per week?',
        type: 'scale',
        category: 'exercise',
        scale: {
          min: 0,
          max: 300,
          minLabel: 'None',
          maxLabel: '300+'
        }
      },
      {
        id: 'exercise-2',
        question: 'What types of exercise do you do?',
        type: 'text',
        category: 'exercise'
      },
      {
        id: 'exercise-3',
        question: 'How would you rate your fitness level?',
        type: 'scale',
        category: 'exercise',
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Very Poor',
          maxLabel: 'Excellent'
        }
      },
      {
        id: 'exercise-4',
        question: 'Do you have any physical limitations that affect exercise?',
        type: 'yes-no',
        category: 'exercise'
      },
      {
        id: 'exercise-5',
        question: 'When did you last increase your exercise intensity?',
        type: 'multiple-choice',
        category: 'exercise',
        options: ['Within 1 month', 'Within 3 months', 'Within 6 months', 'More than 6 months', 'Never']
      }
    ];
  }

  /**
   * Score completed assessment
   */
  async scoreAssessment(
    assessment: HealthAssessment
  ): Promise<{ score: number; interpretation: string; recommendations: string[] }> {
    let score = 0;
    let totalQuestions = 0;

    // Calculate score based on responses
    assessment.questions.forEach((question) => {
      const response = assessment.responses.get(question.id);
      if (!response) return;

      totalQuestions++;

      if (question.type === 'scale' && question.scale) {
        const numResponse = parseInt(response);
        const maxScale = question.scale.max;

        // For health metrics, higher is better (normalize to 0-100)
        score += (numResponse / maxScale) * 100;
      } else if (question.type === 'yes-no') {
        // "No" for risk factors = higher score
        score += response.toLowerCase() === 'no' ? 100 : 0;
      } else if (question.type === 'multiple-choice') {
        // Score based on healthier choices
        const healthyScore = this.getHealthyChoiceScore(question.id, response);
        score += healthyScore;
      }
    });

    const finalScore = totalQuestions > 0 ? Math.round(score / totalQuestions) : 0;

    const interpretation = this.interpretScore(assessment.type, finalScore);
    const recommendations = await this.generateRecommendations(assessment.type, finalScore);

    return {
      score: finalScore,
      interpretation,
      recommendations
    };
  }

  /**
   * Get score for healthy choice
   */
  private getHealthyChoiceScore(questionId: string, answer: string): number {
    const healthyChoices: Record<string, Record<string, number>> = {
      'general-5': {
        'Within 6 months': 100,
        'Within 1 year': 80,
        'Within 2 years': 40,
        'More than 2 years ago': 20,
        "Can't remember": 10
      },
      'lifestyle-3': {
        'Daily': 100,
        '3-5 times/week': 90,
        '1-2 times/week': 70,
        'Occasionally': 40,
        'Never': 10
      },
      'nutrition-1': {
        '6+': 100,
        '4-5': 90,
        '2-3': 70,
        '0-1': 30
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
  }

  /**
   * Interpret assessment score
   */
  private interpretScore(type: HealthAssessment['type'], score: number): string {
    if (score >= 80) {
      return 'Excellent health status. Keep up your good habits!';
    } else if (score >= 60) {
      return 'Good health status. Some areas for improvement.';
    } else if (score >= 40) {
      return 'Fair health status. Consider lifestyle improvements.';
    } else {
      return 'Poor health status. Consult with a healthcare provider.';
    }
  }

  /**
   * Generate personalized recommendations
   */
  private async generateRecommendations(
    type: HealthAssessment['type'],
    score: number
  ): Promise<string[]> {
    const recommendations: string[] = [];

    switch (type) {
      case 'general':
        if (score < 60) {
          recommendations.push(
            'Schedule a comprehensive health checkup',
            'Discuss any health concerns with your doctor'
          );
        }
        break;

      case 'lifestyle':
        if (score < 70) {
          recommendations.push(
            'Aim for 7-9 hours of quality sleep each night',
            'Practice stress management techniques like meditation or yoga',
            'Increase physical activity gradually'
          );
        }
        break;

      case 'nutrition':
        if (score < 70) {
          recommendations.push(
            'Increase daily fruit and vegetable intake',
            'Reduce processed food consumption',
            'Consult with a nutritionist for a personalized diet plan'
          );
        }
        break;

      case 'exercise':
        if (score < 70) {
          recommendations.push(
            'Aim for at least 150 minutes of moderate exercise per week',
            'Include both cardio and strength training',
            'Start slowly and gradually increase intensity'
          );
        }
        break;

      case 'mental-health':
        if (score < 70) {
          recommendations.push(
            'Consider speaking with a mental health professional',
            'Practice mindfulness and relaxation techniques',
            'Reach out to support networks'
          );
        }
        break;

      case 'chronic-disease':
        if (score < 70) {
          recommendations.push(
            'Review medication adherence with your doctor',
            'Monitor your condition regularly',
            'Attend all scheduled medical appointments'
          );
        }
        break;
    }

    // Add generic recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Continue your current healthy lifestyle',
        'Stay proactive about your health'
      );
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Generate wellness recommendations
   */
  async generateWellnessRecommendations(
    patientId: string,
    healthProfile: string
  ): Promise<WellnessRecommendation[]> {
    const recommendations: WellnessRecommendation[] = [];

    const baseRecommendations: Omit<WellnessRecommendation, 'id'>[] = [
      {
        patientId,
        type: 'nutrition',
        title: 'Balanced Diet Plan',
        description: 'Follow a balanced diet rich in fruits, vegetables, and whole grains',
        priority: 'high',
        timeframe: 'ongoing',
        actionSteps: [
          'Aim for 5 servings of fruits and vegetables daily',
          'Choose whole grains over refined carbohydrates',
          'Include protein with each meal',
          'Limit processed foods and sugary drinks'
        ],
        expectedBenefit: 'Improved energy levels and weight management'
      },
      {
        patientId,
        type: 'exercise',
        title: 'Regular Physical Activity',
        description: 'Engage in at least 150 minutes of moderate exercise per week',
        priority: 'high',
        timeframe: 'ongoing',
        actionSteps: [
          'Start with 30 minutes of walking 5 days a week',
          'Gradually increase intensity and duration',
          'Include strength training 2 days per week',
          'Find activities you enjoy to stay consistent'
        ],
        expectedBenefit: 'Better cardiovascular health and stress reduction'
      },
      {
        patientId,
        type: 'lifestyle',
        title: 'Sleep Optimization',
        description: 'Maintain consistent sleep schedule of 7-9 hours nightly',
        priority: 'high',
        timeframe: 'ongoing',
        actionSteps: [
          'Go to bed and wake up at the same time daily',
          'Create a relaxing bedtime routine',
          'Avoid screens 1 hour before bed',
          'Keep bedroom cool and dark'
        ],
        expectedBenefit: 'Enhanced cognitive function and immune health'
      },
      {
        patientId,
        type: 'mental-health',
        title: 'Stress Management',
        description: 'Practice daily stress reduction techniques',
        priority: 'medium',
        timeframe: 'ongoing',
        actionSteps: [
          'Practice 10-minute meditation or breathing exercises daily',
          'Spend time in nature or with loved ones',
          'Engage in hobbies and activities you enjoy',
          'Consider journaling or therapy if stress is overwhelming'
        ],
        expectedBenefit: 'Better mental health and overall well-being'
      },
      {
        patientId,
        type: 'preventive-care',
        title: 'Regular Health Checkups',
        description: 'Schedule annual health screenings and vaccinations',
        priority: 'medium',
        timeframe: 'quarterly',
        actionSteps: [
          'Schedule annual physical examination',
          'Get recommended vaccinations',
          'Perform age-appropriate health screenings',
          'Keep health records updated'
        ],
        expectedBenefit: 'Early detection of health issues and prevention'
      }
    ];

    return baseRecommendations.map((rec) => ({
      ...rec,
      id: this.generateId()
    }));
  }

  /**
   * Get educational content
   */
  getEducationalContent(category?: string): EducationalContent[] {
    const allContent: EducationalContent[] = [
      {
        id: this.generateId(),
        title: 'Understanding Your Blood Pressure',
        category: 'cardiovascular',
        difficulty: 'beginner',
        content: `Blood pressure is the force of blood pushing against artery walls. It's measured in systolic/diastolic readings. Normal is below 120/80. Understanding your numbers helps you manage heart health.`,
        duration: 5,
        tags: ['blood-pressure', 'cardiovascular', 'measurement'],
        views: 1250,
        rating: 4.8
      },
      {
        id: this.generateId(),
        title: 'Managing Diabetes Through Diet',
        category: 'nutrition',
        difficulty: 'intermediate',
        content: `Carbohydrate counting, portion control, and timing of meals are crucial for blood sugar management. Learn how to make healthy food choices and monitor their impact on your glucose levels.`,
        duration: 10,
        tags: ['diabetes', 'nutrition', 'diet'],
        views: 2100,
        rating: 4.7
      },
      {
        id: this.generateId(),
        title: 'Exercise Benefits for Heart Health',
        category: 'exercise',
        difficulty: 'intermediate',
        content: `Regular physical activity strengthens your heart and improves circulation. Learn safe exercise techniques and how to gradually increase your activity level.`,
        duration: 8,
        tags: ['exercise', 'cardiovascular', 'fitness'],
        views: 1800,
        rating: 4.9
      },
      {
        id: this.generateId(),
        title: 'Recognizing Symptoms of Anxiety',
        category: 'mental-health',
        difficulty: 'beginner',
        content: `Learn to identify anxiety symptoms and understand the mind-body connection. Discover evidence-based coping strategies for managing anxiety effectively.`,
        duration: 6,
        tags: ['anxiety', 'mental-health', 'stress'],
        views: 950,
        rating: 4.6
      },
      {
        id: this.generateId(),
        title: 'Medication Adherence Strategies',
        category: 'medications',
        difficulty: 'beginner',
        content: `Taking medications correctly is crucial for treatment success. Learn strategies to remember your medications and understand why adherence matters.`,
        duration: 4,
        tags: ['medications', 'adherence', 'compliance'],
        views: 1650,
        rating: 4.7
      }
    ];

    if (category) {
      return allContent.filter((c) => c.category === category);
    }

    return allContent;
  }

  /**
   * Track learning progress
   */
  async trackLearningProgress(
    patientId: string,
    contentId: string,
    completionPercentage: number
  ): Promise<void> {
    // In production, save to database
    console.log(
      `Patient ${patientId} completed ${completionPercentage}% of content ${contentId}`
    );
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default PatientEducationService;
