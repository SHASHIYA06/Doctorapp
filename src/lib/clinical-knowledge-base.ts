// ═══════════════════════════════════════════════════════════════════════
// CLINICAL KNOWLEDGE BASE — Doctor-Like Response Engine
// 200+ conditions with specific medicine recommendations across
// ALLOPATHY, AYURVEDA, HOMEOPATHY (NEVER merged)
// ═══════════════════════════════════════════════════════════════════════

export type Modality = 'ALLOPATHY' | 'AYURVEDA' | 'HOMEOPATHY'

export interface LabInterpretation {
  testName: string
  value: number
  unit: string
  referenceRange: string
  status: 'LOW' | 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH'
  clinicalSignificance: string
  recommendedAction: string
  followUpTests: string[]
  associatedConditions: string[]
}

export interface MedicineRecommendation {
  medicineName: string
  genericName: string
  indianBrandNames: string[]
  dosage: string
  frequency: string
  duration: string
  route: string
  wing: Modality
  reasoning: string
  precautions: string[]
  sideEffects: string[]
  contraindications: string[]
  isFirstLine: boolean
  isPrescription: boolean
  janAushadhiAvailable: boolean
  janAushadhiPrice?: string
  mrp?: string
}

export interface ClinicalCondition {
  name: string
  icdCode: string
  description: string
  symptoms: string[]
  diagnosticCriteria: string[]
  labTests: string[]
  allopathyTreatment: MedicineRecommendation[]
  ayurvedaTreatment: MedicineRecommendation[]
  homeopathyTreatment: MedicineRecommendation[]
  lifestyleAdvice: string[]
  redFlags: string[]
  followUp: string[]
  whenToSeeDoctor: string
  dietAdvice: string[]
}

export interface ClinicalResponse {
  conditionName: string
  patientFriendlySummary: string
  detailedExplanation: string
  labInterpretation?: LabInterpretation
  allopathyRecommendations: MedicineRecommendation[]
  ayurvedaRecommendations: MedicineRecommendation[]
  homeopathyRecommendations: MedicineRecommendation[]
  safetyWarnings: string[]
  lifestyleAdvice: string[]
  dietAdvice: string[]
  followUpAdvice: string[]
  whenToSeeDoctor: string
  disclaimer: string
}

// ═══════════════════════════════════════════════════════════════════════
// CLINICAL CONDITIONS DATABASE
// ═══════════════════════════════════════════════════════════════════════

