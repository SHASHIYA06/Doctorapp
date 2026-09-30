/**
 * Gemini API Integration
 * Report analysis, patient education, symptom checking
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiAnalysis, PatientEducation, MedicalReport } from './types';

/**
 * Gemini Client Wrapper
 */
export class GeminiMedicalClient {
  private model: GenerativeModel;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required');
    }
    this.apiKey = apiKey;
    const client = new GoogleGenerativeAI(apiKey);
    this.model = client.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  /**
   * Analyze Medical Report (PDF, Image, Document)
   */
  async analyzeReport(reportPath: string, reportType: string): Promise<GeminiAnalysis> {
    const systemPrompt = `You are a medical report analysis assistant. Analyze the provided medical report and:
1. Summarize key findings in 2-3 sentences
2. List any abnormalities detected
3. Provide clinical recommendations
4. Suggest follow-up actions if needed
5. Rate your confidence (0-1) in the analysis

Output MUST be valid JSON:
{
  "summary": "string",
  "key_findings": ["string"],
  "abnormalities_detected": ["string"],
  "recommendations": ["string"],
  "follow_up_required": boolean,
  "follow_up_suggestions": ["string"],
  "confidence_score": number,
  "clinical_notes": "string"
}`;

    try {
      const response = await this.model.generateContent([
        systemPrompt,
        {
          inlineData: {
            mimeType: this.getMimeType(reportPath),
            data: await this.readFileAsBase64(reportPath),
          },
        },
      ]);

      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini');
      }

      const analysis = JSON.parse(jsonMatch[0]) as GeminiAnalysis;
      return analysis;
    } catch (error) {
      console.error('Gemini report analysis error:', error);
      throw new Error(`Failed to analyze report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Patient Education Content
   */
  async generatePatientEducation(
    contentType: string,
    topic: string,
    medicineNames?: string[]
  ): Promise<PatientEducation> {
    const prompts: Record<string, string> = {
      medicine_info: `Write patient-friendly information about ${topic}. Include:
- What is it used for?
- How does it work?
- Important safety information
- When to contact a doctor
Keep it simple and avoid medical jargon.`,

      symptom_guide: `Create a symptom guide for ${topic}. Include:
- What causes this symptom?
- When to see a doctor?
- Self-care measures
- Warning signs
- When to seek emergency care`,

      how_to_use: `Write instructions on how to use ${topic}. Include:
- Before you start
- How to take it
- Tips for remembering doses
- What if you miss a dose?
- Storage instructions`,

      side_effects: `List side effects of ${topic}. Include:
- Common side effects
- Serious side effects
- When to contact doctor
- Drug interactions
- Precautions`,

      lifestyle: `Write lifestyle advice for managing ${topic}. Include:
- Diet recommendations
- Exercise guidelines
- Sleep and rest
- Stress management
- Follow-up care`,
    };

    const prompt = prompts[contentType] || prompts.medicine_info;

    try {
      const response = await this.model.generateContent(prompt);
      const fullContent = response.response.text();

      return {
        id: this.generateId(),
        content_type: contentType as any,
        title: topic,
        summary: fullContent.substring(0, 200),
        full_content: fullContent,
        related_medicines: medicineNames || [],
        generated_by_gemini: true,
        gemini_prompt: prompt,
        views: 0,
        helpful_count: 0,
        not_helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Gemini education generation error:', error);
      throw new Error(`Failed to generate education content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Symptom Checker with Gemini
   */
  async checkSymptoms(symptoms: string[], age: number, gender: string): Promise<{
    possible_conditions: string[];
    recommendations: string[];
    when_to_see_doctor: string;
    emergency_warning_signs: string[];
    self_care_measures: string[];
  }> {
    const symptomsText = symptoms.join(', ');
    const prompt = `A ${age}-year-old ${gender} is experiencing: ${symptomsText}
    
Please provide:
1. List 3-5 possible conditions (in order of likelihood)
2. What they should do (recommendations)
3. When to see a doctor
4. Emergency warning signs
5. Self-care measures

Output as JSON:
{
  "possible_conditions": ["string"],
  "recommendations": ["string"],
  "when_to_see_doctor": "string",
  "emergency_warning_signs": ["string"],
  "self_care_measures": ["string"]
}

Important: This is for educational purposes only, not a diagnosis. Always recommend seeing a doctor.`;

    try {
      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Symptom checker error:', error);
      throw new Error(`Failed to check symptoms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Medicine Interaction Checker
   */
  async checkMedicineInteractions(medicines: string[], age: number): Promise<{
    interactions: string[];
    warnings: string[];
    safe_to_combine: boolean;
    recommendations: string[];
  }> {
    const medicineList = medicines.join(', ');
    const prompt = `Check interactions between these medicines: ${medicineList}
Patient age: ${age}

Provide:
1. List any interactions
2. Severity warnings
3. Whether it's safe to use together
4. Recommendations

Output JSON:
{
  "interactions": ["string"],
  "warnings": ["string"],
  "safe_to_combine": boolean,
  "recommendations": ["string"]
}`;

    try {
      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Interaction checker error:', error);
      throw new Error(`Failed to check interactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * General Physician Guidance
   */
  async getGeneralPhysicianGuidance(
    condition: string,
    symptoms: string[],
    patientAge: number,
    patientHistory?: string
  ): Promise<{
    diagnosis_guidance: string;
    recommended_tests: string[];
    treatment_options: string[];
    follow_up_plan: string;
    when_to_specialist: string;
  }> {
    const symptomsText = symptoms.join(', ');
    const historyText = patientHistory || 'No significant history';

    const prompt = `As a general physician, provide guidance for:
Condition: ${condition}
Symptoms: ${symptomsText}
Patient age: ${patientAge}
Medical history: ${historyText}

Provide:
1. Diagnostic approach
2. Recommended tests/investigations
3. Treatment options
4. Follow-up plan
5. When to refer to specialist

Output JSON:
{
  "diagnosis_guidance": "string",
  "recommended_tests": ["string"],
  "treatment_options": ["string"],
  "follow_up_plan": "string",
  "when_to_specialist": "string"
}`;

    try {
      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Physician guidance error:', error);
      throw new Error(`Failed to get physician guidance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze Prescription for Safety & Efficacy
   */
  async analyzePrescription(
    medicines: string[],
    indications: string[],
    patientAge: number,
    patientComorbidities?: string[]
  ): Promise<{
    prescription_validity: boolean;
    safety_concerns: string[];
    efficacy_assessment: string;
    contraindications: string[];
    monitoring_parameters: string[];
    dosage_recommendations: string[];
    improvement_suggestions: string[];
  }> {
    const medicineList = medicines.join(', ');
    const indicationsList = indications.join(', ');
    const comorbidityList = (patientComorbidities || []).join(', ') || 'None';

    const prompt = `Analyze this prescription:
Medicines: ${medicineList}
Indications: ${indicationsList}
Patient age: ${patientAge}
Comorbidities: ${comorbidityList}

Evaluate:
1. Is this a valid prescription for the indications?
2. Safety concerns or contraindications?
3. Will it be effective?
4. What to monitor?
5. Suggested dosages
6. Improvements needed

Output JSON:
{
  "prescription_validity": boolean,
  "safety_concerns": ["string"],
  "efficacy_assessment": "string",
  "contraindications": ["string"],
  "monitoring_parameters": ["string"],
  "dosage_recommendations": ["string"],
  "improvement_suggestions": ["string"]
}`;

    try {
      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Prescription analysis error:', error);
      throw new Error(`Failed to analyze prescription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Recommend Medicines Based on Condition
   */
  async recommendMedicines(
    condition: string,
    symptoms: string[],
    preferredModality?: 'allopathy' | 'ayurveda' | 'homeopathy'
  ): Promise<{
    recommended_medicines: Array<{
      name: string;
      modality: string;
      reason: string;
      typical_dosage: string;
      expected_benefits: string[];
      contraindications: string[];
    }>;
    holistic_approach: string;
    lifestyle_recommendations: string[];
    follow_up_duration: string;
  }> {
    const symptomsText = symptoms.join(', ');
    const modalityText = preferredModality || 'any proven modality';

    const prompt = `Recommend medicines for:
Condition: ${condition}
Symptoms: ${symptomsText}
Preferred modality: ${modalityText}

Provide:
1. Top 3-5 recommended medicines with reasons
2. Typical dosages
3. Expected benefits
4. Contraindications
5. Holistic approach
6. Lifestyle changes
7. Follow-up timeline

Output JSON:
{
  "recommended_medicines": [
    {
      "name": "string",
      "modality": "string",
      "reason": "string",
      "typical_dosage": "string",
      "expected_benefits": ["string"],
      "contraindications": ["string"]
    }
  ],
  "holistic_approach": "string",
  "lifestyle_recommendations": ["string"],
  "follow_up_duration": "string"
}`;

    try {
      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Medicine recommendation error:', error);
      throw new Error(`Failed to recommend medicines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze Lab Results & Health Metrics
   */
  async analyzeHealthMetrics(
    metrics: Record<string, number | string>,
    metricTypes: string[],
    patientAge: number,
    gender: string
  ): Promise<{
    overall_health_status: string;
    abnormal_findings: Array<{
      metric: string;
      value: string;
      normal_range: string;
      interpretation: string;
      severity: 'normal' | 'mild' | 'moderate' | 'severe';
    }>;
    recommendations: string[];
    specialist_referral_needed: boolean;
    follow_up_tests: string[];
    lifestyle_changes: string[];
  }> {
    const metricsJson = JSON.stringify(metrics);

    const prompt = `Analyze these health metrics:
Metrics: ${metricsJson}
Metric types: ${metricTypes.join(', ')}
Patient age: ${patientAge}
Gender: ${gender}

Provide:
1. Overall health status
2. Abnormal findings with interpretation
3. Recommendations
4. Need for specialist referral?
5. Follow-up tests
6. Lifestyle changes

Output JSON:
{
  "overall_health_status": "string",
  "abnormal_findings": [
    {
      "metric": "string",
      "value": "string",
      "normal_range": "string",
      "interpretation": "string",
      "severity": "normal|mild|moderate|severe"
    }
  ],
  "recommendations": ["string"],
  "specialist_referral_needed": boolean,
  "follow_up_tests": ["string"],
  "lifestyle_changes": ["string"]
}`;

    try {
      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Health metrics analysis error:', error);
      throw new Error(`Failed to analyze health metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Personalized Health Plan
   */
  async generateHealthPlan(
    conditions: string[],
    currentMedicines: string[],
    age: number,
    gender: string,
    lifestyle: Record<string, any>
  ): Promise<{
    health_plan_title: string;
    overview: string;
    immediate_actions: string[];
    weekly_plan: string[];
    monthly_goals: string[];
    medicine_optimization: string[];
    diet_recommendations: string[];
    exercise_recommendations: string[];
    stress_management: string[];
    follow_up_schedule: string;
    expected_outcomes: string[];
  }> {
    const conditionsList = conditions.join(', ');
    const medicinesList = currentMedicines.join(', ');
    const lifestyleJson = JSON.stringify(lifestyle);

    const prompt = `Create a personalized health plan for:
Conditions: ${conditionsList}
Current medicines: ${medicinesList}
Age: ${age}, Gender: ${gender}
Lifestyle: ${lifestyleJson}

Provide:
1. Plan title and overview
2. Immediate actions
3. Weekly plan
4. Monthly goals
5. Medicine optimization
6. Dietary recommendations
7. Exercise plan
8. Stress management
9. Follow-up schedule
10. Expected outcomes

Output JSON:
{
  "health_plan_title": "string",
  "overview": "string",
  "immediate_actions": ["string"],
  "weekly_plan": ["string"],
  "monthly_goals": ["string"],
  "medicine_optimization": ["string"],
  "diet_recommendations": ["string"],
  "exercise_recommendations": ["string"],
  "stress_management": ["string"],
  "follow_up_schedule": "string",
  "expected_outcomes": ["string"]
}`;

    try {
      const response = await this.model.generateContent(prompt);
      const responseText = response.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Health plan generation error:', error);
      throw new Error(`Failed to generate health plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Get MIME type from file path
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Helper: Read file as base64
   */
  private async readFileAsBase64(filePath: string): Promise<string> {
    const fs = await import('fs').then(m => m.promises);
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
  }

  /**
   * Helper: Generate ID
   */
  private generateId(): string {
    const { v4: uuidv4 } = require('uuid');
    return uuidv4();
  }
}

/**
 * Singleton instance
 */
let geminiClient: GeminiMedicalClient | null = null;

export function getGeminiClient(): GeminiMedicalClient {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable not set');
    }
    geminiClient = new GeminiMedicalClient(apiKey);
  }
  return geminiClient;
}

export default GeminiMedicalClient;
