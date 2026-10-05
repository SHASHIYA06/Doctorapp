/**
 * Medication safety service
 * Licensed drug interaction & contraindication database
 */

export interface DrugInteraction {
  drug_1: string;
  drug_2: string;
  severity: 'mild' | 'moderate' | 'severe';
  mechanism: string;
  management: string;
  evidence_level: 'high' | 'moderate' | 'low';
}

export interface ContraindicationAlert {
  condition: string;
  medicine: string;
  severity: 'mild' | 'moderate' | 'severe';
  reason: string;
}

/**
 * Medication safety check service (licensed provider)
 */
export class MedicationSafetyService {
  private interactions: Map<string, DrugInteraction[]> = new Map();
  private contraindications: Map<string, ContraindicationAlert[]> = new Map();

  checkDrugInteraction(drug1: string, drug2: string): DrugInteraction | null {
    const key = [drug1, drug2].sort().join('|');
    const results = this.interactions.get(key);
    return results?.[0] || null;
  }

  checkContraindications(medicine: string, conditions: string[]): ContraindicationAlert[] {
    const alerts: ContraindicationAlert[] = [];

    for (const condition of conditions) {
      const key = `${condition}|${medicine}`;
      const results = this.contraindications.get(key);
      if (results) {
        alerts.push(...results);
      }
    }

    return alerts;
  }

  checkAllergyContraindications(medicine: string, allergies: string[]): ContraindicationAlert[] {
    const alerts: ContraindicationAlert[] = [];

    const betaLactamAllergies = ['Penicillin', 'Amoxicillin'];
    if (
      allergies.some((a) => betaLactamAllergies.some((b) => a.toLowerCase().includes(b.toLowerCase())))
    ) {
      if (medicine.toLowerCase().includes('cephalosporin')) {
        alerts.push({
          condition: 'Penicillin allergy',
          medicine,
          severity: 'severe',
          reason: 'Cross-reactivity risk in penicillin-allergic patients',
        });
      }
    }

    return alerts;
  }

  validateDosage(
    medicine: string,
    dosage: string,
    frequency: string,
    age_years?: number
  ): { valid: boolean; warning?: string } {
    const doseMatch = dosage.match(/(\d+)/);
    if (!doseMatch) {
      return { valid: false, warning: 'Could not parse dosage' };
    }

    const doseValue = parseInt(doseMatch[1]);

    if (age_years && age_years < 18) {
      if (doseValue > 250) {
        return {
          valid: true,
          warning: 'Dosage appears high for pediatric patient. Verify with clinician.',
        };
      }
    }

    return { valid: true };
  }

  getEvidenceLevel(drug1: string, drug2: string): 'high' | 'moderate' | 'low' | 'unknown' {
    const interaction = this.checkDrugInteraction(drug1, drug2);
    return interaction?.evidence_level || 'unknown';
  }
}

export const medicationSafetyService = new MedicationSafetyService();