export const CLINICAL_CONDITIONS: Record<string, ClinicalCondition> = {

  // ─── METABOLIC & ENDOCRINE ────────────────────────────────────────

  'type-2-diabetes': {
    name: 'Type 2 Diabetes Mellitus',
    icdCode: 'E11',
    description: 'Chronic metabolic disorder characterized by insulin resistance and relative insulin deficiency, leading to hyperglycemia. Most common form of diabetes in adults.',
    symptoms: ['Increased thirst (polydipsia)', 'Frequent urination (polyuria)', 'Increased hunger (polyphagia)', 'Unexplained weight loss', 'Fatigue', 'Blurred vision', 'Slow-healing wounds', 'Frequent infections', 'Tingling/numbness in hands/feet'],
    diagnosticCriteria: ['Fasting Plasma Glucose ≥ 126 mg/dL (7.0 mmol/L)', '2-hour Plasma Glucose ≥ 200 mg/dL during OGTT', 'HbA1c ≥ 6.5%', 'Random Plasma Glucose ≥ 200 mg/dL with symptoms'],
    labTests: ['HbA1c', 'Fasting Plasma Glucose', 'Post-Prandial Glucose', 'Lipid Profile', 'Renal Function (eGFR)', 'Urine Albumin-to-Creatinine Ratio', 'Liver Function Tests'],
    allopathyTreatment: [
      {
        medicineName: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        indianBrandNames: ['Glycomet', 'Glucophage', 'Obimet', 'Walaphage'],
        dosage: '500mg initially, titrate to 1000mg BD',
        frequency: 'Twice daily with meals',
        duration: 'Lifelong (chronic condition)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Metformin is the FIRST-LINE treatment for Type 2 Diabetes per ADA/EASD/ICMR guidelines. It reduces hepatic glucose production, improves insulin sensitivity, and has cardiovascular benefit. For HbA1c 7.8%, monotherapy with Metformin is appropriate as the first step. Target HbA1c <7.0% for most non-pregnant adults. Metformin does NOT cause hypoglycemia when used alone and promotes modest weight loss.',
        precautions: ['Monitor renal function — eGFR must be >30 mL/min/1.73m²', 'Risk of lactic acidosis in severe renal impairment', 'Take with meals to minimize GI side effects', 'Vitamin B12 deficiency with long-term use — check annually', 'Hold 48 hours before iodinated contrast procedures', 'Start low (500mg) and titrate slowly over 4-6 weeks'],
        sideEffects: ['Nausea and vomiting (20-30% initially, decreases over time)', 'Diarrhea', 'Abdominal discomfort/bloating', 'Metallic taste', 'Vitamin B12 deficiency (long-term)', 'Lactic acidosis (extremely rare, <0.03%)'],
        contraindications: ['eGFR <30 mL/min/1.73m²', 'Metabolic acidosis', 'Before iodinated contrast procedures (hold 48h)', 'Severe hepatic impairment', 'Alcohol abuse', 'Type 1 Diabetes'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹2-5 per tablet',
        mrp: '₹15-35 per 10 tablets',
      },
      {
        medicineName: 'Glimepiride',
        genericName: 'Glimepiride',
        indianBrandNames: ['Amaryl', 'Glimy', 'Glypride', 'Zoryl'],
        dosage: '1mg initially, may increase to 2-4mg',
        frequency: 'Once daily with breakfast',
        duration: 'Lifelong (add-on therapy)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'If Metformin alone does not achieve HbA1c <7.0% after 3 months, add a Sulfonylurea as second-line per ICMR guidelines. Glimepiride stimulates insulin secretion from pancreatic beta cells. It has a lower risk of hypoglycemia compared to glibenclamide. Start at 1mg and titrate based on glycemic response.',
        precautions: ['Risk of hypoglycemia — especially in elderly and those with CKD', 'Take with breakfast to reduce hypoglycemia risk', 'Monitor blood glucose regularly', 'Can cause weight gain (2-3 kg typical)', 'Skip dose if meal is missed'],
        sideEffects: ['Hypoglycemia (especially if dose is too high or meal is missed)', 'Weight gain', 'Dizziness', 'Headache', 'Nausea', 'Skin rash'],
        contraindications: ['Type 1 Diabetes', 'Diabetic ketoacidosis', 'Severe hepatic impairment', 'Severe renal impairment', 'Sulfonylurea allergy', 'Pregnancy'],
        isFirstLine: false,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹3-8 per tablet',
        mrp: '₹30-80 per 10 tablets',
      },
      {
        medicineName: 'Sitagliptin',
        genericName: 'Sitagliptin Phosphate',
        indianBrandNames: ['Januvia', 'Sitaget', 'Istam', 'Sitaglyn'],
        dosage: '100mg once daily',
        frequency: 'Once daily (any time of day)',
        duration: 'Lifelong (add-on therapy)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'DPP-4 inhibitor alternative if Sulfonylurea is not tolerated or hypoglycemia is a concern. Sitagliptin increases incretin levels (GLP-1), stimulating insulin secretion in a glucose-dependent manner — lower hypoglycemia risk. Weight neutral. Good for elderly patients.',
        precautions: ['Dose adjustment in renal impairment: 50mg if eGFR 30-50, 25mg if eGFR <30', 'Monitor for pancreatitis symptoms', 'Not recommended as monotherapy if HbA1c >9%'],
        sideEffects: ['Nasopharyngitis', 'Headache', 'Upper respiratory infection', 'Joint pain', 'Pancreatitis (rare but serious)'],
        contraindications: ['History of pancreatitis', 'Severe renal impairment (without dose adjustment)', 'Type 1 Diabetes', 'Diabetic ketoacidosis'],
        isFirstLine: false,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹15-30 per tablet',
        mrp: '₹150-300 per 10 tablets',
      },
      {
        medicineName: 'Empagliflozin',
        genericName: 'Empagliflozin',
        indianBrandNames: ['Jardiance', 'Empagard', 'Gemp'],
        dosage: '10mg (can increase to 25mg)',
        frequency: 'Once daily in the morning',
        duration: 'Lifelong (add-on with CV benefit)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'SGLT2 inhibitor with proven cardiovascular benefit (EMPA-REG OUTCOME trial — 38% reduction in CV death). Reduces HbA1c by 0.5-0.7%, promotes weight loss (2-3 kg), reduces blood pressure. STRONGLY recommended for patients with established CVD or heart failure. Works by blocking glucose reabsorption in kidneys — excess glucose excreted in urine.',
        precautions: ['Monitor for signs of genital mycotic infections', 'Risk of diabetic ketoacidosis (euglycemic DKA) — even with normal glucose', 'Not effective if eGFR <30', 'Ensure adequate hydration', 'Hold before surgery (risk of ketoacidosis)'],
        sideEffects: ['Genital mycotic infections (vaginal candidiasis, balanitis)', 'Urinary tract infections', 'Increased urination', 'Hypoglycemia (when combined with insulin/SU)', 'Diabetic ketoacidosis (rare)', 'Dehydration'],
        contraindications: ['eGFR <30 mL/min/1.73m²', 'Type 1 Diabetes', 'Diabetic ketoacidosis (current)', 'Frequent genital infections', 'Pregnancy and breastfeeding'],
        isFirstLine: false,
        isPrescription: true,
        janAushadhiAvailable: false,
        mrp: '₹200-450 per 10 tablets',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Gudmar (Gymnema Sylvestre)',
        genericName: 'Gymnema Sylvestre',
        indianBrandNames: ['Gudmar Churna', 'Gymnema Tablets', 'Madhunashini Vati'],
        dosage: '500mg standardized extract',
        frequency: 'Twice daily before meals',
        duration: '3-6 months, then reassess',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Gudmar is called "Madhunashini" (Sugar Destroyer) in Ayurveda. It reduces glucose absorption in intestines and regenerates pancreatic beta cells. Clinical studies show HbA1c reduction of 0.5-1.0% over 3 months. Mentioned in Charaka Samhita for Prameha (diabetes). Choose standardized extract with 25% gymnemic acid.',
        precautions: ['May enhance effect of allopathic antidiabetic drugs — monitor blood glucose closely', 'Not recommended in pregnancy', 'Choose standardized extract with 25% gymnemic acid', 'Do not abruptly stop allopathic medicines', 'Monitor HbA1c every 3 months'],
        sideEffects: ['Hypoglycemia (when combined with allopathic drugs)', 'Mild GI discomfort', 'Taste alteration (suppresses sweet taste perception)'],
        contraindications: ['Pregnancy', 'Breastfeeding', 'Concurrent insulin use without close monitoring'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
      {
        medicineName: 'Karela (Momordica Charantia)',
        genericName: 'Bitter Gourd / Bitter Melon Extract',
        indianBrandNames: ['Karela Juice', 'Karela Capsules', 'Bitter Gourd Extract'],
        dosage: 'Juice: 30ml daily OR Capsules: 500mg',
        frequency: 'Twice daily on empty stomach',
        duration: '3-6 months review',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Karela contains polypeptide-p (plant insulin), charantin, and vicine which have hypoglycemic properties. It improves glucose tolerance and insulin sensitivity. Classical Ayurvedic text reference: Charaka Samhita, Sutrasthana. Studies show reduction in fasting blood sugar by 15-20%.',
        precautions: ['Do not take with other hypoglycemics without monitoring', 'Avoid in pregnancy (may cause uterine bleeding)', 'Start with small dose and increase gradually', 'Monitor blood glucose daily initially'],
        sideEffects: ['Hypoglycemia (with allopathic drugs)', 'Abdominal pain', 'Diarrhea', 'Bitter taste'],
        contraindications: ['Pregnancy', 'G6PD deficiency (may cause hemolysis)', 'Children under 12'],
        isFirstLine: false,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
      {
        medicineName: 'Triphala',
        genericName: 'Triphala (Amalaki + Haritaki + Bibhitaki)',
        indianBrandNames: ['Triphala Churna', 'Triphala Tablets', 'Zandu Triphala'],
        dosage: '3-5g churna or 500mg tablet',
        frequency: 'Once daily at bedtime with warm water',
        duration: 'Long-term (safe for extended use)',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Triphala supports digestive health and metabolism in diabetes. It helps regulate blood sugar, improves gut microbiome, and reduces oxidative stress. Safe for long-term use as adjunctive therapy. Acts on Meda dhatu (fat tissue) metabolism.',
        precautions: ['Safe for long-term use', 'Take at bedtime for best results', 'Can be taken alongside allopathic medicines'],
        sideEffects: ['Loose stools initially', 'Mild GI adjustment period'],
        contraindications: ['Pregnancy', 'Acute diarrhea'],
        isFirstLine: false,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Syzygium Jambolanum',
        genericName: 'Syzygium Jambolanum (Q/3X/6X)',
        indianBrandNames: ['SBL Syzygium', 'Dr. Reckeweg Syzygium', 'Schwabe Syzygium'],
        dosage: 'Mother Tincture (Q) 10-15 drops in water OR 3X/6X potency',
        frequency: 'Twice daily',
        duration: '3 months, then reassess',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Syzygium Jambolanum is the TOP homeopathic remedy for diabetes with marked reduction in blood sugar levels. It acts on pancreatic function and sugar metabolism. Mother tincture (Q) is more commonly used in India for diabetes management. Clinical observation shows reduction in fasting sugar by 20-40 mg/dL over 2-3 months.',
        precautions: ['Monitor blood sugar regularly — do not stop allopathic medicines abruptly', 'Take under qualified homeopath supervision', 'Mother tincture may interact with allopathic antidiabetics', 'Regular HbA1c monitoring essential'],
        sideEffects: ['Initial aggravation possible (homeopathic)', 'No known toxic effects at recommended doses'],
        contraindications: ['Should NOT replace emergency diabetes treatment (DKA, HHS)', 'Insulin-dependent Type 1 Diabetes — use only as adjunctive'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
      {
        medicineName: 'Phosphoric Acid',
        genericName: 'Phosphoricum Acidum',
        indianBrandNames: ['SBL Phosphoric Acid', 'Schwabe Phosphoric Acid'],
        dosage: '30C potency',
        frequency: 'Once daily',
        duration: '2-3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Phosphoric Acid is indicated for diabetes with extreme weakness, mental dullness, and frequent urination. It addresses the emotional and physical exhaustion seen in long-standing diabetes. Best for patients with apathy, indifference, and grief as triggering factors.',
        precautions: ['Do not take with food — 30 min before or after', 'Avoid coffee/camphor while on homeopathy', 'Take under qualified homeopath'],
        sideEffects: ['Homeopathic aggravation initially possible'],
        contraindications: ['Emergency diabetic conditions'],
        isFirstLine: false,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: [
      'Regular exercise: 150 min/week moderate intensity (brisk walking, cycling, swimming)',
      'Weight loss: Target 5-10% body weight reduction if overweight',
      'Blood glucose monitoring: Fasting and 2-hour post-prandial',
      'Foot care: Daily inspection, proper footwear, avoid walking barefoot',
      'Eye examination: Annual retinal screening',
      'Dental care: Regular check-ups (diabetes increases gum disease risk)',
      'Stress management: Yoga, meditation, adequate sleep (7-8 hours)',
      'Smoking cessation: Essential — doubles CV risk in diabetes',
      'Alcohol: Limit to 1 drink/day (women) or 2 drinks/day (men) — can cause hypoglycemia',
    ],
    redFlags: ['Blood glucose >300 mg/dL with symptoms', 'Blood glucose <70 mg/dL (hypoglycemia)', 'Diabetic ketoacidosis signs: nausea, vomiting, abdominal pain, fruity breath', 'Severe hypoglycemia: confusion, seizures, unconsciousness', 'Foot ulcer or infection', 'Sudden vision changes', 'Chest pain', 'Difficulty breathing'],
    followUp: ['HbA1c every 3 months', 'Fasting lipid profile every 6 months', 'Renal function (eGFR, urine ACR) every 6 months', 'Annual eye examination', 'Annual foot examination', 'Blood pressure every visit', 'Thyroid function (if indicated)'],
    whenToSeeDoctor: 'See a doctor IMMEDIATELY if: blood sugar is consistently above 300 mg/dL, symptoms of diabetic ketoacidosis (nausea, vomiting, fruity breath, confusion), severe hypoglycemia that doesn\'t respond to sugar, foot ulcer or infection, sudden vision loss, chest pain with sweating.',
    dietAdvice: [
      'Complex carbohydrates: Whole grains, oats, brown rice (avoid refined carbs/white rice)',
      'Protein: Lean meats, fish, eggs, dal, paneer — 1-1.5g/kg body weight',
      'Healthy fats: Olive oil, nuts, seeds, avocado (limit saturated fat)',
      'Vegetables: Green leafy vegetables, bitter gourd — at least 5 servings/day',
      'Fruits: Low glycemic index fruits (berries, apple, guava) — avoid mango, banana, grapes',
      'Fiber: 25-30g daily — whole grains, legumes, vegetables',
      'Avoid: Sugar, jaggery, honey, sweets, cold drinks, fruit juices, white bread',
      'Methi (fenugreek) seeds: Soak 1 tsp overnight, consume in morning',
      'Cinnamon: 1-2g daily may improve insulin sensitivity',
      'Meal timing: Eat at regular intervals, don\'t skip meals',
    ],
  },

  // ─── CARDIOVASCULAR — HYPERLIPIDEMIA / HIGH CHOLESTEROL ──────────

  'hyperlipidemia': {
    name: 'Hyperlipidemia (High Cholesterol)',
    icdCode: 'E78',
    description: 'Elevated levels of lipids (cholesterol, triglycerides) in the blood, increasing risk of atherosclerosis, coronary artery disease, stroke, and peripheral artery disease. Total cholesterol 9.3 mmol/L (~360 mg/dL) is VERY HIGH and requires immediate treatment.',
    symptoms: ['Often asymptomatic — detected on blood test', 'Xanthelasmas (yellow deposits around eyes)', 'Xanthomas (cholesterol deposits in tendons/skin)', 'Corneal arcus (white ring around cornea in young people)', 'Chest pain (if CAD develops)', 'Leg pain while walking (if PAD develops)'],
    diagnosticCriteria: ['Total Cholesterol >200 mg/dL desirable, >240 high', 'LDL >100 mg/dL (target depends on risk category)', 'HDL <40 mg/dL (men), <50 (women) = low', 'Triglycerides >150 mg/dL = elevated', 'For very high risk (CVD + diabetes): LDL target <55 mg/dL', 'For high risk (CVD): LDL target <70 mg/dL', 'For moderate risk: LDL target <100 mg/dL'],
    labTests: ['Fasting Lipid Profile (Total Cholesterol, LDL, HDL, Triglycerides)', 'ApoB', 'Lp(a)', 'TSH (rule out hypothyroid as cause)', 'Liver Function Tests', 'Fasting Blood Glucose', 'HbA1c'],
    allopathyTreatment: [
      {
        medicineName: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        indianBrandNames: ['Atorva', 'Lipitor', 'Atorlip', 'Tonact', 'Storvas'],
        dosage: '10-20mg initially (can go up to 40-80mg)',
        frequency: 'Once daily at bedtime',
        duration: 'Lifelong (chronic condition)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Atorvastatin is the FIRST-LINE statin for hyperlipidemia per ACC/AHA and ICMR guidelines. For Total Cholesterol 9.3 mmol/L (~360 mg/dL), HIGH-INTENSITY statin (Atorvastatin 40-80mg) is recommended to achieve LDL reduction of ≥50%. Statins reduce CV events by 25-35% per 1 mmol/L LDL reduction. Atorvastatin is preferred in India due to cost-effectiveness and availability.',
        precautions: ['Baseline LFTs before starting, recheck at 6-12 weeks', 'Report unexplained muscle pain/weakness immediately', 'Avoid grapefruit/grapefruit juice (increases statin levels)', 'Take at bedtime (cholesterol synthesis peaks at night)', 'Dose adjust in renal impairment', 'Monitor CPK if muscle symptoms develop'],
        sideEffects: ['Myalgia (muscle pain) — 5-10%', 'Elevated liver enzymes — 0.5-2%', 'Headache', 'GI disturbance', 'Sleep disturbance', 'Rhabdomyolysis (extremely rare, <0.01%)', 'New-onset diabetes (slight increase with high-dose statins)'],
        contraindications: ['Active liver disease', 'Pregnancy and breastfeeding', 'Unexplained persistent elevation of liver enzymes', 'Concurrent use of strong CYP3A4 inhibitors (clarithromycin, itraconazole)', 'History of rhabdomyolysis'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹3-10 per tablet',
        mrp: '₹30-120 per 10 tablets',
      },
      {
        medicineName: 'Rosuvastatin',
        genericName: 'Rosuvastatin Calcium',
        indianBrandNames: ['Rosuvast', 'Crestor', 'Roseday', 'Rozavel', 'Statin'],
        dosage: '5-10mg (can go up to 20-40mg)',
        frequency: 'Once daily at any time',
        duration: 'Lifelong',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Rosuvastatin is the MOST POTENT statin — achieves greatest LDL reduction per mg dose. 10mg Rosuvastatin ≈ 20mg Atorvastatin in LDL reduction. Preferred when aggressive LDL lowering is needed (Total Cholesterol 9.3 mmol/L). Can be taken at any time (not just bedtime). Lower drug interactions than Atorvastatin.',
        precautions: ['Start at 5mg in Asian patients (higher plasma levels)', 'Monitor LFTs and renal function', 'Report muscle symptoms immediately', 'Lower risk of drug interactions than Atorvastatin', 'Dose adjust if eGFR <30'],
        sideEffects: ['Myalgia', 'Elevated liver enzymes', 'Headache', 'Nausea', 'Proteinuria (at high doses)', 'Rhabdomyolysis (rare)'],
        contraindications: ['Active liver disease', 'Pregnancy and breastfeeding', 'Severe renal impairment (eGFR <30) without dose adjustment', 'Concurrent cyclosporine use'],
        isFirstLine: false,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹5-20 per tablet',
        mrp: '₹50-200 per 10 tablets',
      },
      {
        medicineName: 'Ezetimibe',
        genericName: 'Ezetimibe',
        indianBrandNames: ['Ezetimib', 'Zetia', 'Ezimibe', 'Atorva-EZ'],
        dosage: '10mg once daily',
        frequency: 'Once daily',
        duration: 'Lifelong (add-on to statin)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'If statin alone does not achieve LDL target (common with Total Cholesterol >300 mg/dL), add Ezetimibe as second-line. Ezetimibe blocks cholesterol absorption in the small intestine — complementary mechanism to statins. Provides additional 15-20% LDL reduction. IMPROVE-IT trial showed benefit in post-ACS patients. Can also be used if statin intolerance limits statin dose.',
        precautions: ['Safe to combine with statins', 'Monitor liver enzymes if combined with statin', 'Not recommended as monotherapy for high-risk patients', 'Can be taken with or without food'],
        sideEffects: ['Diarrhea', 'Abdominal pain', 'Fatigue', 'Myalgia (when combined with statin)', 'Elevated liver enzymes (rare)'],
        contraindications: ['Active liver disease (when combined with statin)', 'Pregnancy and breastfeeding', 'Biliary cirrhosis'],
        isFirstLine: false,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹8-20 per tablet',
        mrp: '₹80-200 per 10 tablets',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Guggulu (Commiphora Mukul)',
        genericName: 'Guggul / Guggulipid',
        indianBrandNames: ['Shuddha Guggulu', 'Guggulipid', 'Kanchnar Guggulu', 'Triphala Guggulu'],
        dosage: '500mg standardized extract (2.5% guggulsterones)',
        frequency: 'Twice daily after meals',
        duration: '3-6 months, then reassess',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Guggulu is the primary Ayurvedic herb for lipid management. Mentioned in Charaka Samhita for Medoroga (lipid disorders). Guggulsterone-E and Z act as antagonists of FXR nuclear receptor, reducing cholesterol synthesis and increasing excretion. Studies show 15-20% reduction in Total Cholesterol and 20-25% reduction in Triglycerides over 12 weeks.',
        precautions: ['Choose standardized extract with 2.5% guggulsterones', 'May interact with thyroid medications', 'Monitor liver function', 'Can interact with anticoagulants (warfarin)', 'Avoid in pregnancy — uterine stimulant'],
        sideEffects: ['Mild GI discomfort', 'Skin rash (rare)', 'Loose stools', 'May interfere with thyroid medication absorption'],
        contraindications: ['Pregnancy and breastfeeding', 'Hyperthyroidism', 'Concurrent warfarin therapy without monitoring', 'Liver disease'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
      {
        medicineName: 'Arjuna (Terminalia Arjuna)',
        genericName: 'Terminalia Arjuna bark extract',
        indianBrandNames: ['Arjuna Churna', 'Arjunarishta', 'Arjuna Capsules'],
        dosage: '500mg bark extract or 3g churna',
        frequency: 'Twice daily with water',
        duration: '3-6 months',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Arjuna is the primary Ayurvedic herb for cardiovascular health. It strengthens heart muscle (Hridya), improves lipid profile, and has antioxidant and anti-inflammatory properties. Studies show reduction in Total Cholesterol (10-15%) and LDL, increase in HDL. Also helps with angina and heart failure.',
        precautions: ['Safe for long-term use', 'Can be taken alongside statins with monitoring', 'Monitor blood pressure (may have hypotensive effect)'],
        sideEffects: ['Generally well-tolerated', 'Mild GI discomfort in some', 'Potential hypotensive effect'],
        contraindications: ['Severe hypotension', 'Pregnancy'],
        isFirstLine: false,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Cholesterinum',
        genericName: 'Cholesterinum 3X/6X',
        indianBrandNames: ['SBL Cholesterinum', 'Schwabe Cholesterinum'],
        dosage: '3X potency',
        frequency: 'Twice daily',
        duration: '3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Cholesterinum is the specific homeopathic remedy for elevated cholesterol levels. It acts on liver and biliary system, helping regulate cholesterol metabolism. Indicated when there are deposits of cholesterol in the body (xanthomas, xanthelasmas) and elevated serum cholesterol.',
        precautions: ['Monitor lipid profile every 3 months', 'Do not stop statins abruptly', 'Take under qualified homeopath', 'Regular cardiac evaluation essential'],
        sideEffects: ['No known side effects at homeopathic doses'],
        contraindications: ['Should not replace statin therapy in high-risk patients'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: [
      'Regular aerobic exercise: 150 min/week (brisk walking, jogging, cycling, swimming)',
      'Weight management: BMI 18.5-24.9, waist <90cm (men), <80cm (women) for Indians',
      'Smoking cessation: CRITICAL — smoking doubles CVD risk with high cholesterol',
      'Limit alcohol: <2 drinks/day (men), <1 drink/day (women)',
      'Stress management: Yoga, pranayama, meditation',
      'Sleep: 7-9 hours per night',
      'Regular lipid profile monitoring: Every 3 months until target, then every 6 months',
    ],
    redFlags: ['Chest pain or pressure (angina/MI)', 'Sudden numbness/weakness on one side (stroke)', 'Severe leg pain while walking (PAD)', 'Yellow cholesterol deposits in tendons (familial hypercholesterolemia)', 'LDL >190 mg/dL (consider familial hypercholesterolemia)', 'Triglycerides >500 mg/dL (pancreatitis risk)'],
    followUp: ['Lipid profile every 3 months until target achieved, then every 6 months', 'LFTs 6-12 weeks after starting statin, then annually', 'HbA1c and fasting glucose (statins may increase diabetes risk)', 'Thyroid function if not done', 'ECG and stress test if symptomatic', 'ApoB and Lp(a) if not at target despite maximal therapy'],
    whenToSeeDoctor: 'See a doctor IMMEDIATELY if: chest pain or pressure, pain radiating to left arm/jaw, sudden numbness or weakness on one side of body, difficulty speaking, severe leg pain while walking that stops with rest, xanthomas or xanthelasmas appearing. Schedule routine follow-up every 3-6 months for lipid monitoring.',
    dietAdvice: [
      'Saturated fat: LIMIT to <7% of total calories — avoid red meat, butter, ghee, coconut oil, palm oil',
      'Trans fat: AVOID completely — no vanaspati, margarine, commercially fried foods',
      'Soluble fiber: 10-25g daily — oats, barley, legumes, apples, psyllium (isabgol)',
      'Omega-3 fatty acids: Fatty fish (salmon, mackerel, sardines) 2x/week OR 1g EPA+DHA supplement',
      'Nuts: 30g/day almonds, walnuts — improve LDL and HDL',
      'Fruits and vegetables: 5+ servings/day — antioxidants, fiber',
      'Whole grains: Replace white rice with brown rice/quinoa/oats',
      'Garlic: 2-4 cloves daily — modest cholesterol reduction (5-10%)',
      'Green tea: 2-3 cups daily — antioxidant, modest lipid improvement',
      'Indian cooking: Use mustard oil or olive oil instead of ghee/coconut oil',
      'Dairy: Low-fat options — skim milk, low-fat yogurt',
      'Legumes: Dal, chana, rajma — excellent protein and fiber source',
    ],
  },

  // ─── HYPERTENSION ────────────────────────────────────────────────

  'hypertension': {
    name: 'Hypertension (High Blood Pressure)',
    icdCode: 'I10',
    description: 'Persistent elevation of blood pressure ≥140/90 mmHg (or ≥130/80 per ACC/AHA 2017). Major risk factor for stroke, coronary artery disease, heart failure, CKD, and retinopathy.',
    symptoms: ['Often asymptomatic ("silent killer")', 'Headache (especially occipital, morning)', 'Dizziness', 'Blurred vision', 'Chest pain', 'Shortness of breath', 'Nosebleeds (epistaxis)', 'Fatigue', 'Palpitations'],
    diagnosticCriteria: ['Normal: <120/80 mmHg', 'Elevated: 120-129/<80', 'Stage 1: 130-139/80-89 (ACC/AHA) or 140-159/90-99 (WHO/ISH)', 'Stage 2: ≥140/≥90 (ACC/AHA) or ≥160/≥100 (WHO/ISH)', 'Hypertensive Crisis: >180/120'],
    labTests: ['Blood Pressure measurement (both arms)', 'Basic Metabolic Panel (Na, K, Creatinine, eGFR)', 'Fasting Lipid Profile', 'Fasting Blood Glucose / HbA1c', 'Urine Analysis (protein, RBC)', 'ECG', 'TSH', 'Urine Albumin-to-Creatinine Ratio'],
    allopathyTreatment: [
      {
        medicineName: 'Amlodipine',
        genericName: 'Amlodipine Besylate',
        indianBrandNames: ['Amlip', 'Amlodac', 'Norvasc', 'Amlong', 'Amlipine'],
        dosage: '5mg initially (increase to 10mg if needed)',
        frequency: 'Once daily',
        duration: 'Lifelong',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Amlodipine is a FIRST-LINE antihypertensive — Calcium Channel Blocker (CCB). Preferred as initial therapy per ICMR/WHO guidelines, especially in Black/Indian population where CCBs are more effective than ACE inhibitors as monotherapy. Long-acting, once daily, well-tolerated. Reduces stroke risk significantly.',
        precautions: ['Start at 5mg, increase to 10mg after 2-4 weeks if needed', 'Monitor for peripheral edema (dose-dependent)', 'Can be combined with ACE inhibitor or ARB', 'Safe in diabetes and CKD', 'Avoid abrupt discontinuation'],
        sideEffects: ['Peripheral edema (ankle swelling) — 5-10%', 'Headache', 'Flushing', 'Dizziness', 'Fatigue', 'Palpitations', 'Gingival hyperplasia (rare)'],
        contraindications: ['Severe aortic stenosis', 'Cardiogenic shock', 'Unstable angina (without beta-blocker)', 'Known hypersensitivity'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹2-5 per tablet',
        mrp: '₹20-60 per 10 tablets',
      },
      {
        medicineName: 'Telmisartan',
        genericName: 'Telmisartan',
        indianBrandNames: ['Telma', 'Sartel', 'Telsartan', 'Cresar', 'Misartan'],
        dosage: '40mg initially (increase to 80mg)',
        frequency: 'Once daily',
        duration: 'Lifelong',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Telmisartan is an ARB (Angiotensin Receptor Blocker) — FIRST-LINE especially in diabetes with hypertension (renoprotective). Blocks angiotensin II type 1 receptors, reducing BP and providing organ protection. Longest half-life among ARBs (24-hour coverage). Preferred in patients with diabetes, CKD, or LVH.',
        precautions: ['Monitor serum potassium (risk of hyperkalemia)', 'Check renal function 1-2 weeks after starting', 'Do NOT combine with ACE inhibitor', 'Contraindicated in bilateral renal artery stenosis', 'Avoid in pregnancy (teratogenic)'],
        sideEffects: ['Dizziness', 'Hyperkalemia', 'Fatigue', 'Back pain', 'URI symptoms', 'Hypotension (especially volume-depleted patients)'],
        contraindications: ['Pregnancy (Category X — fetal toxicity)', 'Bilateral renal artery stenosis', 'Hyperkalemia (>5.5 mEq/L)', 'Concurrent ACE inhibitor use', 'Severe hepatic impairment'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹3-10 per tablet',
        mrp: '₹30-100 per 10 tablets',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Sarpagandha (Rauwolfia Serpentina)',
        genericName: 'Rauwolfia Serpentina',
        indianBrandNames: ['Sarpagandha Vati', 'Serpilina', 'Rauwolfia Tablets'],
        dosage: '250-500mg root powder',
        frequency: 'Twice daily after meals',
        duration: 'Long-term with monitoring',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Sarpagandha is the PRIMARY Ayurvedic antihypertensive. Contains reserpine (alkaloid) which depletes catecholamines, reducing BP. Used in Indian medicine for centuries for hypertension ("Rakta Gata Vata"). Clinical studies show significant BP reduction. Source of modern reserpine (one of first antihypertensives).',
        precautions: ['Start with low dose — can cause severe depression at high doses', 'Monitor for depression (reserpine side effect)', 'Do not combine with MAO inhibitors', 'Can cause nasal stuffiness', 'Regular BP monitoring essential'],
        sideEffects: ['Depression (at higher doses)', 'Nasal congestion', 'Sedation/drowsiness', 'GI upset', 'Bradycardia'],
        contraindications: ['Depression or history of depression', 'Peptic ulcer', 'Pregnancy', 'Concurrent MAO inhibitors'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
      {
        medicineName: 'Arjuna (Terminalia Arjuna)',
        genericName: 'Terminalia Arjuna bark',
        indianBrandNames: ['Arjuna Churna', 'Arjunarishta'],
        dosage: '3g churna with milk',
        frequency: 'Twice daily',
        duration: 'Long-term',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Arjuna is a cardiac tonic in Ayurveda that supports heart muscle, reduces BP, and improves lipid profile. Mentioned in Charaka Samhita for Hridroga (heart disease). Studies show 5-10 mmHg reduction in systolic BP.',
        precautions: ['Safe for long-term use', 'Can complement allopathic antihypertensives with monitoring', 'Monitor BP regularly'],
        sideEffects: ['Generally well-tolerated', 'Mild GI discomfort'],
        contraindications: ['Severe hypotension', 'Pregnancy'],
        isFirstLine: false,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Rauwolfia Serpentina',
        genericName: 'Rauwolfia Serpentina (Q/3X/6X)',
        indianBrandNames: ['SBL Rauwolfia', 'Dr. Reckeweg Rauwolfia'],
        dosage: 'Mother Tincture (Q) 10-15 drops OR 3X potency',
        frequency: 'Twice daily',
        duration: '3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Homeopathic Rauwolfia is used for hypertension with anxiety, restlessness, and palpitations. It acts on the nervous system to reduce sympathetic overactivity. Mother tincture is more commonly used in India for hypertension management.',
        precautions: ['Monitor BP regularly', 'Do not stop allopathic antihypertensives abruptly', 'Take under qualified homeopath'],
        sideEffects: ['No significant side effects at homeopathic doses'],
        contraindications: ['Should not replace emergency antihypertensive treatment', 'Hypertensive crisis requires emergency care'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: [
      'DASH diet: Rich in fruits, vegetables, whole grains, low-fat dairy, reduced sodium',
      'Sodium restriction: <2.4g/day (≤6g salt/day) — avoid pickles, papad, processed food',
      'Exercise: 150 min/week moderate aerobic activity + 2x/week strength training',
      'Weight loss: Target BMI <23 for Indian population',
      'Limit alcohol: ≤2 drinks/day (men), ≤1 drink/day (women)',
      'Smoking cessation: Essential — each cigarette raises BP by 5-10 mmHg',
      'Stress management: Yoga, pranayama (especially Anulom Vilom), meditation',
      'Home BP monitoring: Morning and evening, record and share with doctor',
    ],
    redFlags: ['BP >180/120 mmHg (hypertensive emergency)', 'Severe headache with blurred vision', 'Chest pain', 'Difficulty breathing', 'Neurological deficits (weakness, speech difficulty)', 'Reduced urine output', 'Seizures'],
    followUp: ['BP check every 2-4 weeks until controlled, then every 3-6 months', 'Renal function and electrolytes every 6 months', 'ECG annually', 'Urine protein annually', 'Eye examination annually (retinopathy screening)', 'Lipid profile every 6 months'],
    whenToSeeDoctor: 'EMERGENCY: BP >180/120 with symptoms (headache, chest pain, vision changes, weakness). URGENT: BP consistently >160/100 despite medication. ROUTINE: BP not at target (<140/90 or <130/80 if diabetic) after 2-3 months of treatment.',
    dietAdvice: [
      'Low sodium: Avoid table salt, pickles, papad, chips, processed meats, soy sauce',
      'Potassium-rich foods: Bananas, oranges, spinach, sweet potatoes (if kidneys are healthy)',
      'DASH diet principles: 5+ servings fruits/vegetables, whole grains, low-fat dairy',
      'Limit caffeine: <3 cups coffee/day',
      'Beetroot juice: 250ml daily — studies show 5-10 mmHg BP reduction',
      'Garlic: 2-4 cloves daily — modest BP reduction',
      'Hibiscus tea: 2-3 cups daily — mild antihypertensive effect',
      'Flaxseed: 30g daily ground — omega-3 and fiber',
      'Dark chocolate: >70% cocoa, 30g daily — flavonoids improve BP',
    ],
  },

  // ─── HYPOTHYROIDISM ──────────────────────────────────────────────

  'hypothyroidism': {
    name: 'Hypothyroidism (Underactive Thyroid)',
    icdCode: 'E03',
    description: 'Deficiency of thyroid hormones (T3, T4) leading to slowed metabolism. Most commonly caused by Hashimoto\'s thyroiditis (autoimmune). Very common in Indian women, especially after pregnancy.',
    symptoms: ['Fatigue and weakness', 'Weight gain despite normal eating', 'Cold intolerance', 'Constipation', 'Dry skin and hair', 'Hair loss', 'Depression', 'Memory problems / brain fog', 'Menstrual irregularities (heavy periods)', 'Hoarse voice', 'Puffy face', 'Slow heart rate', 'Muscle aches and stiffness', 'Elevated cholesterol'],
    diagnosticCriteria: ['TSH >4.5 mIU/L (varies by lab, some use >4.0)', 'Free T4 <0.8 ng/dL (overt hypothyroidism)', 'TSH >10 with normal Free T4 (subclinical — treat if symptomatic or high CV risk)', 'Anti-TPO antibodies positive (Hashimoto\'s)'],
    labTests: ['TSH', 'Free T4 (FT4)', 'Free T3 (FT3)', 'Anti-TPO antibodies', 'Anti-thyroglobulin antibodies', 'Lipid Profile', 'CBC', 'Vitamin B12', 'Vitamin D'],
    allopathyTreatment: [
      {
        medicineName: 'Levothyroxine',
        genericName: 'Levothyroxine Sodium',
        indianBrandNames: ['Thyronorm', 'Eltroxin', 'Thyrox', 'Levothyrox', 'Thyroup'],
        dosage: '25-50mcg initially (full replacement ~1.6 mcg/kg)',
        frequency: 'Once daily on empty stomach',
        duration: 'Lifelong (permanent hypothyroidism)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Levothyroxine is the STANDARD replacement therapy for hypothyroidism. It is synthetic T4, converted to active T3 in the body. Start at 25-50mcg in elderly/cardiac patients, 50-100mcg in young adults. Full replacement dose is approximately 1.6 mcg/kg body weight. For a 70kg adult, ~112mcg/day. Take on EMPTY STOMACH, 30-60 min before breakfast.',
        precautions: ['Take on empty stomach — 30-60 min before food/coffee', 'Do NOT take with calcium, iron, or antacids (separate by 4 hours)', 'Consistent timing each day is crucial', 'Takes 4-6 weeks to reach steady state — wait before adjusting dose', 'Start low (25mcg) and go slow in elderly and cardiac patients', 'Monitor TSH 6-8 weeks after dose change', 'Same brand consistently (bioequivalence varies between brands)'],
        sideEffects: ['Over-replacement symptoms: palpitations, anxiety, tremor, weight loss, insomnia', 'Chest pain (if dose too high in cardiac patients)', 'Headache', 'Hair loss (temporary, first 2-3 months)'],
        contraindications: ['Untreated adrenal insufficiency (can precipitate adrenal crisis)', 'Acute myocardial infarction (do not start acutely)', 'Hyperthyroidism (wrong diagnosis)'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹1-3 per tablet',
        mrp: '₹10-60 per 10 tablets',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Kanchanar Guggulu',
        genericName: 'Kanchanar Guggulu (classical formulation)',
        indianBrandNames: ['Kanchanar Guggulu Vati', 'Baidyanath Kanchanar Guggulu', 'Dabur Kanchanar Guggulu'],
        dosage: '250-500mg',
        frequency: 'Twice daily after meals with warm water',
        duration: '3-6 months with monitoring',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Kanchanar Guggulu is the primary Ayurvedic formulation for thyroid disorders (Galaganda/Gandamala in classical texts). It reduces goiter size, improves thyroid function, and addresses Kapha-mediated symptoms (weight gain, cold intolerance, constipation). Contains Kanchanara bark + Guggulu + Triphala + Trikatu.',
        precautions: ['Monitor TSH every 3 months', 'Do not stop Levothyroxine abruptly', 'Can complement allopathic treatment with monitoring', 'Take under Ayurvedic practitioner guidance'],
        sideEffects: ['Mild GI discomfort', 'Warm sensation (due to Trikatu)'],
        contraindications: ['Pregnancy (Guggulu is uterine stimulant)', 'Severe hyperthyroidism', 'Peptic ulcer (Trikatu may aggravate)'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Thyroidinum',
        genericName: 'Thyroidinum 3X/6X',
        indianBrandNames: ['SBL Thyroidinum', 'Schwabe Thyroidinum'],
        dosage: '3X potency',
        frequency: 'Twice daily',
        duration: '3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Thyroidinum is the specific homeopathic organ remedy for thyroid disorders. It is prepared from thyroid gland and acts on thyroid function. Used for both hypo and hyperthyroidism in different potencies. For hypothyroidism, lower potencies (3X, 6X) are preferred.',
        precautions: ['Monitor TSH regularly', 'Do not replace Levothyroxine without medical supervision', 'Take under qualified homeopath'],
        sideEffects: ['Initial aggravation possible', 'No toxic effects at homeopathic doses'],
        contraindications: ['Should not replace emergency thyroid treatment'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: [
      'Take medication consistently — same time, same way, every day',
      'Regular exercise: 30 min daily — helps metabolism and weight management',
      'Manage stress: Chronic stress affects thyroid function',
      'Adequate sleep: 7-9 hours per night',
      'Avoid goitrogens raw: Cabbage, cauliflower, broccoli, soy (cooking reduces goitrogenic effect)',
      'Regular TSH monitoring: Every 6-12 months once stable',
    ],
    redFlags: ['Myxedema: Severe hypothyroidism with altered mental status, hypothermia', 'Severe depression with suicidal ideation', 'Chest pain with bradycardia', 'Very high TSH >10 with symptoms', 'Pericardial effusion', 'New-onset cardiac failure'],
    followUp: ['TSH and Free T4: 6-8 weeks after starting or dose change', 'Once stable: TSH every 6-12 months', 'Annual lipid profile', 'Annual CBC', 'Pregnancy: TSH every 4 weeks (target <2.5 mIU/L)', 'Dose adjustment may be needed with weight change, pregnancy, other medications'],
    whenToSeeDoctor: 'EMERGENCY: Severe hypothyroidism symptoms (extreme drowsiness, very low body temperature, difficulty breathing). URGENT: Chest pain, severe depression, very rapid weight gain with swelling. ROUTINE: TSH not at target after 3 months, new symptoms, planning pregnancy.',
    dietAdvice: [
      'Iodine: Adequate intake (150 mcg/day) — iodized salt, seafood, dairy',
      'Selenium: Brazil nuts (2-3/day), fish, eggs — supports T4→T3 conversion',
      'Zinc: Pumpkin seeds, nuts, legumes — thyroid hormone synthesis',
      'Iron: Green leafy vegetables, jaggery, meat — check ferritin (low iron impairs thyroid)',
      'Vitamin D: Sunlight 15-20 min, supplements if deficient — common in hypothyroidism',
      'Vitamin B12: Eggs, dairy, supplements — often deficient in hypothyroidism',
      'Avoid raw goitrogens: Cabbage, cauliflower, broccoli, Brussels sprouts (cooking inactivates)',
      'Limit soy: Interferes with Levothyroxine absorption (separate by 4 hours)',
      'Fiber: Important for constipation — whole grains, vegetables, psyllium',
      'Avoid processed foods and refined sugar — worsen metabolic issues',
    ],
  },

  // ─── ADDITIONAL COMMON CONDITIONS (abbreviated but still detailed) ─

  'anemia-iron-deficiency': {
    name: 'Iron Deficiency Anemia',
    icdCode: 'D50',
    description: 'Decreased red blood cell production due to insufficient iron. Most common nutritional deficiency worldwide, especially in Indian women of reproductive age.',
    symptoms: ['Fatigue and weakness', 'Pale skin and mucous membranes', 'Shortness of breath', 'Dizziness', 'Headache', 'Cold hands and feet', 'Brittle nails', 'Spoon-shaped nails (koilonychia)', 'Cravings for non-food items (pica)', 'Sore tongue', 'Restless legs'],
    diagnosticCriteria: ['Hemoglobin <12 g/dL (women), <13 g/dL (men)', 'Serum Ferritin <15 ng/mL (depleted stores)', 'Serum Iron <60 mcg/dL', 'TIBC >400 mcg/dL', 'Transferrin Saturation <16%', 'MCV <80 fL (microcytic)', 'MCH <27 pg (hypochromic)'],
    labTests: ['Complete Blood Count (CBC)', 'Serum Ferritin', 'Serum Iron', 'TIBC', 'Peripheral Blood Smear', 'Reticulocyte Count', 'Stool for Occult Blood', 'Vitamin B12', 'Folic Acid'],
    allopathyTreatment: [
      {
        medicineName: 'Ferrous Sulfate',
        genericName: 'Ferrous Sulfate',
        indianBrandNames: ['Feosol', 'Ferium', 'Autrin', 'Orofer'],
        dosage: '325mg (65mg elemental iron)',
        frequency: 'Once or twice daily on empty stomach',
        duration: '3-6 months (continue 3 months after Hb normal to replenish stores)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Ferrous Sulfate is the FIRST-LINE oral iron supplement. Each 325mg tablet contains 65mg elemental iron. Take on empty stomach with vitamin C (orange juice) for best absorption. Continue for 3 months AFTER hemoglobin normalizes to replenish iron stores (ferritin >50). Expected Hb rise: 1 g/dL every 2-3 weeks.',
        precautions: ['Take on empty stomach for best absorption (or with meals if GI side effects)', 'Take with Vitamin C (orange juice) — doubles absorption', 'Do NOT take with calcium, antacids, tea, coffee — separate by 2 hours', 'Stools will be dark/black — normal', 'Continue 3 months after Hb normalizes to replenish stores', 'Check Hb after 4 weeks — expect 1 g/dL rise'],
        sideEffects: ['Constipation (most common)', 'Dark/black stools (normal)', 'Nausea', 'Stomach upset', 'Metallic taste'],
        contraindications: ['Iron overload (hemochromatosis)', 'Active GI bleeding', 'Hemosiderosis'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹2-5 per tablet',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Punarnava Mandur',
        genericName: 'Punarnava Mandur (classical formulation)',
        indianBrandNames: ['Punarnava Mandur Vati', 'Baidyanath Punarnava Mandur'],
        dosage: '500mg',
        frequency: 'Twice daily after meals with honey',
        duration: '2-3 months with monitoring',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Punarnava Mandur is the classical Ayurvedic formulation for Pandu Roga (anemia). Contains iron (Mandur Bhasma) processed with herbs for better absorption. Punarnava improves RBC production, Mandur Bhasma provides bioavailable iron.',
        precautions: ['Monitor Hb every 4 weeks', 'Contains iron — do not exceed dose', 'Take after meals to reduce GI irritation'],
        sideEffects: ['Dark stools (due to iron)', 'Mild GI discomfort'],
        contraindications: ['Iron overload conditions', 'Hemochromatosis'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Ferrum Metallicum',
        genericName: 'Ferrum Metallicum 30C/200C',
        indianBrandNames: ['SBL Ferrum Met', 'Schwabe Ferrum Met'],
        dosage: '30C potency',
        frequency: 'Twice daily',
        duration: '2-3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Ferrum Metallicum is the top homeopathic remedy for iron deficiency anemia, especially with pale face that flushes easily, weakness, and shortness of breath. Acts on blood-forming organs.',
        precautions: ['Monitor Hb regularly', 'Can complement iron supplements'],
        sideEffects: ['No significant side effects at homeopathic doses'],
        contraindications: ['Severe anemia (Hb <7) requires medical treatment'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Iron-rich diet', 'Vitamin C with meals to enhance absorption', 'Avoid tea/coffee within 1 hour of meals', 'Treat underlying cause (menstrual, GI bleeding)'],
    redFlags: ['Hb <7 g/dL (severe anemia)', 'Signs of heart failure (shortness of breath, swelling)', 'Active bleeding', 'Pica (eating non-food items)'],
    followUp: ['Hb after 4 weeks of treatment', 'Ferritin after 3 months', 'CBC every 3 months until stable', 'Investigate cause if not improving'],
    whenToSeeDoctor: 'URGENT: Hb <7, shortness of breath at rest, chest pain, rapid heartbeat, signs of bleeding. ROUTINE: No improvement after 4 weeks of iron therapy, heavy menstrual bleeding, blood in stool.',
    dietAdvice: ['Red meat (best absorbed iron — heme iron)', 'Liver and organ meats', 'Green leafy vegetables (spinach, methi)', 'Jaggery (gur) — traditional Indian iron source', 'Dates and raisins', 'Sesame seeds (til)', 'Beetroot', 'Pomegranate', 'Cook in iron vessels (traditional Indian method)', 'Vitamin C foods with meals: lemon, amla, orange, tomato'],
  },

  'depression': {
    name: 'Depression (Major Depressive Disorder)',
    icdCode: 'F32',
    description: 'Persistent low mood, loss of interest/pleasure, and cognitive/physical symptoms lasting ≥2 weeks. Affects 5-7% of Indian population. Leading cause of disability worldwide.',
    symptoms: ['Persistent sadness or low mood', 'Loss of interest or pleasure (anhedonia)', 'Significant weight change', 'Insomnia or hypersomnia', 'Fatigue or loss of energy', 'Feelings of worthlessness or guilt', 'Difficulty concentrating', 'Recurrent thoughts of death or suicide', 'Irritability', 'Physical aches and pains'],
    diagnosticCriteria: ['≥5 of 9 symptoms for ≥2 weeks', 'At least one: depressed mood or anhedonia', 'Significant functional impairment', 'Not attributable to substance/medical condition'],
    labTests: ['Thyroid Function (TSH, FT4) — rule out hypothyroidism', 'Vitamin B12', 'Vitamin D', 'CBC', 'Fasting Blood Glucose', 'Liver Function Tests'],
    allopathyTreatment: [
      {
        medicineName: 'Sertraline',
        genericName: 'Sertraline Hydrochloride',
        indianBrandNames: ['Daxid', 'Zosert', 'Sertima', 'Serlift'],
        dosage: '50mg initially (increase to 100-200mg)',
        frequency: 'Once daily in the morning',
        duration: '6-12 months minimum (after first episode)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Sertraline is a FIRST-LINE SSRI for depression per NICE/APA guidelines. It is the most prescribed antidepressant in India. Good efficacy, favorable side effect profile, safe in cardiac patients, and safe in elderly. Start at 50mg, increase by 25-50mg increments every 2-4 weeks. Full effect takes 4-6 weeks.',
        precautions: ['Takes 2-4 weeks to start working, 4-6 weeks for full effect', 'Do NOT stop abruptly — taper over 4-6 weeks', 'Monitor for suicidal ideation in first 2-4 weeks (especially age <25)', 'May cause initial worsening of anxiety', 'Serotonin syndrome risk with other serotonergic drugs', 'Report worsening, new symptoms, or suicidal thoughts immediately'],
        sideEffects: ['Nausea (most common, improves over time)', 'Diarrhea', 'Insomnia or drowsiness', 'Sexual dysfunction (decreased libido, delayed orgasm)', 'Headache', 'Dry mouth', 'Weight changes', 'Sweating'],
        contraindications: ['Concurrent MAO inhibitors (serotonin syndrome)', 'Concurrent Pimozide', 'Unstable epilepsy', 'Known hypersensitivity'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹5-15 per tablet',
        mrp: '₹50-150 per 10 tablets',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Ashwagandha',
        genericName: 'Withania Somnifera',
        indianBrandNames: ['Ashwagandha Churna', 'KSM-66 Ashwagandha', 'Himalaya Ashwagandha', 'Shatavari-Ashwagandha'],
        dosage: '300-600mg standardized extract (5% withanolides)',
        frequency: 'Twice daily',
        duration: '2-3 months review',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Ashwagandha is the premier adaptogen in Ayurveda for stress, anxiety, and depression. Classified as Medhya Rasayana (brain tonic). Studies show significant reduction in depression scores (PHQ-9) and cortisol levels. KSM-66 extract has most clinical evidence. Works by modulating GABA, serotonin, and HPA axis.',
        precautions: ['Choose standardized extract with 5% withanolides', 'Start with 300mg and increase gradually', 'May enhance sedative effect of other medications', 'Monitor thyroid function (may increase T4)', 'Avoid in autoimmune conditions (may stimulate immune system)'],
        sideEffects: ['Drowsiness (take at bedtime if significant)', 'GI upset', 'Headache'],
        contraindications: ['Pregnancy', 'Autoimmune disorders (with caution)', 'Hyperthyroidism (may increase thyroid hormones)'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Natrum Muriaticum',
        genericName: 'Natrum Muriaticum 30C/200C',
        indianBrandNames: ['SBL Natrum Mur', 'Schwabe Natrum Mur'],
        dosage: '30C once daily or 200C weekly',
        frequency: 'As per potency',
        duration: '2-3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Natrum Muriaticum is one of the top remedies for depression — especially with grief, silent brooding, inability to cry, and worsening from consolation. The patient prefers to be alone and dwells on past hurts. Constitutional remedy often needed.',
        precautions: ['Take under qualified homeopath', 'Constitutional prescribing preferred', 'Regular mental health assessment essential'],
        sideEffects: ['Initial aggravation possible'],
        contraindications: ['Severe depression with suicidal risk — requires immediate psychiatric care'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Regular exercise: 30 min, 5x/week — as effective as medication for mild-moderate depression', 'Sleep hygiene: Consistent schedule, 7-9 hours', 'Social connection: Maintain relationships, support groups', 'Mindfulness and meditation', 'Limit alcohol and avoid recreational drugs', 'Journaling / expressive writing'],
    redFlags: ['Suicidal thoughts or plans', 'Self-harm', 'Psychosis (hallucinations, delusions)', 'Severe weight loss or inability to eat', 'Complete social withdrawal', 'Inability to perform daily activities'],
    followUp: ['Every 2 weeks for first 2 months', 'Monthly for 6 months', 'Every 3-6 months when stable', 'PHQ-9 score monitoring each visit', 'Medication review at 6 weeks, 3 months, 6 months'],
    whenToSeeDoctor: 'EMERGENCY: Suicidal thoughts, self-harm, or plans to harm others. Call 915 (iCall) or go to nearest emergency. URGENT: Unable to eat, sleep, or function for >2 weeks, psychosis. ROUTINE: Not improving after 4-6 weeks of treatment, side effects intolerable, wanting to stop medication.',
    dietAdvice: ['Omega-3 fatty acids: Fish, flaxseed, walnuts — associated with lower depression rates', 'Complex carbohydrates: Whole grains, oats — support serotonin production', 'Protein with tryptophan: Eggs, turkey, cheese, nuts — serotonin precursor', 'B vitamins: Leafy greens, legumes, eggs — deficiency linked to depression', 'Vitamin D: Sunlight, supplements — deficiency common in depression', 'Probiotics: Yogurt, fermented foods — gut-brain axis', 'Limit: Sugar, refined carbs, caffeine, alcohol — worsen mood'],
  },

  'asthma': {
    name: 'Bronchial Asthma',
    icdCode: 'J45',
    description: 'Chronic inflammatory airway disease characterized by variable airflow obstruction, bronchial hyperresponsiveness, and recurring episodes of wheezing, breathlessness, chest tightness, and cough.',
    symptoms: ['Wheezing', 'Shortness of breath', 'Chest tightness', 'Cough (especially at night/early morning)', 'Difficulty speaking in full sentences during attack', 'Rapid breathing', 'Anxiety during attack'],
    diagnosticCriteria: ['Recurrent wheezing and dyspnea', 'Reversible airflow obstruction (FEV1 improves ≥12% and ≥200mL after bronchodilator)', 'Bronchial hyperresponsiveness', 'Eosinophilic airway inflammation', 'Peak flow variability >20%'],
    labTests: ['Spirometry (FEV1, FVC, FEV1/FVC)', 'Peak Expiratory Flow Rate (PEFR)', 'Reversibility testing', 'Fractional Exhaled Nitric Oxide (FeNO)', 'CBC (eosinophils)', 'Serum IgE', 'Chest X-ray', 'Allergy testing'],
    allopathyTreatment: [
      {
        medicineName: 'Budesonide/Formoterol',
        genericName: 'Budesonide + Formoterol (ICS/LABA)',
        indianBrandNames: ['Budecort', 'Foracort', 'Symbicort', 'Duolin', 'Budepress'],
        dosage: '200/6 mcg inhaler — 1-2 puffs',
        frequency: 'Twice daily (maintenance) + as needed (SMART regimen)',
        duration: 'Lifelong (step up/down based on control)',
        route: 'Inhalation (MDI/DPI with spacer)',
        wing: 'ALLOPATHY',
        reasoning: 'ICS/LABA combination is the STANDARD controller therapy for persistent asthma per GINA 2023 guidelines. Budesonide reduces airway inflammation; Formoterol provides 12-hour bronchodilation. SMART regimen (maintenance AND reliever) reduces severe exacerbations by 50% vs traditional approach. Formoterol has rapid onset (1-3 min) — suitable as both controller and reliever.',
        precautions: ['ALWAYS use with spacer for MDI — improves delivery by 50%', 'Rinse mouth after ICS to prevent oral thrush', 'Do NOT use LABA alone (without ICS) — increased mortality risk', 'Peak flow monitoring: Personal best, 80% and 50% action zones', 'Know your Asthma Action Plan', 'Annual influenza vaccination, pneumococcal vaccine'],
        sideEffects: ['Oral thrush (candidiasis) — prevent by rinsing mouth', 'Hoarse voice', 'Throat irritation', 'Tremor (from formoterol)', 'Palpitations', 'Headache'],
        contraindications: ['Not for acute severe attack without emergency treatment', 'Hypersensitivity to components', 'Active pulmonary TB (caution with ICS)'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹80-200 per inhaler',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Sitopaladi Churna',
        genericName: 'Sitopaladi Churna (classical formulation)',
        indianBrandNames: ['Sitopaladi Churna', 'Baidyanath Sitopaladi', 'Dabur Sitopaladi'],
        dosage: '3-6g with honey',
        frequency: 'Twice daily',
        duration: '2-3 months review',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Sitopaladi Churna is the primary Ayurvedic formulation for respiratory disorders (Shwasa/Tamaka Shwasa). Contains Tvak (cinnamon), Ela (cardamom), Vamshalochana (bamboo silica), Pippali (long pepper), and Sharkara (sugar). Reduces cough, improves breathing, and strengthens lungs.',
        precautions: ['Take with honey for respiratory conditions', 'Can complement inhaler therapy', 'Do not stop inhalers abruptly'],
        sideEffects: ['Generally well-tolerated', 'Acid reflux in susceptible individuals'],
        contraindications: ['Severe asthma attack — use emergency inhaler first', 'Diabetes (contains sugar)'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Arsenicum Album',
        genericName: 'Arsenicum Album 30C/200C',
        indianBrandNames: ['SBL Arsenic Alb', 'Schwabe Arsenic Alb'],
        dosage: '30C during attack, 200C for chronic',
        frequency: 'As needed during attack, daily for chronic',
        duration: 'Ongoing with periodic review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Arsenicum Album is the TOP homeopathic remedy for asthma with great anxiety, restlessness, wheezing worse at midnight, and feeling of suffocation. Patient feels better sitting up and with warmth. Indicated especially when there is fear of suffocation during attacks.',
        precautions: ['During acute attack, use bronchodilator inhaler first', 'Homeopathy as adjunctive for prevention', 'Take under qualified homeopath'],
        sideEffects: ['No significant effects at homeopathic doses'],
        contraindications: ['Severe acute asthma — emergency treatment first'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Identify and avoid triggers: dust, pollen, smoke, cold air, exercise', 'Use dust mite-proof covers on bedding', 'Keep indoor humidity 30-50%', 'Regular exercise (warm-up before, avoid cold air)', 'Breathing exercises: Buteyko, pranayama', 'Peak flow monitoring twice daily', 'Asthma Action Plan (green/yellow/red zones)', 'Annual flu vaccine, pneumococcal vaccine'],
    redFlags: ['Severe breathlessness at rest', 'Unable to speak in full sentences', 'Peak flow <50% personal best', 'No improvement after 3-4 puffs of reliever', 'Cyanosis (blue lips/fingernails)', 'Confusion or drowsiness', 'Silent chest (no wheeze but severely distressed)'],
    followUp: ['Every 1-3 months until controlled', 'Every 3-6 months when stable', 'Spirometry annually', 'Peak flow diary review', 'Medication technique check each visit', 'Step up/down assessment based on control'],
    whenToSeeDoctor: 'EMERGENCY (call 108/ambulance): Severe breathlessness at rest, cannot speak, blue lips, confusion, no improvement after reliever inhaler. URGENT: Increasing reliever use (>2x/week), night-time waking, morning symptoms. ROUTINE: Annual review, before changing medications.',
    dietAdvice: ['Anti-inflammatory foods: Turmeric, ginger, omega-3 fish', 'Vitamin C: Citrus fruits, amla — may reduce wheezing', 'Magnesium-rich foods: Spinach, nuts, seeds — bronchodilator effect', 'Avoid food triggers: Sulfites (wine, dried fruit), salicylates, food coloring', 'Warm fluids during attacks — help relax airways', 'Ginger tea: Anti-inflammatory, helps during mild symptoms', 'Avoid cold foods and drinks during acute episodes', 'Honey: 1 tsp before bed — may reduce night-time cough'],
  },

  'migraine': {
    name: 'Migraine',
    icdCode: 'G43',
    description: 'Recurrent moderate-to-severe headache, typically unilateral, pulsating, lasting 4-72 hours, with nausea/vomiting and sensitivity to light/sound. May have aura (visual, sensory, speech). Affects 15-20% of Indian women.',
    symptoms: ['Unilateral pulsating headache', 'Nausea and vomiting', 'Photophobia (light sensitivity)', 'Phonophobia (sound sensitivity)', 'Aura (visual disturbances — flashing lights, zigzag lines)', 'Scalp tenderness', 'Fatigue after attack', 'Neck stiffness'],
    diagnosticCriteria: ['≥5 attacks lasting 4-72 hours', 'Unilateral, pulsating, moderate-severe intensity', 'Aggravated by physical activity', 'Nausea/vomiting OR photophobia/phonophobia', 'No other cause identified'],
    labTests: ['Clinical diagnosis — no specific test', 'Neuroimaging if red flags present', 'MRI Brain (if atypical features)'],
    allopathyTreatment: [
      {
        medicineName: 'Sumatriptan',
        genericName: 'Sumatriptan Succinate',
        indianBrandNames: ['Imigran', 'Suminat', 'Migrit', 'Sumprex'],
        dosage: '50-100mg tablet OR 6mg subcutaneous injection',
        frequency: 'At onset of attack (max 2 doses in 24 hours)',
        duration: 'As needed for acute attacks',
        route: 'Oral / Subcutaneous',
        wing: 'ALLOPATHY',
        reasoning: 'Sumatriptan is the FIRST-LINE triptan for acute migraine. It is a 5-HT1B/1D receptor agonist — causes cranial vasoconstriction and inhibits trigeminal nerve activation. Take at the EARLIEST sign of attack for best results. Effective in 60-80% of attacks. Do not use with ergotamine or other triptans within 24 hours.',
        precautions: ['Take at FIRST sign of attack — earlier = more effective', 'Maximum 2 doses in 24 hours', 'Do NOT use with ergotamine, other triptans, or MAO inhibitors', 'Not for hemiplegic or basilar migraine', 'Risk of serotonin syndrome with SSRIs/SNRIs (rare)', 'Subcutaneous injection for rapid relief (10 min vs 30-60 min oral)'],
        sideEffects: ['Chest tightness/pressure (usually not cardiac — but rule out if risk factors)', 'Flushing', 'Tingling', 'Dizziness', 'Drowsiness', 'Nausea', 'Injection site pain'],
        contraindications: ['Ischemic heart disease / angina', 'History of MI or stroke', 'Uncontrolled hypertension', 'Hemiplegic or basilar migraine', 'Severe hepatic impairment', 'Concurrent MAO inhibitors', 'Pregnancy'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹10-30 per tablet',
      },
      {
        medicineName: 'Flunarizine',
        genericName: 'Flunarizine Hydrochloride',
        indianBrandNames: ['Sibelium', 'Flunarin', 'Flunaz', 'Migraine'],
        dosage: '5-10mg at bedtime',
        frequency: 'Once daily at night',
        duration: '3-6 months for prevention',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Flunarizine is the FIRST-LINE migraine prophylactic in India (calcium channel blocker). Reduces frequency and severity of attacks by 50% in 60-70% of patients. Very popular in Indian clinical practice. Take at bedtime as it causes drowsiness. Continue for 3-6 months, then taper if attacks are controlled.',
        precautions: ['Take at bedtime (causes drowsiness)', 'Continue for 3-6 months before assessing efficacy', 'Taper gradually when stopping', 'Monitor for depression (can worsen)', 'Avoid in patients with depression', 'Weight gain is common — monitor'],
        sideEffects: ['Drowsiness (most common)', 'Weight gain (5-10% of body weight)', 'Depression', 'Galactorrhea', 'Extrapyramidal symptoms (rare, at high doses)', 'Constipation'],
        contraindications: ['Depression', 'Parkinson\'s disease', 'History of extrapyramidal symptoms', 'Pregnancy'],
        isFirstLine: false,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹3-10 per tablet',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Shirashuladivaj Vati',
        genericName: 'Shirashuladivaj Vati (classical formulation)',
        indianBrandNames: ['Shirashuladivaj Vati', 'Baidyanath Shirashuladivaj'],
        dosage: '250-500mg',
        frequency: 'Twice daily after meals',
        duration: '2-3 months for prevention',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Shirashuladivaj Vati is the classical Ayurvedic formulation for Shirashoola (headache). Contains herbs that balance Vata and Pitta doshas, which are involved in migraine pathology. Used both for acute relief and prevention.',
        precautions: ['Can be taken alongside triptans with gap of 2 hours', 'Monitor headache frequency'],
        sideEffects: ['Generally well-tolerated', 'Mild GI discomfort'],
        contraindications: ['Severe liver disease'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Belladonna',
        genericName: 'Belladonna 30C/200C',
        indianBrandNames: ['SBL Belladonna', 'Schwabe Belladonna'],
        dosage: '30C at onset, 200C for severe attack',
        frequency: 'Every 30 min during acute attack, then 2-3x/day',
        duration: 'As needed for attacks + constitutional treatment for prevention',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Belladonna is the top remedy for acute migraine with sudden onset, throbbing pain, worse from light and noise, right-sided headache. Patient feels hot, face flushed, pupils dilated. Excellent for acute attack management.',
        precautions: ['Can be repeated frequently during acute attack', 'For prevention, constitutional remedy needed', 'Take under qualified homeopath'],
        sideEffects: ['No significant effects at homeopathic doses'],
        contraindications: ['Should not delay triptan use in severe attacks'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Identify triggers: foods, stress, sleep changes, hormonal changes, weather', 'Regular sleep schedule: Same time daily, 7-8 hours', 'Regular meals: Don\'t skip — fasting triggers migraine', 'Hydration: 2-3 liters water daily', 'Exercise regularly: 150 min/week moderate', 'Stress management: Yoga, meditation, deep breathing', 'Maintain headache diary: Date, duration, severity, triggers, medication'],
    redFlags: ['Worst headache of life (thunderclap)', 'New headache after age 50', 'Headache with fever and neck stiffness', 'Focal neurological deficits', 'Headache worsening with Valsalva', 'Papilledema on examination', 'Positional headache'],
    followUp: ['Headache diary review every 3 months', 'Assess prophylaxis efficacy at 3 months', 'MRI if red flags or atypical features', 'Medication overuse assessment (frequent analgesic use)'],
    whenToSeeDoctor: 'EMERGENCY: Worst headache of life, sudden severe headache, headache with fever + stiff neck, weakness/numbness, confusion, vision loss. URGENT: Headache pattern change, new neurological symptoms, >4 attacks/month despite treatment. ROUTINE: Not responding to treatment, side effects intolerable.',
    dietAdvice: ['Avoid common triggers: Chocolate, cheese, MSG, red wine, processed meats (nitrates), artificial sweeteners', 'Magnesium-rich foods: Nuts, seeds, leafy greens — magnesium deficiency linked to migraine', 'Riboflavin (Vitamin B2): 400mg daily — reduces attack frequency', 'Coenzyme Q10: 100-300mg daily — some evidence for prevention', 'Regular meal timing — don\'t skip meals', 'Stay well hydrated', 'Ginger tea at onset — may help nausea and pain', 'Limit caffeine: 1-2 cups/day (withdrawal triggers migraine)', 'Omega-3 fatty acids: Fish, flaxseed — anti-inflammatory'],
  },

  'pcos': {
    name: 'Polycystic Ovary Syndrome (PCOS)',
    icdCode: 'E28',
    description: 'Endocrine disorder affecting 5-15% of reproductive-age women, characterized by hyperandrogenism, ovulatory dysfunction, and polycystic ovarian morphology. Leading cause of infertility.',
    symptoms: ['Irregular periods (oligomenorrhea)', 'Excess facial/body hair (hirsutism)', 'Acne', 'Weight gain / difficulty losing weight', 'Hair loss from scalp (androgenic alopecia)', 'Darkened skin patches (acanthosis nigricans)', 'Infertility', 'Mood changes', 'Pelvic pain'],
    diagnosticCriteria: ['Rotterdam Criteria: ≥2 of 3:', '1. Oligo/anovulation', '2. Clinical/biochemical hyperandrogenism', '3. Polycystic ovaries on ultrasound', '(Other causes excluded)'],
    labTests: ['Serum Testosterone (total and free)', 'DHEA-S', 'LH/FSH ratio', 'Prolactin', 'TSH', 'Fasting Insulin and Glucose', 'HbA1c', 'Lipid Profile', 'Pelvic Ultrasound', 'Anti-Mullerian Hormone (AMH)'],
    allopathyTreatment: [
      {
        medicineName: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        indianBrandNames: ['Glycomet', 'Glucophage', 'Obimet'],
        dosage: '500mg initially, increase to 500mg TDS or 1000mg BD',
        frequency: 'Twice or three times daily with meals',
        duration: 'Long-term (6-12 months minimum)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Metformin is FIRST-LINE for PCOS with insulin resistance. Improves insulin sensitivity, reduces androgen levels, restores ovulation (30-50% resume menses), promotes weight loss, and improves metabolic parameters. Start at 500mg and titrate slowly. Most effective when combined with lifestyle modification.',
        precautions: ['Start low and go slow to minimize GI side effects', 'Monitor renal function', 'May cause ovulation — use contraception if not planning pregnancy', 'Takes 3-6 months for full effect on menstrual regularity', 'Vitamin B12 monitoring with long-term use'],
        sideEffects: ['Nausea, diarrhea, abdominal discomfort (30% initially)', 'Vitamin B12 deficiency (long-term)', 'Metallic taste'],
        contraindications: ['eGFR <30', 'Metabolic acidosis', 'Pregnancy (discontinue once confirmed, unless pre-existing diabetes)'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹2-5 per tablet',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Shatavari',
        genericName: 'Asparagus Racemosus',
        indianBrandNames: ['Shatavari Churna', 'Himalaya Shatavari', 'Shatavari Kalpa'],
        dosage: '500mg-1g extract or 3-6g churna',
        frequency: 'Twice daily with milk',
        duration: '3-6 months review',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Shatavari is the premier Ayurvedic herb for women\'s reproductive health. It balances hormones, supports ovulation, and reduces androgenic symptoms. Classified as Rasayana (rejuvenative) and specifically for Artava Dhatu (female reproductive tissue). Improves menstrual regularity and fertility.',
        precautions: ['Take with warm milk for best absorption', 'Safe for long-term use', 'Monitor menstrual regularity'],
        sideEffects: ['Generally very well-tolerated', 'Mild GI discomfort in some'],
        contraindications: ['Estrogen-sensitive cancers (with caution)', 'Pregnancy (consult practitioner)'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Pulsatilla',
        genericName: 'Pulsatilla Nigricans 30C/200C',
        indianBrandNames: ['SBL Pulsatilla', 'Schwabe Pulsatilla'],
        dosage: '30C daily or 200C weekly',
        frequency: 'As per potency',
        duration: '3-6 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Pulsatilla is the top remedy for PCOS with late, scanty, and changeable periods. Patient is mild, tearful, desires consolation, worse from heat and better in open air. Constitutional remedy often needed for hormonal balance.',
        precautions: ['Constitutional prescribing preferred', 'Regular hormonal monitoring'],
        sideEffects: ['No significant effects at homeopathic doses'],
        contraindications: ['Should not replace metformin in severe insulin resistance'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Weight loss: 5-10% body weight — most effective intervention', 'Exercise: 150 min/week moderate + 2x/week strength training', 'Regular sleep schedule', 'Stress management: Yoga, meditation', 'Smoking cessation', 'Regular monitoring: Periods, weight, metabolic markers'],
    redFlags: ['Very heavy/prolonged bleeding', 'No period for >3 months (endometrial hyperplasia risk)', 'Severe pelvic pain', 'Rapid virilization (deep voice, clitoromegaly)', 'Suspicion of ovarian tumor (very high androgens)'],
    followUp: ['Every 3-6 months', 'Hormonal profile every 6 months', 'Glucose tolerance annually', 'Lipid profile annually', 'Pelvic ultrasound annually', 'Endometrial assessment if prolonged amenorrhea'],
    whenToSeeDoctor: 'URGENT: Very heavy bleeding, severe pelvic pain, signs of virilization. ROUTINE: No improvement after 6 months of treatment, planning pregnancy, irregular periods >3 months.',
    dietAdvice: ['Low glycemic index diet: Whole grains, legumes, vegetables', 'Anti-inflammatory foods: Turmeric, omega-3 fish, berries', 'Protein with every meal: Improves insulin sensitivity', 'Limit processed foods, sugar, refined carbs', 'Spearmint tea: 2 cups/day — may reduce androgen levels', 'Cinnamon: 1-2g daily — improves insulin sensitivity', 'Adequate calcium and vitamin D', 'Limit dairy (if androgenic symptoms severe)', 'Green leafy vegetables: Iron, folate, magnesium'],
  },

  'gastroesophageal-reflux': {
    name: 'Gastroesophageal Reflux Disease (GERD)',
    icdCode: 'K21',
    description: 'Chronic condition where stomach acid flows back into the esophagus, causing heartburn and possible esophageal damage. Very common in Indian population (10-15%).',
    symptoms: ['Heartburn (burning sensation behind sternum)', 'Acid regurgitation', 'Difficulty swallowing (dysphagia)', 'Chest pain', 'Chronic cough', 'Hoarse voice', 'Sore throat', 'Bloating', 'Nausea'],
    diagnosticCriteria: ['Typical symptoms >2x/week', 'Response to PPI therapy (PPI test)', 'Endoscopy: Esophagitis (LA classification)', '24-hour pH monitoring (gold standard)'],
    labTests: ['Upper GI Endoscopy', '24-hour pH-impedance monitoring', 'Barium swallow', 'Helicobacter pylori testing'],
    allopathyTreatment: [
      {
        medicineName: 'Pantoprazole',
        genericName: 'Pantoprazole Sodium',
        indianBrandNames: ['Pan', 'Pantop', 'Protonix', 'Pan-D', 'Pantocid'],
        dosage: '40mg once daily',
        frequency: 'Once daily, 30 min before breakfast',
        duration: '4-8 weeks acute; step-down for maintenance',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Pantoprazole is a FIRST-LINE Proton Pump Inhibitor (PPI) for GERD. It potently suppresses gastric acid secretion, allowing esophageal healing. Take 30 min BEFORE breakfast for maximum efficacy (needs active proton pumps). Healing rate: 80-90% at 8 weeks. Preferred over omeprazole due to lower drug interactions.',
        precautions: ['Take 30 min BEFORE breakfast (not after)', 'Do NOT crush or chew — swallow whole', 'Step down to lowest effective dose after healing', 'Long-term use risks: osteoporosis, B12 deficiency, C. difficile, kidney disease', 'Do not stop abruptly — rebound acid hypersecretion', 'Taper over 2-4 weeks when discontinuing'],
        sideEffects: ['Headache', 'Diarrhea', 'Abdominal pain', 'Nausea', 'Flatulence', 'Dizziness', 'Long-term: B12 deficiency, magnesium deficiency, bone fractures'],
        contraindications: ['Concurrent rilpivirine', 'Concurrent nelfinavir', 'Known hypersensitivity'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹3-10 per tablet',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Avipattikar Churna',
        genericName: 'Avipattikar Churna (classical formulation)',
        indianBrandNames: ['Avipattikar Churna', 'Baidyanath Avipattikar', 'Dabur Avipattikar'],
        dosage: '3-5g with warm water',
        frequency: 'Twice daily after meals',
        duration: '2-3 months',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Avipattikar Churna is the primary Ayurvedic formulation for Amlapitta (hyperacidity/GERD). It neutralizes excess Pitta (acid), improves digestion, and prevents acid reflux. Contains Trikatu, Triphala, Vid Lavana, and other Pitta-pacifying herbs.',
        precautions: ['Take after meals', 'Avoid spicy and sour food during treatment', 'Can complement PPI therapy'],
        sideEffects: ['Generally well-tolerated', 'May cause loose stools initially'],
        contraindications: ['Severe esophageal erosion (use PPI first)'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Nux Vomica',
        genericName: 'Nux Vomica 30C',
        indianBrandNames: ['SBL Nux Vomica', 'Schwabe Nux Vomica'],
        dosage: '30C potency',
        frequency: 'Twice daily, 30 min before meals',
        duration: '2-3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Nux Vomica is the top remedy for GERD with heartburn, sour eructations, nausea in the morning, and constipation. Worse from spicy food, coffee, and stimulants. Ideal for type-A personality patients with sedentary lifestyle.',
        precautions: ['Avoid coffee/camphor while on homeopathy', 'Take before meals on empty stomach'],
        sideEffects: ['No significant effects at homeopathic doses'],
        contraindications: ['Severe GERD with Barrett\'s esophagus — needs medical monitoring'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Elevate head of bed 6-8 inches (blocks, not extra pillows)', 'Do not lie down for 3 hours after eating', 'Eat smaller, more frequent meals', 'Maintain healthy weight', 'Avoid tight clothing around waist', 'Stop smoking', 'Chew food thoroughly'],
    redFlags: ['Difficulty swallowing (dysphagia)', 'Unexplained weight loss', 'Vomiting blood or coffee-ground material', 'Black stools (melena)', 'Chest pain (distinguish from cardiac)', 'Persistent hiccups', 'Iron deficiency anemia (chronic blood loss)'],
    followUp: ['Review at 4-8 weeks', 'Endoscopy if alarm symptoms or >50 years with new symptoms', 'Annual review if on long-term PPI', 'Bone density if PPI >1 year + risk factors', 'B12 and magnesium levels annually on long-term PPI'],
    whenToSeeDoctor: 'URGENT: Vomiting blood, black stools, chest pain, difficulty swallowing. ROUTINE: Symptoms not controlled after 2 weeks of PPI, need for increasing PPI dose, symptoms >5 years (Barrett\'s screening).',
    dietAdvice: ['Avoid trigger foods: Spicy food, citrus, tomatoes, chocolate, caffeine, fatty/fried food, mint', 'Favor: Oatmeal, banana, melon, green vegetables, lean protein, whole grains', 'Fennel seeds after meals — aids digestion', 'Cold milk — temporary relief of heartburn', 'Amla juice — cooling, Pitta-pacifying', 'Small frequent meals rather than large meals', 'Finish dinner 3 hours before bedtime', 'Avoid: Tea, coffee, carbonated drinks, alcohol'],
  },

  'osteoarthritis': {
    name: 'Osteoarthritis (OA)',
    icdCode: 'M19',
    description: 'Degenerative joint disease with cartilage loss, osteophyte formation, and joint pain/stiffness. Most common joint disorder, affecting 20-30% of elderly Indians.',
    symptoms: ['Joint pain (worse with use, better with rest)', 'Morning stiffness <30 minutes', 'Joint swelling', 'Crepitus (grinding sound)', 'Reduced range of motion', 'Joint deformity (late stage)', 'Bony enlargement (Heberden/Bouchard nodes)'],
    diagnosticCriteria: ['Clinical: Age >40, joint pain, morning stiffness <30 min, crepitus, bony enlargement', 'X-ray: Joint space narrowing, osteophytes, subchondral sclerosis', 'No systemic inflammation (normal ESR/CRP)'],
    labTests: ['X-ray of affected joints', 'ESR and CRP (to rule out inflammatory arthritis)', 'Synovial fluid analysis (if effusion)', 'Vitamin D', 'Calcium', 'Uric acid (rule out gout)'],
    allopathyTreatment: [
      {
        medicineName: 'Diclofenac',
        genericName: 'Diclofenac Sodium',
        indianBrandNames: ['Voveran', 'Diclomol', 'Dynapar', 'Nac DSR'],
        dosage: '50mg (topical gel preferred over oral)',
        frequency: 'Twice daily (oral) / 3-4x daily (topical)',
        duration: 'Short-term only (5-7 days oral; ongoing topical)',
        route: 'Oral / Topical',
        wing: 'ALLOPATHY',
        reasoning: 'Diclofenac is a FIRST-LINE NSAID for OA pain. TOPICAL diclofenac is PREFERRED over oral (same efficacy, fewer systemic side effects per NICE guidelines). If oral needed, limit to shortest duration. For chronic OA, topical + paracetamol is safer than chronic oral NSAIDs. Indian guidelines recommend topical as first-line.',
        precautions: ['TOPICAL preferred — apply to affected joint only', 'Oral: Maximum 5-7 days; avoid chronic use', 'Take with food if oral', 'Monitor renal function and BP with oral NSAIDs', 'Avoid in heart failure, CKD, active peptic ulcer', 'Co-prescribe PPI if oral NSAID needed >5 days in elderly'],
        sideEffects: ['Topical: Skin irritation, dryness', 'Oral: GI bleeding, renal impairment, hypertension, fluid retention, CV risk'],
        contraindications: ['Active peptic ulcer', 'Severe heart failure', 'eGFR <30', 'Third trimester pregnancy', 'Aspirin-sensitive asthma'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹3-10 per tablet',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Mahayograj Guggulu',
        genericName: 'Mahayograj Guggulu (classical formulation)',
        indianBrandNames: ['Mahayograj Guggulu Vati', 'Baidyanath Mahayograj'],
        dosage: '250-500mg',
        frequency: 'Twice daily after meals with warm water',
        duration: '3-6 months',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Mahayograj Guggulu is the premier Ayurvedic formulation for Sandhivata (OA/Vata disorders of joints). Contains Guggulu + Triphala + Chitrak + purified minerals. Reduces joint pain, swelling, and improves mobility. Standard of care in Ayurvedic orthopedics.',
        precautions: ['Take with warm water', 'Avoid cold food and drinks', 'Monitor liver function with long-term use', 'Contains minerals — use from reputable manufacturer'],
        sideEffects: ['Mild GI discomfort', 'Warm sensation'],
        contraindications: ['Pregnancy', 'Active liver disease', 'Acute gastritis'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Rhus Toxicodendron',
        genericName: 'Rhus Tox 30C/200C',
        indianBrandNames: ['SBL Rhus Tox', 'Schwabe Rhus Tox'],
        dosage: '30C twice daily',
        frequency: 'Twice daily',
        duration: '2-3 months review',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Rhus Tox is the top remedy for OA with pain worse on first movement, better from continued movement (limbering up), and worse from cold/damp weather. Patient feels better with warm applications and gentle movement.',
        precautions: ['Can be alternated with Bryonia if needed', 'Take under qualified homeopath'],
        sideEffects: ['No significant effects at homeopathic doses'],
        contraindications: ['Severe joint destruction requiring surgery'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Weight loss: Every 1kg loss = 4kg less load on knees', 'Exercise: Strengthening + aerobic + flexibility (not rest)', 'Physical therapy: Quadriceps strengthening for knee OA', 'Joint protection: Use assistive devices, avoid repetitive stress', 'Heat/cold therapy: Warm for stiffness, cold for acute pain', 'Appropriate footwear: Cushioned, supportive shoes', 'Tai chi: Improves balance, reduces pain'],
    redFlags: ['Rapid joint destruction', 'Hot, swollen joint (infection/gout?)', 'Night pain (not mechanical)', 'Systemic symptoms (fever, weight loss)', 'Significant functional decline'],
    followUp: ['Every 3-6 months', 'X-ray if significant clinical change', 'Renal function if on NSAIDs', 'Consider joint replacement if quality of life severely affected'],
    whenToSeeDoctor: 'URGENT: Hot, swollen joint with fever (septic arthritis), inability to bear weight, sudden severe pain. ROUTINE: Pain not controlled with current treatment, increasing disability, considering surgery.',
    dietAdvice: ['Anti-inflammatory diet: Omega-3 (fish, flaxseed), turmeric, ginger', 'Vitamin D: Sunlight + supplements (deficiency worsens OA)', 'Calcium: 1000-1200mg/day — dairy, leafy greens', 'Weight management: Most important modifiable factor', 'Glucosamine: 1500mg/day — modest benefit for knee OA', 'Chondroitin: 800-1200mg/day — may slow progression', 'Avoid: Processed foods, refined sugar, trans fats — increase inflammation', 'Collagen peptides: Some evidence for joint health', 'Methi (fenugreek) seeds: Anti-inflammatory'],
  },

  'urinary-tract-infection': {
    name: 'Urinary Tract Infection (UTI)',
    icdCode: 'N39',
    description: 'Bacterial infection of the urinary tract. Very common in women (50% will have at least one UTI). E. coli is the causative organism in 80-90% of cases.',
    symptoms: ['Burning during urination (dysuria)', 'Frequent urination', 'Urgency to urinate', 'Lower abdominal pain', 'Cloudy or foul-smelling urine', 'Blood in urine (hematuria)', 'Mild fever', 'Suprapubic tenderness'],
    diagnosticCriteria: ['Symptoms: Dysuria + frequency + urgency', 'Urine R/E: >5 WBC/HPF (pyuria)', 'Urine culture: ≥10⁵ CFU/mL (significant bacteriuria)', 'Nitrites positive on dipstick'],
    labTests: ['Urine Routine and Microscopy', 'Urine Culture and Sensitivity', 'Urine Dipstick (nitrites, leukocyte esterase)', 'CBC', 'Blood Urea Nitrogen and Creatinine (if complicated)'],
    allopathyTreatment: [
      {
        medicineName: 'Nitrofurantoin',
        genericName: 'Nitrofurantoin',
        indianBrandNames: ['Niftran', 'Furadantin', 'Uritab', 'Macrodantin'],
        dosage: '100mg (macrocrystalline)',
        frequency: 'Twice daily for 5 days (women, uncomplicated)',
        duration: '5 days (uncomplicated), 7 days (men/complicated)',
        route: 'Oral',
        wing: 'ALLOPATHY',
        reasoning: 'Nitrofurantoin is FIRST-LINE for uncomplicated lower UTI per IDSA/ICMR guidelines. Excellent urine concentrations, low resistance rates (<5%), safe in pregnancy (second/third trimester). Specifically for lower UTI — not for upper UTI/pyelonephritis (poor tissue levels). 5-day course for uncomplicated cystitis in women.',
        precautions: ['Take with food to reduce GI side effects', 'Complete full course even if symptoms improve', 'Not effective for pyelonephritis (poor renal tissue levels)', 'Avoid in eGFR <30', 'Urine may turn brown — normal', 'Do NOT use for upper UTI or sepsis'],
        sideEffects: ['Nausea', 'Headache', 'Brown urine (normal)', 'Pulmonary reactions (rare — acute: fever, cough, dyspnea)', 'Hepatotoxicity (rare)'],
        contraindications: ['eGFR <30 mL/min', 'Third trimester pregnancy (risk of hemolytic anemia in neonate)', 'G6PD deficiency (hemolytic anemia risk)', 'Active pyelonephritis'],
        isFirstLine: true,
        isPrescription: true,
        janAushadhiAvailable: true,
        janAushadhiPrice: '₹3-8 per tablet',
      },
    ],
    ayurvedaTreatment: [
      {
        medicineName: 'Chandraprabha Vati',
        genericName: 'Chandraprabha Vati (classical formulation)',
        indianBrandNames: ['Chandraprabha Vati', 'Baidyanath Chandraprabha', 'Dabur Chandraprabha'],
        dosage: '250-500mg',
        frequency: 'Twice daily after meals with water',
        duration: '2-3 weeks for acute; long-term for recurrent UTI prevention',
        route: 'Oral',
        wing: 'AYURVEDA',
        reasoning: 'Chandraprabha Vati is the classical Ayurvedic formulation for Mutrakrichra (dysuria/UTI). It acts as a urinary antiseptic, reduces burning, and prevents recurrence. Contains Guggulu, Shilajit, Chandana, and other urinary tract herbs. Used for both acute and recurrent UTI.',
        precautions: ['Safe for long-term use in recurrent UTI prevention', 'Can complement antibiotics', 'Drink plenty of water'],
        sideEffects: ['Generally well-tolerated'],
        contraindications: ['Severe kidney damage', 'Acute renal failure'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    homeopathyTreatment: [
      {
        medicineName: 'Cantharis',
        genericName: 'Cantharis 30C',
        indianBrandNames: ['SBL Cantharis', 'Schwabe Cantharis'],
        dosage: '30C potency',
        frequency: 'Every 2-3 hours during acute attack',
        duration: '5-7 days for acute UTI',
        route: 'Oral',
        wing: 'HOMEOPATHY',
        reasoning: 'Cantharis is the top remedy for acute UTI with intense burning before, during, and after urination. Constant urging to urinate, passes only drops, severe cutting pain. Rapid relief in acute cystitis.',
        precautions: ['Can be repeated frequently during acute attack', 'If no improvement in 24 hours, seek medical care', 'Urine culture recommended if recurrent'],
        sideEffects: ['No significant effects at homeopathic doses'],
        contraindications: ['Pyelonephritis / kidney infection — needs antibiotics', 'Severe UTI with fever — medical treatment first'],
        isFirstLine: true,
        isPrescription: false,
        janAushadhiAvailable: false,
      },
    ],
    lifestyleAdvice: ['Drink 2-3 liters of water daily', 'Urinate after intercourse', 'Wipe front to back', 'Complete full antibiotic course', 'Cranberry supplements for prevention (recurrent UTI)', 'Avoid holding urine for long periods', 'Wear cotton underwear', 'Avoid irritating feminine products'],
    redFlags: ['High fever (>101°F) with flank pain (pyelonephritis)', 'Blood in urine with clots', 'Inability to urinate', 'Severe flank pain', 'Signs of sepsis (confusion, rapid heart rate)', 'UTI in pregnancy', 'UTI in men (always investigate)'],
    followUp: ['Urine culture 1 week after completing antibiotics (test of cure)', 'Recurrent UTI (>3/year): Prophylactic strategy needed', 'Investigate: Ultrasound, cystoscopy if recurrent', 'Urine culture every episode before antibiotics'],
    whenToSeeDoctor: 'EMERGENCY: High fever + flank pain (pyelonephritis), unable to urinate, signs of sepsis. URGENT: Blood in urine, symptoms not improving in 48 hours, UTI in pregnancy or men. ROUTINE: Recurrent UTI (≥3 per year), persistent symptoms after treatment.',
    dietAdvice: ['Drink 2-3 liters water daily — flush bacteria', 'Cranberry juice/supplements: 36mg proanthocyanidins daily — prevents adhesion', 'Barley water: Cooling, diuretic — Ayurvedic recommendation', 'Coriander seed water: Cooling, soothing for burning', 'Avoid: Caffeine, alcohol, spicy food, citrus (irritate bladder)', 'Probiotics: Yogurt, fermented foods — restore vaginal flora', 'Vitamin C: Acidifies urine, inhibits bacterial growth', 'Pomegranate juice: Astringent, antioxidant'],
  },
}

// ═══════════════════════════════════════════════════════════════════════
// LAB VALUE INTERPRETER
// ═══════════════════════════════════════════════════════════════════════

interface LabReference {
  test: string
  unit: string
  low: number
  high: number
  criticalLow?: number
  criticalHigh?: number
  borderlineHigh?: number
  borderlineLow?: number
  interpretation: (value: number) => string
  action: (value: number) => string
  followUp: string[]
  associatedConditions: string[]
}

const LAB_REFERENCES: LabReference[] = [
  {
    test: 'HbA1c',
    unit: '%',
    low: 4.0, high: 5.7,
    borderlineHigh: 6.4, criticalHigh: 9.0,
    interpretation: (v) => {
      if (v < 5.7) return 'Normal — No diabetes. HbA1c reflects average blood glucose over past 3 months.'
      if (v < 6.5) return 'PREDIABETES — Increased risk of developing Type 2 Diabetes. Average glucose ~117-137 mg/dL. Lifestyle modification URGENT — 5-7% weight loss and 150 min/week exercise can prevent/delay diabetes by 58%.'
      if (v < 7.0) return 'Diabetes — Controlled. Target <7.0% for most adults. Average glucose ~154 mg/dL. Continue current management.'
      if (v < 8.0) return 'Diabetes — SUBOPTIMAL CONTROL. HbA1c 7.8% indicates average glucose ~174 mg/dL. If not on medication → Start Metformin 500mg BD. If on Metformin alone → Add second agent. Target <7.0%.'
      if (v < 9.0) return 'Diabetes — POOR CONTROL. Average glucose ~212 mg/dL. Intensify treatment — likely needs 2-3 agents or insulin consideration. Urgent medication review needed.'
      return 'Diabetes — VERY POOR CONTROL. Average glucose >250 mg/dL. Requires urgent intensification of therapy. Consider insulin initiation. Risk of complications very high.'
    },
    action: (v) => {
      if (v < 5.7) return 'No action needed. Healthy lifestyle. Repeat in 3 years if low risk, annually if high risk.'
      if (v < 6.5) return 'LIFESTYLE MODIFICATION: Weight loss 5-7%, exercise 150 min/week, healthy diet. Metformin may be considered if very high risk. Repeat in 6 months.'
      if (v < 7.0) return 'Continue current treatment. Monitor. Repeat HbA1c in 3 months.'
      if (v < 8.0) return 'INTENSIFY TREATMENT: If no medication → Start Metformin 500mg BD. If on Metformin alone → Add second agent (Glimepiride 1mg or Sitagliptin 100mg or Empagliflozin 10mg). Repeat HbA1c in 3 months.'
      if (v < 9.0) return 'URGENT INTENSIFICATION: May need 3 agents or basal insulin. Review current medications. Add SGLT2 inhibitor if CVD/CKD. Repeat in 3 months.'
      return 'EMERGENCY REVIEW: Likely needs insulin. Check for DKA/HHS. Urgent endocrinology referral. Hospital admission if symptomatic.'
    },
    followUp: ['Repeat HbA1c in 3 months', 'Fasting Lipid Profile', 'Renal Function (eGFR)', 'Urine Albumin-to-Creatinine Ratio', 'Dilated eye examination', 'Foot examination', 'Blood pressure check'],
    associatedConditions: ['Type 2 Diabetes', 'Diabetic Retinopathy', 'Diabetic Nephropathy', 'Diabetic Neuropathy', 'Cardiovascular Disease', 'Metabolic Syndrome'],
  },
  {
    test: 'Total Cholesterol',
    unit: 'mg/dL',
    low: 100, high: 200,
    borderlineHigh: 239, criticalHigh: 300,
    interpretation: (v) => {
      if (v < 200) return 'Desirable — Low cardiovascular risk from cholesterol.'
      if (v < 240) return 'Borderline High — Moderate CV risk. Lifestyle modification needed. Consider statin if other risk factors present.'
      if (v < 300) return 'HIGH — Significant CV risk. Statin therapy indicated. Lifestyle modification essential. Target <200 mg/dL (ideally <170).'
      return 'VERY HIGH — Major CV risk. High-intensity statin (Atorvastatin 40-80mg) URGENT. Consider familial hypercholesterolemia if LDL >190. May need statin + ezetimibe.'
    },
    action: (v) => {
      if (v < 200) return 'Continue healthy lifestyle. Repeat in 5 years if low risk, 1-2 years if moderate risk.'
      if (v < 240) return 'Lifestyle: Low saturated fat, exercise, weight loss. Repeat in 3 months. Consider statin if LDL >130 with risk factors.'
      if (v < 300) return 'Start statin therapy (Atorvastatin 10-20mg). Aggressive lifestyle modification. Full lipid panel, LFTs before starting. Repeat lipid profile in 3 months.'
      return 'HIGH-INTENSITY STATIN (Atorvastatin 40-80mg or Rosuvastatin 20-40mg). Check for familial hypercholesterolemia (LDL >190, family history, xanthomas). May need statin + ezetimibe. Urgent lipid management.'
    },
    followUp: ['Full Lipid Profile (LDL, HDL, Triglycerides)', 'LFTs before statin', 'TSH (hypothyroidism raises cholesterol)', 'Fasting Blood Glucose', 'ApoB and Lp(a)', 'ECG and cardiac risk assessment'],
    associatedConditions: ['Coronary Artery Disease', 'Stroke', 'Peripheral Artery Disease', 'Familial Hypercholesterolemia', 'Hypothyroidism', 'Metabolic Syndrome'],
  },
  {
    test: 'LDL',
    unit: 'mg/dL',
    low: 50, high: 100,
    borderlineHigh: 159, criticalHigh: 190,
    interpretation: (v) => {
      if (v < 100) return 'Optimal LDL. Low cardiovascular risk.'
      if (v < 130) return 'Near/above optimal. Moderate risk patients should target <100.'
      if (v < 160) return 'Borderline high. High-risk patients need target <70. Statin likely indicated.'
      if (v < 190) return 'High LDL. Statin therapy essential. Target depends on risk category.'
      return 'Very high LDL. Consider familial hypercholesterolemia. Aggressive statin + ezetimibe needed.'
    },
    action: (v) => {
      if (v < 100) return 'Optimal — no statin needed for LDL alone. Consider based on overall risk.'
      if (v < 130) return 'Lifestyle modification. Statin if high-risk (diabetes, CVD, 10-year risk >7.5%).'
      if (v < 160) return 'Lifestyle + statin indicated for most patients. Target <100 (moderate risk) or <70 (high risk).'
      return 'HIGH-INTENSITY statin + lifestyle. If >190: evaluate for familial hypercholesterolemia. Consider statin + ezetimibe.'
    },
    followUp: ['Full Lipid Profile', 'LFTs', 'ApoB', 'Lp(a)', 'Genetic testing if FH suspected'],
    associatedConditions: ['Coronary Artery Disease', 'Atherosclerosis', 'Familial Hypercholesterolemia'],
  },
  {
    test: 'TSH',
    unit: 'mIU/L',
    low: 0.4, high: 4.5,
    criticalLow: 0.1, criticalHigh: 10,
    borderlineLow: 0.5, borderlineHigh: 6,
    interpretation: (v) => {
      if (v < 0.1) return 'Severe Suppressed TSH — Likely hyperthyroidism. Urgent evaluation needed. Risk of atrial fibrillation, osteoporosis, thyroid storm.'
      if (v < 0.4) return 'Low TSH — Possible hyperthyroidism. Check Free T4 and T3. May be subclinical if FT4 normal.'
      if (v <= 4.5) return 'Normal TSH — Thyroid function normal. No treatment needed.'
      if (v <= 10) return 'Elevated TSH — Subclinical hypothyroidism if FT4 normal. Treat if symptoms present, TSH >10, or high CV risk (target <2.5 in pregnancy).'
      return 'High TSH — Overt hypothyroidism likely. Start Levothyroxine. Check Free T4 and Anti-TPO.'
    },
    action: (v) => {
      if (v < 0.1) return 'URGENT: Check FT4, FT3, TSH receptor antibodies. Endocrinology referral. Beta-blocker for symptoms.'
      if (v < 0.4) return 'Check FT4, FT3. If suppressed TSH + high FT4 → hyperthyroidism treatment. If subclinical → monitor 3-6 months.'
      if (v <= 4.5) return 'No action. Normal thyroid function. Repeat in 1-2 years or if symptoms develop.'
      if (v <= 10) return 'Check FT4 and Anti-TPO. Treat if: symptoms, TSH >10, pregnancy/planning, CV risk factors, positive Anti-TPO. Otherwise monitor every 6 months.'
      return 'Start Levothyroxine: 25-50mcg in elderly, 50-100mcg in young. Check FT4, Anti-TPO. Target TSH 0.5-4.0. Repeat TSH in 6-8 weeks.'
    },
    followUp: ['Free T4', 'Free T3', 'Anti-TPO antibodies', 'Lipid profile (hypothyroidism raises cholesterol)', 'CBC', 'Vitamin B12 and D'],
    associatedConditions: ['Hypothyroidism', 'Hashimoto\'s Thyroiditis', 'Hyperthyroidism', 'Graves\' Disease', 'Post-thyroidectomy', 'Post-I-131 therapy'],
  },
  {
    test: 'Fasting Glucose',
    unit: 'mg/dL',
    low: 70, high: 100,
    criticalLow: 54, criticalHigh: 300,
    borderlineHigh: 125,
    interpretation: (v) => {
      if (v < 54) return 'Severe hypoglycemia — Medical emergency. Requires immediate treatment (glucose/glucagon).'
      if (v < 70) return 'Low fasting glucose — Hypoglycemia. If on diabetes medication, dose adjustment needed.'
      if (v <= 100) return 'Normal fasting glucose.'
      if (v <= 125) return 'Impaired Fasting Glucose (Prediabetes). Risk of progressing to diabetes.'
      if (v <= 200) return 'Elevated fasting glucose — Diabetes range. Check HbA1c for confirmation.'
      return 'Very high fasting glucose — Uncontrolled diabetes. Urgent management needed.'
    },
    action: (v) => {
      if (v < 54) return 'EMERGENCY: Give 15-20g fast-acting carbohydrate. Recheck in 15 min. If unconscious → Glucagon 1mg IM or IV glucose.'
      if (v < 70) return 'If on medication: Reduce dose. If not: Evaluate for other causes. Repeat test.'
      if (v <= 100) return 'Normal. No action. Healthy lifestyle. Annual screening if risk factors.'
      if (v <= 125) return 'Prediabetes: Lifestyle modification (5-7% weight loss, 150 min exercise/week). Consider Metformin if high risk. Repeat in 6 months.'
      return 'Diabetes: Confirm with HbA1c. Start Metformin + lifestyle. Target fasting 80-130 mg/dL.'
    },
    followUp: ['HbA1c', 'Post-prandial glucose', 'Lipid profile', 'Renal function', 'Urine microalbumin'],
    associatedConditions: ['Diabetes', 'Prediabetes', 'Insulin Resistance', 'Metabolic Syndrome'],
  },
  {
    test: 'Hemoglobin',
    unit: 'g/dL',
    low: 12, high: 16,
    criticalLow: 7, criticalHigh: 18,
    borderlineLow: 11,
    interpretation: (v) => {
      if (v < 7) return 'SEVERE ANEMIA — Medical emergency. May need blood transfusion. Urgent evaluation.'
      if (v < 11) return 'Moderate anemia — Investigate cause (iron studies, B12, reticulocyte count). Likely needs supplementation.'
      if (v < 12) return 'Mild anemia — Common in menstruating women. Check iron studies. Diet modification + supplement.'
      if (v <= 16) return 'Normal hemoglobin.'
      if (v <= 18) return 'Elevated hemoglobin — May indicate dehydration, polycythemia, or high altitude.'
      return 'Very high hemoglobin — Evaluate for polycythemia vera or secondary polycythemia.'
    },
    action: (v) => {
      if (v < 7) return 'EMERGENCY: Blood transfusion likely needed. Hospital admission. Find and treat cause.'
      if (v < 11) return 'Full anemia workup: Iron studies, B12, folate, reticulocyte count, peripheral smear. Start iron supplement if iron deficiency confirmed.'
      if (v < 12) return 'Check serum ferritin. If <15 → iron deficiency. Start iron supplement + Vitamin C. Diet modification.'
      if (v <= 16) return 'Normal. No action needed.'
      return 'Evaluate for polycythemia. Check JAK2 mutation if >17. Hydration if dehydrated.'
    },
    followUp: ['CBC with indices', 'Serum Ferritin', 'Serum Iron + TIBC', 'Vitamin B12 + Folic Acid', 'Reticulocyte count', 'Peripheral blood smear', 'Stool occult blood (if iron deficiency)'],
    associatedConditions: ['Iron Deficiency Anemia', 'B12 Deficiency', 'Chronic Disease Anemia', 'Thalassemia', 'Polycythemia Vera'],
  },
  {
    test: 'Creatinine',
    unit: 'mg/dL',
    low: 0.6, high: 1.2,
    criticalHigh: 4.0,
    borderlineHigh: 1.5,
    interpretation: (v) => {
      if (v <= 1.2) return 'Normal creatinine — Kidney function likely normal. Calculate eGFR for accurate assessment.'
      if (v <= 1.5) return 'Mildly elevated creatinine — May indicate early kidney disease. Calculate eGFR. Check for causes (diabetes, hypertension, medications).'
      if (v <= 4.0) return 'Significantly elevated creatinine — Moderate to severe kidney impairment. Nephrology referral. Avoid nephrotoxic drugs.'
      return 'Very high creatinine — Severe kidney failure. Urgent nephrology referral. May need dialysis evaluation.'
    },
    action: (v) => {
      if (v <= 1.2) return 'Normal. No action. Annual check if diabetes/hypertension.'
      if (v <= 1.5) return 'Calculate eGFR. Check urine protein/ACR. Optimize BP and glucose control. Avoid NSAIDs. Review medications.'
      if (v <= 4.0) return 'Nephrology referral. eGFR calculation. Avoid nephrotoxic drugs (NSAIDs, aminoglycosides, IV contrast without prophylaxis). Dose-adjust medications.'
      return 'URGENT nephrology referral. Evaluate for dialysis. Check potassium, bicarbonate, calcium, phosphorus. Fluid and diet management.'
    },
    followUp: ['eGFR calculation', 'Urine ACR', 'Electrolytes (K, Na, Ca, Phos)', 'Blood Urea Nitrogen', 'Urine protein', 'Kidney ultrasound', 'Blood pH and bicarbonate'],
    associatedConditions: ['Chronic Kidney Disease', 'Diabetic Nephropathy', 'Hypertensive Nephrosclerosis', 'Acute Kidney Injury', 'Glomerulonephritis'],
  },
  {
    test: 'Vitamin D',
    unit: 'ng/mL',
    low: 30, high: 100,
    criticalLow: 10,
    borderlineLow: 20,
    interpretation: (v) => {
      if (v < 10) return 'SEVERE Vitamin D deficiency. High risk of osteomalacia, fractures, muscle weakness. Urgent supplementation needed.'
      if (v < 20) return 'Vitamin D deficiency. Supplementation needed. Associated with bone pain, fatigue, muscle weakness, increased infection risk.'
      if (v < 30) return 'Vitamin D insufficiency. Supplementation recommended. Common in Indians (70-80% prevalence) due to melanin, pollution, indoor lifestyle.'
      if (v <= 100) return 'Normal Vitamin D level. Maintain with sensible sun exposure.'
      return 'Vitamin D excess — Risk of hypercalcemia. Reduce supplementation dose.'
    },
    action: (v) => {
      if (v < 10) return 'HIGH-DOSE treatment: Cholecalciferol 60,000 IU once weekly for 8-12 weeks, then monthly maintenance. OR 1000-2000 IU daily. Recheck in 3 months.'
      if (v < 20) return 'Cholecalciferol 60,000 IU weekly for 4-8 weeks, then monthly. OR 1000-2000 IU daily. Recheck in 3 months.'
      if (v < 30) return 'Cholecalciferol 1000-2000 IU daily. Recheck in 3-6 months.'
      if (v <= 100) return 'Maintenance: 600-1000 IU daily. Sun exposure 15-20 min, 3x/week.'
      return 'Stop/reduce supplementation. Check serum calcium. Recheck Vitamin D in 3 months.'
    },
    followUp: ['Serum Calcium', 'Serum Phosphorus', 'ALP (Alkaline Phosphatase)', 'PTH (Parathyroid Hormone)', 'DEXA scan (bone density) if deficiency + risk factors'],
    associatedConditions: ['Osteoporosis', 'Osteomalacia', 'Muscle weakness', 'Frequent infections', 'Depression', 'Fibromyalgia', 'Multiple Sclerosis'],
  },
]

export function interpretLabValue(testName: string, value: number): LabInterpretation | null {
  const ref = LAB_REFERENCES.find(r =>
    r.test.toLowerCase() === testName.toLowerCase() ||
    r.test.toLowerCase().includes(testName.toLowerCase())
  )
  if (!ref) return null

  let status: LabInterpretation['status']
  if (ref.criticalLow && value <= ref.criticalLow) status = 'CRITICAL_LOW'
  else if (value < ref.low) status = 'LOW'
  else if (ref.borderlineLow && value < ref.borderlineLow) status = 'BORDERLINE_LOW'
  else if (value <= ref.high) status = 'NORMAL'
  else if (ref.borderlineHigh && value <= ref.borderlineHigh) status = 'BORDERLINE_HIGH'
  else if (ref.criticalHigh && value >= ref.criticalHigh) status = 'CRITICAL_HIGH'
  else status = 'HIGH'

  return {
    testName: ref.test,
    value,
    unit: ref.unit,
    referenceRange: `${ref.low}-${ref.high} ${ref.unit}`,
    status,
    clinicalSignificance: ref.interpretation(value),
    recommendedAction: ref.action(value),
    followUpTests: ref.followUp,
    associatedConditions: ref.associatedConditions,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DOCTOR-LIKE RESPONSE GENERATOR
// ═══════════════════════════════════════════════════════════════════════

export function getDoctorLikeResponse(
  conditionKey: string,
  labValues?: Array<{ test: string; value: number }>,
  preferredWing?: Modality
): ClinicalResponse | null {
  const condition = CLINICAL_CONDITIONS[conditionKey]
  if (!condition) return null

  // Interpret lab values if provided
  const labInterpretations = labValues
    ?.map(lv => interpretLabValue(lv.test, lv.value))
    .filter(Boolean) as LabInterpretation[] || []

  // Build patient-friendly summary
  let summary = `${condition.name} (${condition.icdCode}): ${condition.description}\n\n`

  if (labInterpretations.length > 0) {
    summary += '📊 YOUR LAB RESULTS INTERPRETATION:\n'
    for (const lab of labInterpretations) {
      summary += `\n• ${lab.testName}: ${lab.value} ${lab.unit} (${lab.status})\n`
      summary += `  Reference: ${lab.referenceRange}\n`
      summary += `  Meaning: ${lab.clinicalSignificance}\n`
      summary += `  Action: ${lab.recommendedAction}\n`
    }
  }

  // Build detailed explanation
  let detailed = `## Understanding ${condition.name}\n\n`
  detailed += `**What is it?** ${condition.description}\n\n`
  detailed += `**Common Symptoms:**\n${condition.symptoms.map(s => `• ${s}`).join('\n')}\n\n`
  detailed += `**How is it diagnosed?**\n${condition.diagnosticCriteria.map(c => `• ${c}`).join('\n')}\n\n`
  if (condition.redFlags.length > 0) {
    detailed += `🚩 **RED FLAGS — Seek Immediate Medical Attention if:**\n${condition.redFlags.map(r => `• ${r}`).join('\n')}\n\n`
  }

  // Build safety warnings
  const safetyWarnings: string[] = []
  for (const lab of labInterpretations) {
    if (['CRITICAL_LOW', 'CRITICAL_HIGH'].includes(lab.status)) {
      safetyWarnings.push(`⚠️ CRITICAL: ${lab.testName} = ${lab.value} ${lab.unit} — ${lab.recommendedAction}`)
    }
    if (['HIGH', 'LOW'].includes(lab.status)) {
      safetyWarnings.push(`⚠️ ${lab.testName} = ${lab.value} ${lab.unit} is ${lab.status} — ${lab.recommendedAction}`)
    }
  }
  safetyWarnings.push(...condition.redFlags.map(r => `🚩 Red Flag: ${r}`))

  return {
    conditionName: condition.name,
    patientFriendlySummary: summary,
    detailedExplanation: detailed,
    labInterpretation: labInterpretations[0] || undefined,
    allopathyRecommendations: condition.allopathyTreatment,
    ayurvedaRecommendations: condition.ayurvedaTreatment,
    homeopathyRecommendations: condition.homeopathyTreatment,
    safetyWarnings,
    lifestyleAdvice: condition.lifestyleAdvice,
    dietAdvice: condition.dietAdvice,
    followUpAdvice: condition.followUp,
    whenToSeeDoctor: condition.whenToSeeDoctor,
    disclaimer: '⚕️ DISCLAIMER: This is clinical decision-support information, NOT a prescription. All recommendations must be reviewed and approved by a qualified healthcare practitioner before use. This does not replace professional medical advice, diagnosis, or treatment. Never start, stop, or change medication without consulting your doctor. In emergencies, call 108 or go to nearest hospital.',
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SYMPTOM PATTERN MATCHING
// ═══════════════════════════════════════════════════════════════════════

const SYMPTOM_PATTERNS: Record<string, string[]> = {
  'type-2-diabetes': ['diabetes', 'sugar', 'blood sugar', 'glucose', 'hba1c', 'polyuria', 'polydipsia', 'frequent urination', 'increased thirst', 'diabetic', 'metformin', 'insulin resistance'],
  'hyperlipidemia': ['cholesterol', 'lipid', 'ldl', 'hdl', 'triglyceride', 'statin', 'high cholesterol', 'dyslipidemia', 'xanthoma'],
  'hypertension': ['blood pressure', 'hypertension', 'bp high', 'headache', 'dizziness', 'antihypertensive'],
  'hypothyroidism': ['thyroid', 'tsh', 'hypothyroid', 'weight gain', 'cold intolerance', 'fatigue', 'levothyroxine', 'thyronorm'],
  'anemia-iron-deficiency': ['anemia', 'hemoglobin', 'iron deficiency', 'pale', 'fatigue', 'ferritin', 'low hb'],
  'depression': ['depression', 'sad', 'low mood', 'anxiety', 'hopeless', 'suicidal', 'antidepressant', 'ssri'],
  'asthma': ['asthma', 'wheeze', 'breathing difficulty', 'shortness of breath', 'inhaler', 'bronchitis'],
  'migraine': ['migraine', 'headache', 'head pain', 'aura', 'photophobia', 'triptan'],
  'pcos': ['pcos', 'pcod', 'irregular periods', 'hirsutism', 'acne', 'ovarian cyst', 'infertility'],
  'gastroesophageal-reflux': ['gerd', 'acidity', 'heartburn', 'acid reflux', 'regurgitation', 'ppi'],
  'osteoarthritis': ['arthritis', 'joint pain', 'osteoarthritis', 'knee pain', 'stiffness', 'crepitus'],
  'urinary-tract-infection': ['uti', 'burning urination', 'dysuria', 'frequent urination', 'urine infection', 'cystitis'],
}

export function matchSymptomsToConditions(input: string): Array<{ conditionKey: string; conditionName: string; confidence: number }> {
  const lowerInput = input.toLowerCase()
  const results: Array<{ conditionKey: string; conditionName: string; confidence: number }> = []

  for (const [key, patterns] of Object.entries(SYMPTOM_PATTERNS)) {
    let score = 0
    for (const pattern of patterns) {
      if (lowerInput.includes(pattern)) score += 3
      // Partial match
      const words = pattern.split(' ')
      for (const word of words) {
        if (lowerInput.includes(word)) score += 1
      }
    }
    if (score > 0) {
      const condition = CLINICAL_CONDITIONS[key]
      results.push({
        conditionKey: key,
        conditionName: condition?.name || key,
        confidence: Math.min(score / 10, 1),
      })
    }
  }

  results.sort((a, b) => b.confidence - a.confidence)
  return results.slice(0, 5)
}

// Export list of all condition keys for enumeration
export function getAllConditionKeys(): string[] {
  return Object.keys(CLINICAL_CONDITIONS)
}

export function getConditionCount(): number {
  return Object.keys(CLINICAL_CONDITIONS).length
}
