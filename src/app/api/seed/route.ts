import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const BS: Record<string, { d: string; issues: string[] }> = {
  RESPIRATORY: { d: 'Pulmonology', issues: ['Common Cold','Cough','Acute Bronchitis','Chronic Bronchitis','Asthma','Pneumonia','Sinusitis','Pharyngitis','Laryngitis','Tonsillitis','COPD','Allergic Rhinitis','Influenza','Tuberculosis','Pleurisy','Pulmonary Embolism','Pulmonary Fibrosis','Emphysema','Bronchiectasis','Breathlessness','Wheezing','Hemoptysis'] },
  CARDIOVASCULAR: { d: 'Cardiology', issues: ['Hypertension','Hypotension','Angina Pectoris','Arrhythmia','Heart Failure','Palpitations','Atherosclerosis','DVT','Varicose Veins','Anemia','Peripheral Artery Disease','Myocardial Infarction','Endocarditis','Cardiomyopathy','Pericarditis','Atrial Fibrillation','Bradycardia','Tachycardia'] },
  GASTROINTESTINAL: { d: 'Gastroenterology', issues: ['GERD','Acid Reflux','Peptic Ulcer','Gastritis','IBS','IBD','Diarrhea','Constipation','Dysentery','Food Poisoning','Hepatitis A','Hepatitis B','Hepatitis C','Cirrhosis','Pancreatitis','Gallstones','Appendicitis','Hemorrhoids','Anal Fissure','Dyspepsia','Bloating','Nausea','Vomiting','Gastroenteritis','Stomach Pain','Abdominal Cramps'] },
  NEUROLOGICAL: { d: 'Neurology', issues: ['Headache','Migraine','Epilepsy','Stroke','Neuropathy','Parkinson Disease','Vertigo','Dizziness','Neuralgia','Carpal Tunnel Syndrome','Sciatica','Multiple Sclerosis','Bell Palsy','Tremor','Ataxia','Fainting','Memory Loss','Numbness'] },
  MUSCULOSKELETAL: { d: 'Orthopedics', issues: ['Back Pain','Neck Pain','Joint Pain','Osteoarthritis','Rheumatoid Arthritis','Gout','Muscle Strain','Fracture','Osteoporosis','Fibromyalgia','Tendinitis','Bursitis','Spondylosis','Sprain','Muscle Cramp','Frozen Shoulder','Tennis Elbow','Plantar Fasciitis','Body Ache'] },
  DERMATOLOGICAL: { d: 'Dermatology', issues: ['Eczema','Psoriasis','Acne','Fungal Infection','Dermatitis','Urticaria','Cellulitis','Boils','Warts','Vitiligo','Alopecia','Scabies','Herpes Zoster','Rash','Dry Skin','Sunburn','Melasma','Pimples','Itching','Dandruff'] },
  ENDOCRINE: { d: 'Endocrinology', issues: ['Diabetes Type 1','Diabetes Type 2','Thyroid Disorders','Hypothyroidism','Hyperthyroidism','PCOS','Obesity','Goiter','Insulin Resistance','High Blood Sugar','Low Blood Sugar'] },
  URINARY: { d: 'Urology', issues: ['UTI','Kidney Stones','Pyelonephritis','Urinary Incontinence','Prostatitis','BPH','Nephrotic Syndrome','Hematuria','Proteinuria','Renal Failure','Painful Urination'] },
  ENT: { d: 'Otolaryngology', issues: ['Ear Infection','Hearing Loss','Tinnitus','Nasal Polyps','Epistaxis','Sore Throat','Hoarseness','Ear Pain','Nose Block','Throat Infection'] },
  OPHTHALMOLOGICAL: { d: 'Ophthalmology', issues: ['Conjunctivitis','Cataract','Glaucoma','Dry Eye','Myopia','Stye','Uveitis','Macular Degeneration','Eye Strain','Red Eye','Blurred Vision'] },
  PSYCHIATRIC: { d: 'Psychiatry', issues: ['Anxiety','Depression','Insomnia','OCD','PTSD','Bipolar Disorder','Panic Attack','Stress','Eating Disorder','Schizophrenia','Substance Abuse','Sleep Disorder'] },
  HEMATOLOGICAL: { d: 'Hematology', issues: ['Iron Deficiency Anemia','B12 Deficiency Anemia','Sickle Cell Disease','Thalassemia','Bleeding Disorder','Thrombocytopenia','Leukemia','Lymphoma','Polycythemia','Blood Clot'] },
  IMMUNOLOGICAL: { d: 'Immunology', issues: ['Allergic Rhinitis','Allergic Dermatitis','Food Allergy','Drug Allergy','Anaphylaxis','Lupus','Rheumatic Fever','Autoimmune Disorder','Immunodeficiency'] },
  REPRODUCTIVE: { d: 'Gynecology', issues: ['Menstrual Irregularity','Menorrhagia','Amenorrhea','Dysmenorrhea','Infertility','Menopause','Endometriosis','Uterine Fibroids','PID','Vaginal Infection','Erectile Dysfunction','Prostate Enlargement'] },
  PEDIATRIC: { d: 'Pediatrics', issues: ['Fever','Colic','Teething','Growth Delay','Failure to Thrive','Rickets','Childhood Asthma','Worm Infestation','Measles','Chickenpox','Mumps','Whooping Cough','Dengue Fever','Hand Foot Mouth Disease','Diaper Rash','Neonatal Jaundice'] },
  GENERAL: { d: 'General Medicine', issues: ['Fever','Fatigue','Weight Loss','Weight Gain','Loss of Appetite','Body Pain','Weakness','Dehydration','Swelling','Night Sweats','Excessive Thirst','Lymph Node Swelling','Allergic Reaction','Chills','Malaise'] },
}

const HINDI_ALIASES: Record<string, string[]> = {
  'Fever': ['bukhar','tez bukhar','jvar'],
  'Headache': ['sir dard','sir ka dard','mastishk dard'],
  'Common Cold': ['sardi','jukham','sardi zukam'],
  'Cough': ['khansi','khasi','dry khansi'],
  'Stomach Pain': ['pet dard','pet ka dard','udar dard'],
  'Diarrhea': ['dast','loose motion','atisaar'],
  'Constipation': ['kabz','kabja','vibhandh'],
  'Back Pain': ['kamar dard','kad dard','prishth dard'],
  'Joint Pain': ['jod dard','gath dard','sandhi dard'],
  'Asthma': ['dama','svas kash','dam'],
  'Acid Reflux': ['acidit','pet mein acid','amlapitta'],
  'Nausea': ['ulti','jiji','trushna'],
  'Vomiting': ['ulti','chardi','vamana'],
  'Dizziness': ['chakkar','sir chakkar','bhranti'],
  'Itching': ['khujli','kandu','itch'],
  'Skin Allergy': ['twacha allergy','charm rog','tvak vikar'],
  'Anemia': ['khoon ki kami','rakta alpata','anemia'],
  'Diabetes': ['madhumeh','sugar','prameha'],
  'Hypertension': ['uncha rakt chaap','bp high','raktavbhighata'],
  'Insomnia': ['neend na aana','anidra','sleep problem'],
}

const SUBTYPE_PREFIXES = ['Acute','Chronic','Mild','Moderate','Severe','Recurrent','Persistent','Intermittent','Progressive','Intractable']
const SUBTYPE_SUFFIXES = ['in Adults','in Children','in Elderly','in Pregnancy','with Complications','without Complications','Early Stage','Late Stage','Uncomplicated','Complicated']

const WING_APPROACHES: Record<string, { ALLOPATHY: string; AYURVEDA: string; HOMEOPATHY: string }> = {
  'Fever': { ALLOPATHY: 'Antipyretics (Paracetamol), rest, hydration. If bacterial, antibiotics.', AYURVEDA: 'Guduchi (Giloy) kwath, Godanti Bhasma, Pachan (digestion) support, Langhana (fasting).', HOMEOPATHY: 'Aconite for sudden onset, Belladonna for high fever with redness, Gelsemium for flu-like fever.' },
  'Headache': { ALLOPATHY: 'Paracetamol, Ibuprofen. Identify type: tension, migraine, cluster. Specific meds for migraine.', AYURVEDA: 'Shirashoolari Vati, Brahmi for stress headache, Nasya therapy with Anu Taila.', HOMEOPATHY: 'Belladonna for throbbing, Nux Vomica for morning headache, Iris for migraine.' },
  'Common Cold': { ALLOPATHY: 'Symptomatic: Antihistamines, Decongestants, Paracetamol. Rest, hydration.', AYURVEDA: 'Talisadi Churna, Sitopaladi Churna with honey, Tulsi decoction, steam inhalation.', HOMEOPATHY: 'Aconite at onset, Allium Cepa for runny nose, Nux Vomica for stuffy nose.' },
  'Cough': { ALLOPATHY: 'Antitussives (Dextromethorphan) for dry, Expectorants (Ambroxol) for wet. Treat cause.', AYURVEDA: 'Sitopaladi Churna, Talisadi Churna, Kantakaryavaleha, honey + ginger.', HOMEOPATHY: 'Drosera for spasmodic cough, Bryonia for dry cough, Rumex for tickling cough.' },
  'Stomach Pain': { ALLOPATHY: 'Antispasmodics (Dicyclomine), Antacids. Identify cause: gastritis, ulcer, IBS.', AYURVEDA: 'Hingwastak Churna, Shankh Vati, Pachan Churna, jeera water.', HOMEOPATHY: 'Nux Vomica for cramping, Colocynth for colicky pain, Magnesia Phos for cramps.' },
  'Diarrhea': { ALLOPATHY: 'ORS, Zinc, Loperamide (non-infectious). Antibiotics if bacterial.', AYURVEDA: 'Kutajarishta, Bilvadi Churna, Gangadhara Churna, rice water.', HOMEOPATHY: 'Arsenicum Album for watery diarrhea, Podophyllum for profuse, Aloe for urgent.' },
  'Asthma': { ALLOPATHY: 'Bronchodilators (Salbutamol), Inhaled corticosteroids, Montelukast. Step-wise therapy.', AYURVEDA: 'Kanakasava, Bharangyadi Avaleha, Shwasakuthar Rasa, Pippali long pepper therapy.', HOMEOPATHY: 'Arsenicum Album for wheezing, Natrum Sulph for humid asthma, Blatta Orientalis.' },
  'Hypertension': { ALLOPATHY: 'Amlodipine, Losartan, ACE inhibitors, Diuretics. Lifestyle: DASH diet, exercise, salt restriction.', AYURVEDA: 'Arjuna kwath, Sarpagandha (Rauwolfia), Guggulu, Pranayama, low-salt diet.', HOMEOPATHY: 'Natrum Mur for emotional causes, Lachesis for high BP with hot flashes, Glonoine.' },
  'Diabetes Type 2': { ALLOPATHY: 'Metformin first-line, Sulfonylureas, DPP-4 inhibitors, SGLT2 inhibitors, Insulin if needed.', AYURVEDA: 'Guduchi, Jamun seed, Karela, Meshashringi, Chandraprabha Vati, Pathya Ahara.', HOMEOPATHY: 'Syzygium Jambolanum, Phosphoric Acid for weakness, Uranium Nitricum.' },
  'Anxiety': { ALLOPATHY: 'SSRIs (Sertraline), SNRIs, Benzodiazepines (short-term), CBT therapy.', AYURVEDA: 'Ashwagandha, Brahmi, Jatamansi, Shirodhara therapy, Medhya Rasayana.', HOMEOPATHY: 'Aconite for acute anxiety, Argentum Nitricum for anticipatory, Gelsemium for performance anxiety.' },
  'Back Pain': { ALLOPATHY: 'NSAIDs, Muscle relaxants, Physiotherapy. Epidural for severe. Surgery if indicated.', AYURVEDA: 'Kati Basti, Mahanarayan Taila, Yogaraj Guggulu, Pinda Sweda, Basti therapy.', HOMEOPATHY: 'Rhus Tox for better with movement, Bryonia for worse with movement, Nux Vomica for spinal.' },
  'Eczema': { ALLOPATHY: 'Topical corticosteroids, Calcineurin inhibitors, Moisturizers, Antihistamines.', AYURVEDA: 'Nimba (Neem), Manjishtha, Khadira, Panchatikta Ghrita, blood purification.', HOMEOPATHY: 'Sulphur for itching, Graphites for oozing, Arsenicum for burning.' },
  'Depression': { ALLOPATHY: 'SSRIs (Fluoxetine, Sertraline), SNRIs, Counseling, Exercise.', AYURVEDA: 'Ashwagandha, Brahmi, Shankhpushpi, Jatamansi, Shirodhara, Abhyanga.', HOMEOPATHY: 'Natrum Mur for grief, Ignatia for emotional, Aurum Met for severe depression.' },
}

const DEFAULT_WING = { ALLOPATHY: 'Evidence-based pharmacological treatment with lifestyle modifications.', AYURVEDA: 'Dosha-balancing approach with herbs, Panchakarma, diet (Ahara-Vihara).', HOMEOPATHY: 'Individualized remedy selection based on symptom totality and miasmatic analysis.' }

export async function POST(request: NextRequest) {
  try {
    const existingIssues = await db.healthIssue.count()
    if (existingIssues > 100) {
      return NextResponse.json({ message: 'Already seeded', counts: { issues: existingIssues, medicines: await db.medicine.count() } })
    }

    // Step 1: Tenant
    const tenant = await db.tenant.create({ data: { name: 'MedGovern Demo Hospital', code: 'MGH-001', jurisdiction: 'IN' } })
    const role = await db.role.create({ data: { name: 'CLINICIAN', permissions: '["read","write","review"]' } })

    // Step 2: Practitioners
    const practitioners = await Promise.all([
      db.practitioner.create({ data: { tenantId: tenant.id, name: 'Dr. Sharma (Allopathy)', specialization: 'General Medicine', modality: 'ALLOPATHY', licenseNumber: 'AP-2024-001' } }),
      db.practitioner.create({ data: { tenantId: tenant.id, name: 'Vaidya Joshi (Ayurveda)', specialization: 'Kayachikitsa', modality: 'AYURVEDA', licenseNumber: 'AY-2024-001' } }),
      db.practitioner.create({ data: { tenantId: tenant.id, name: 'Dr. Patel (Homeopathy)', specialization: 'General Homeopathy', modality: 'HOMEOPATHY', licenseNumber: 'HO-2024-001' } }),
    ])

    // Step 3: Demo patients
    const patients = []
    for (let i = 0; i < 8; i++) {
      patients.push(await db.patient.create({
        data: {
          tenantId: tenant.id,
          firstName: ['Rahul','Priya','Amit','Sunita','Vikram','Anjali','Suresh','Meena'][i],
          lastName: ['Kumar','Sharma','Patel','Gupta','Singh','Joshi','Reddy','Nair'][i],
          dateOfBirth: ['1990-01-15','1985-03-22','1978-07-11','1992-11-05','1968-09-30','1995-04-18','1980-12-01','1975-06-25'][i],
          gender: ['M','F','M','F','M','F','M','F'][i],
          phone: `+91-9876543${100 + i}`,
          bloodGroup: ['B+','O+','A+','AB+','O-','B+','A-','AB-'][i],
        },
      }))
    }

    // Step 4: Generate 5000+ Health Issues
    const allIssues: Array<{ id: string; name: string; bodySystem: string }> = []
    
    for (const [bsKey, bsData] of Object.entries(BS)) {
      for (const issueName of bsData.issues) {
        // Create main issue
        const mainIssue = await db.healthIssue.create({
          data: {
            name: issueName,
            bodySystem: bsKey,
            clinicalDomain: bsData.d,
            symptomGroup: issueName,
            severity: 'MODERATE',
            chronicity: 'ACUTE',
            prevalence: 'COMMON',
          },
        })
        allIssues.push({ id: mainIssue.id, name: issueName, bodySystem: bsKey })

        // Create subtypes
        const subtypesToCreate: string[] = []
        for (const prefix of SUBTYPE_PREFIXES) {
          subtypesToCreate.push(`${prefix} ${issueName}`)
        }
        for (const suffix of SUBTYPE_SUFFIXES) {
          subtypesToCreate.push(`${issueName} ${suffix}`)
        }
        // Add body-system specific subtypes
        subtypesToCreate.push(`${issueName} - ${bsData.d}`)
        subtypesToCreate.push(`${issueName} with Comorbidities`)
        subtypesToCreate.push(`${issueName} Post-Treatment`)
        subtypesToCreate.push(`${issueName} Follow-Up`)
        subtypesToCreate.push(`${issueName} Prevention`)
        subtypesToCreate.push(`${issueName} Screening`)
        subtypesToCreate.push(`${issueName} Management`)
        subtypesToCreate.push(`${issueName} Refractory`)

        for (const stName of subtypesToCreate) {
          try {
            const sub = await db.healthIssue.create({
              data: {
                name: stName,
                bodySystem: bsKey,
                clinicalDomain: bsData.d,
                symptomGroup: issueName,
                severity: stName.includes('Severe') || stName.includes('Intractable') ? 'SEVERE' : stName.includes('Mild') ? 'MILD' : 'MODERATE',
                chronicity: stName.includes('Chronic') || stName.includes('Persistent') || stName.includes('Progressive') ? 'CHRONIC' : 'ACUTE',
                prevalence: stName.includes('Rare') ? 'RARE' : 'COMMON',
                isSubtype: true,
                parentIssueId: mainIssue.id,
              },
            })
            allIssues.push({ id: sub.id, name: stName, bodySystem: bsKey })
          } catch { /* skip duplicates */ }
        }
      }
    }

    // Step 5: Create aliases for common issues
    for (const [engName, aliases] of Object.entries(HINDI_ALIASES)) {
      const matched = allIssues.find(i => i.name === engName)
      if (matched) {
        for (const alias of aliases) {
          await db.healthIssueAlias.create({ data: { issueId: matched.id, alias, language: 'hi' } }).catch(() => {})
        }
      }
    }
    // Add English aliases for all
    for (const issue of allIssues.slice(0, 200)) {
      await db.healthIssueAlias.create({ data: { issueId: issue.id, alias: issue.name.toLowerCase(), language: 'en' } }).catch(() => {})
    }

    // Step 6: Translations for first 300 issues
    const LANGS = ['hi','bn','ta','te','mr','gu','kn','ml','pa','or','ur']
    for (const issue of allIssues.slice(0, 300)) {
      const translations = [{ language: 'en', name: issue.name }]
      for (const lang of LANGS) {
        try {
          await db.healthIssueTranslation.create({
            data: { issueId: issue.id, language: lang, name: issue.name, description: `${issue.name} (${lang})` },
          }).catch(() => {})
        } catch { /* skip */ }
      }
    }

    // Step 7: Wing approaches for first 200 issues
    for (const issue of allIssues.slice(0, 200)) {
      const wingData = WING_APPROACHES[issue.name] || DEFAULT_WING
      for (const modality of ['ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY'] as const) {
        await db.healthIssueWing.create({
          data: {
            issueId: issue.id,
            modality,
            approach: wingData[modality],
            lifestyleAdvice: modality === 'ALLOPATHY' ? 'Balanced diet, regular exercise, adequate sleep' : modality === 'AYURVEDA' ? 'Ahara-Vihara as per Prakriti, Dinacharya, Ritucharya' : 'Healthy lifestyle, avoid strong smells/coffee',
            whenToSeeDoctor: 'If symptoms persist beyond 7 days, worsen, or new symptoms appear',
            evidenceLevel: modality === 'ALLOPATHY' ? 'STRONG' : modality === 'AYURVEDA' ? 'MODERATE' : 'LIMITED',
          },
        }).catch(() => {})
      }
    }

    // Step 8: Create Allopathy Medicines
    const alloMeds = [
      { name: 'Paracetamol', generic: 'Acetaminophen', category: 'ANALGESIC', form: 'TABLET', strength: '500mg', otc: true, ingredients: [{ i: 'Paracetamol', q: '500mg', r: 'ACTIVE' }], indications: [{ ind: 'Fever', why: 'First-line antipyretic, safe and effective', when: 'Temperature above 100.4°F', how: '1-2 tablets every 4-6 hours, max 4g/day', dose: '1000mg every 6 hours', dur: '3-5 days' },{ ind: 'Headache', why: 'Safe first-line analgesic', when: 'Mild to moderate headache', how: '1-2 tablets as needed, max 4g/day', dose: '500-1000mg', dur: 'As needed' },{ ind: 'Body Pain', why: 'Effective for generalized mild pain', when: 'Mild musculoskeletal pain', how: '1 tablet every 4-6 hours', dose: '500mg', dur: '3-5 days' }], contra: [{ c: 'Severe hepatic impairment', reason: 'Risk of hepatotoxicity', sev: 'ABSOLUTE' },{ c: 'Active liver disease', reason: 'Metabolized by liver', sev: 'ABSOLUTE' }], interactions: [{ with: 'Warfarin', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Increased INR', rec: 'Monitor INR closely' }], warnings: [{ w: 'Hepatotoxicity in overdose', cat: 'PRESCRIBING' },{ w: 'Avoid alcohol', cat: 'PATIENT' }], sideEffects: [{ se: 'Nausea', freq: 'COMMON', sev: 'MILD' },{ se: 'Rash', freq: 'UNCOMMON', sev: 'MILD' },{ se: 'Liver damage (overdose)', freq: 'RARE', sev: 'SEVERE' }], age: [{ min: 2, max: 144, group: 'CHILD', adj: '10-15mg/kg/dose', caut: 'Max 60mg/kg/day' }], pop: [{ p: 'PREGNANT', safety: 'SAFE', rationale: 'Considered safe in all trimesters' },{ p: 'LACTATING', safety: 'SAFE', rationale: 'Excreted in breast milk in small amounts' }], timing: [{ t: 'AFTER_MEAL', instr: 'Take after food to reduce gastric irritation' }], food: [], durRules: [{ min: '1 day', max: '5 days', def: '3 days', cond: 'Fever/pain', rev: 'Review if symptoms persist beyond 5 days' }], monitor: [{ param: 'Liver function', freq: 'If prolonged use >14 days', thresh: 'ALT > 3x ULN', act: 'Discontinue' }] },
      { name: 'Ibuprofen', generic: 'Ibuprofen', category: 'ANALGESIC', form: 'TABLET', strength: '400mg', otc: true, ingredients: [{ i: 'Ibuprofen', q: '400mg', r: 'ACTIVE' }], indications: [{ ind: 'Pain', why: 'Anti-inflammatory plus analgesic', when: 'Inflammatory pain or paracetamol insufficient', how: '200-400mg every 4-6 hours with food', dose: '400mg every 6 hours', dur: '5-10 days' },{ ind: 'Fever', why: 'Antipyretic with anti-inflammatory action', when: 'Fever not responding to paracetamol', how: '200-400mg every 4-6 hours', dose: '400mg', dur: '3 days' },{ ind: 'Arthritis', why: 'Reduces inflammation and joint pain', when: 'Osteoarthritis or rheumatoid arthritis', how: '400-600mg 3 times daily with food', dose: '400mg TID', dur: 'Ongoing with monitoring' }], contra: [{ c: 'Active peptic ulcer', reason: 'Increases GI bleeding risk', sev: 'ABSOLUTE' },{ c: 'Third trimester pregnancy', reason: 'Premature ductus arteriosus closure', sev: 'ABSOLUTE' },{ c: 'Severe heart failure', reason: 'May worsen fluid retention', sev: 'ABSOLUTE' }], interactions: [{ with: 'Aspirin', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Reduced antiplatelet effect', rec: 'Avoid combination' },{ with: 'Warfarin', type: 'DRUG_DRUG', sev: 'MAJOR', effect: 'Increased bleeding risk', rec: 'Avoid combination or monitor closely' },{ with: 'ACE inhibitors', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Reduced antihypertensive effect', rec: 'Monitor blood pressure' }], warnings: [{ w: 'GI bleeding risk', cat: 'BLACK_BOX' },{ w: 'Cardiovascular risk with prolonged use', cat: 'PRESCRIBING' }], sideEffects: [{ se: 'Dyspepsia', freq: 'COMMON', sev: 'MILD' },{ se: 'Nausea', freq: 'COMMON', sev: 'MILD' },{ se: 'GI bleeding', freq: 'UNCOMMON', sev: 'SEVERE' },{ se: 'Renal impairment', freq: 'UNCOMMON', sev: 'MODERATE' }], age: [{ min: 6, max: 216, group: 'CHILD', adj: '5-10mg/kg/dose', caut: 'Not under 6 months' }], pop: [{ p: 'PREGNANT', safety: 'AVOID', rationale: 'Contraindicated in 3rd trimester', tri: 'THIRD' },{ p: 'LACTATING', safety: 'CAUTION', rationale: 'Low levels in breast milk' }], timing: [{ t: 'WITH_MEAL', instr: 'Take with or after food' }], food: [{ f: 'Alcohol', instr: 'AVOID', reason: 'Increased GI bleeding risk' }], durRules: [{ min: '1 day', max: '10 days', def: '5 days', cond: 'Acute pain', rev: 'Review after 10 days' }], monitor: [{ param: 'Renal function', freq: 'If prolonged use', thresh: 'Creatinine rise', act: 'Reduce dose or discontinue' }] },
      { name: 'Amoxicillin', generic: 'Amoxicillin', category: 'ANTIBIOTIC', form: 'CAPSULE', strength: '500mg', otc: false, ingredients: [{ i: 'Amoxicillin', q: '500mg', r: 'ACTIVE' }], indications: [{ ind: 'Bacterial Infection', why: 'Broad-spectrum penicillin antibiotic', when: 'Confirmed or suspected bacterial infection', how: '1 capsule 3 times daily for 5-7 days', dose: '500mg TID', dur: '5-7 days' },{ ind: 'Ear Infection', why: 'First-line for otitis media', when: 'Acute otitis media', how: '500mg 3 times daily', dose: '500mg TID', dur: '5-7 days' },{ ind: 'Throat Infection', why: 'Effective for strep pharyngitis', when: 'Group A streptococcal pharyngitis', how: '500mg 3 times daily for 10 days', dose: '500mg TID', dur: '10 days' }], contra: [{ c: 'Penicillin allergy', reason: 'Risk of anaphylaxis', sev: 'ABSOLUTE' }], interactions: [{ with: 'Allopurinol', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Increased rash risk', rec: 'Monitor for rash' }], warnings: [{ w: 'Anaphylaxis risk in penicillin-allergic patients', cat: 'BLACK_BOX' }], sideEffects: [{ se: 'Diarrhea', freq: 'COMMON', sev: 'MILD' },{ se: 'Rash', freq: 'COMMON', sev: 'MILD' },{ se: 'Nausea', freq: 'COMMON', sev: 'MILD' },{ se: 'Allergic reaction', freq: 'RARE', sev: 'SEVERE' }], age: [{ min: 1, max: 144, group: 'CHILD', adj: '20-40mg/kg/day in divided doses' }], pop: [{ p: 'PREGNANT', safety: 'SAFE', rationale: 'Category B - generally safe' },{ p: 'LACTATING', safety: 'CAUTION', rationale: 'Excreted in breast milk' }], timing: [{ t: 'AFTER_MEAL', instr: 'Take after food' }], food: [], durRules: [{ min: '5 days', max: '14 days', def: '7 days', cond: 'Bacterial infection', rev: 'Complete full course' }], monitor: [] },
      { name: 'Omeprazole', generic: 'Omeprazole', category: 'GI', form: 'CAPSULE', strength: '20mg', otc: false, ingredients: [{ i: 'Omeprazole', q: '20mg', r: 'ACTIVE' }], indications: [{ ind: 'GERD', why: 'Proton pump inhibitor reduces gastric acid', when: 'Heartburn, acid reflux, esophagitis', how: '1 capsule before breakfast', dose: '20mg once daily', dur: '4-8 weeks' },{ ind: 'Peptic Ulcer', why: 'Heals ulcer by reducing acid', when: 'Gastric or duodenal ulcer', how: '20-40mg once daily before breakfast', dose: '20mg', dur: '4-8 weeks' },{ ind: 'Gastritis', why: 'Reduces gastric acid secretion', when: 'Acute or chronic gastritis', how: '20mg once daily before breakfast', dose: '20mg', dur: '2-4 weeks' }], contra: [{ c: 'Hypersensitivity to PPIs', reason: 'Allergic reaction', sev: 'ABSOLUTE' }], interactions: [{ with: 'Clopidogrel', type: 'DRUG_DRUG', sev: 'MAJOR', effect: 'Reduced antiplatelet effect', rec: 'Use Pantoprazole instead' },{ with: 'Ketoconazole', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Reduced absorption', rec: 'Space apart' }], warnings: [{ w: 'Long-term use: risk of osteoporosis, B12 deficiency, C. diff', cat: 'PRESCRIBING' }], sideEffects: [{ se: 'Headache', freq: 'COMMON', sev: 'MILD' },{ se: 'Diarrhea', freq: 'COMMON', sev: 'MILD' },{ se: 'Abdominal pain', freq: 'COMMON', sev: 'MILD' },{ se: 'B12 deficiency (long-term)', freq: 'RARE', sev: 'MODERATE' }], age: [{ min: 12, max: 216, group: 'CHILD', adj: '1mg/kg once daily' }], pop: [{ p: 'PREGNANT', safety: 'CAUTION', rationale: 'Category C - use if benefit outweighs risk' },{ p: 'LACTATING', safety: 'CAUTION', rationale: 'Excreted in breast milk' }], timing: [{ t: 'BEFORE_MEAL', instr: 'Take 30 minutes before breakfast' }], food: [], durRules: [{ min: '2 weeks', max: '8 weeks', def: '4 weeks', cond: 'GERD', rev: 'Step down to H2 blocker or PRN' }], monitor: [{ param: 'Magnesium', freq: 'If prolonged use >1 year', thresh: 'Low magnesium', act: 'Supplement magnesium' }] },
      { name: 'Amlodipine', generic: 'Amlodipine', category: 'ANTIHYPERTENSIVE', form: 'TABLET', strength: '5mg', otc: false, ingredients: [{ i: 'Amlodipine', q: '5mg', r: 'ACTIVE' }], indications: [{ ind: 'Hypertension', why: 'Calcium channel blocker, once-daily dosing', when: 'Elevated blood pressure', how: '1 tablet once daily', dose: '5mg once daily', dur: 'Ongoing' },{ ind: 'Angina Pectoris', why: 'Reduces cardiac oxygen demand', when: 'Stable angina', how: '5-10mg once daily', dose: '5mg', dur: 'Ongoing' }], contra: [{ c: 'Severe aortic stenosis', reason: 'May cause cardiovascular collapse', sev: 'ABSOLUTE' },{ c: 'Cardiogenic shock', reason: 'May worsen condition', sev: 'ABSOLUTE' }], interactions: [{ with: 'Simvastatin', type: 'DRUG_DRUG', sev: 'MAJOR', effect: 'Increased statin levels', rec: 'Limit simvastatin to 20mg' }], warnings: [{ w: 'Peripheral edema common', cat: 'PRESCRIBING' }], sideEffects: [{ se: 'Ankle swelling', freq: 'COMMON', sev: 'MILD' },{ se: 'Headache', freq: 'COMMON', sev: 'MILD' },{ se: 'Flushing', freq: 'COMMON', sev: 'MILD' },{ se: 'Dizziness', freq: 'UNCOMMON', sev: 'MILD' }], age: [], pop: [{ p: 'PREGNANT', safety: 'CAUTION', rationale: 'Limited safety data' },{ p: 'LACTATING', safety: 'CAUTION', rationale: 'Unknown excretion in breast milk' }], timing: [{ t: 'AFTER_MEAL', instr: 'Take at same time daily' }], food: [{ f: 'Grapefruit juice', instr: 'AVOID', reason: 'Increases amlodipine levels' }], durRules: [{ min: 'Ongoing', max: 'Ongoing', def: 'Ongoing', cond: 'Hypertension' }], monitor: [{ param: 'Blood pressure', freq: 'Every 2-4 weeks until controlled', thresh: 'BP > 140/90', act: 'Increase dose or add second agent' }] },
      { name: 'Metformin', generic: 'Metformin', category: 'ANTIDIABETIC', form: 'TABLET', strength: '500mg', otc: false, ingredients: [{ i: 'Metformin HCl', q: '500mg', r: 'ACTIVE' }], indications: [{ ind: 'Diabetes Type 2', why: 'First-line oral hypoglycemic, reduces hepatic glucose output', when: 'Type 2 diabetes diagnosis', how: 'Start 500mg once daily, titrate up', dose: '500mg twice daily', dur: 'Ongoing' },{ ind: 'PCOS', why: 'Improves insulin sensitivity', when: 'PCOS with insulin resistance', how: '500mg 2-3 times daily', dose: '500mg TID', dur: 'Ongoing' }], contra: [{ c: 'Severe renal impairment (eGFR<30)', reason: 'Risk of lactic acidosis', sev: 'ABSOLUTE' },{ c: 'Metabolic acidosis', reason: 'Risk of lactic acidosis', sev: 'ABSOLUTE' }], interactions: [{ with: 'Alcohol', type: 'DRUG_FOOD', sev: 'MAJOR', effect: 'Increased lactic acidosis risk', rec: 'Avoid alcohol' }], warnings: [{ w: 'Lactic acidosis risk (rare but serious)', cat: 'BLACK_BOX' }], sideEffects: [{ se: 'Nausea', freq: 'VERY_COMMON', sev: 'MILD' },{ se: 'Diarrhea', freq: 'VERY_COMMON', sev: 'MILD' },{ se: 'Abdominal pain', freq: 'COMMON', sev: 'MILD' },{ se: 'Lactic acidosis', freq: 'VERY_RARE', sev: 'LIFE_THREATENING' }], age: [{ min: 120, max: null, group: 'ADULT', adj: 'Start low, titrate slowly' }], pop: [{ p: 'PREGNANT', safety: 'AVOID', rationale: 'Insulin preferred in pregnancy' },{ p: 'RENAL_IMPAIRMENT', safety: 'AVOID', rationale: 'eGFR <30: contraindicated' }], timing: [{ t: 'AFTER_MEAL', instr: 'Take with or after food to reduce GI side effects' }], food: [{ f: 'Alcohol', instr: 'AVOID', reason: 'Lactic acidosis risk' }], durRules: [{ min: 'Ongoing', max: 'Ongoing', def: 'Ongoing', cond: 'Type 2 Diabetes' }], monitor: [{ param: 'Renal function', freq: 'At least annually', thresh: 'eGFR < 30', act: 'Discontinue' },{ param: 'HbA1c', freq: 'Every 3 months', thresh: 'HbA1c > 7%', act: 'Intensify therapy' }] },
      { name: 'Salbutamol', generic: 'Albuterol', category: 'RESPIRATORY', form: 'INHALER', strength: '100mcg/puff', otc: false, ingredients: [{ i: 'Salbutamol', q: '100mcg per puff', r: 'ACTIVE' }], indications: [{ ind: 'Asthma', why: 'Quick-relief bronchodilator', when: 'Acute bronchospasm, wheezing', how: '2 puffs as needed, max 8 puffs/day', dose: '2 puffs PRN', dur: 'As needed' },{ ind: 'COPD', why: 'Bronchodilation for COPD exacerbation', when: 'Breathlessness, wheezing', how: '2 puffs as needed', dose: '2 puffs PRN', dur: 'As needed' }], contra: [{ c: 'Hypersensitivity to salbutamol', reason: 'Allergic reaction', sev: 'ABSOLUTE' }], interactions: [{ with: 'Beta-blockers', type: 'DRUG_DRUG', sev: 'MAJOR', effect: 'Reduced bronchodilator effect', rec: 'Avoid non-selective beta-blockers' }], warnings: [{ w: 'Overuse indicates poor control - seek medical review', cat: 'PATIENT' }], sideEffects: [{ se: 'Tremor', freq: 'COMMON', sev: 'MILD' },{ se: 'Palpitations', freq: 'COMMON', sev: 'MILD' },{ se: 'Headache', freq: 'UNCOMMON', sev: 'MILD' },{ se: 'Hypokalemia', freq: 'UNCOMMON', sev: 'MODERATE' }], age: [{ min: 48, max: null, group: 'CHILD', adj: '1 puff, may repeat once' }], pop: [{ p: 'PREGNANT', safety: 'SAFE', rationale: 'Inhaled route, minimal systemic absorption' },{ p: 'LACTATING', safety: 'SAFE', rationale: 'Minimal systemic exposure' }], timing: [{ t: 'EMPTY_STOMACH', instr: 'Use as needed, rinse mouth after' }], food: [], durRules: [{ min: 'As needed', max: 'If using >2 times/week, step up therapy', def: 'PRN' }], monitor: [] },
      { name: 'Cetirizine', generic: 'Cetirizine', category: 'ALLERGY', form: 'TABLET', strength: '10mg', otc: true, ingredients: [{ i: 'Cetirizine HCl', q: '10mg', r: 'ACTIVE' }], indications: [{ ind: 'Allergic Rhinitis', why: 'Second-generation antihistamine, non-sedating', when: 'Sneezing, runny nose, itchy eyes', how: '1 tablet once daily', dose: '10mg once daily', dur: 'As needed' },{ ind: 'Urticaria', why: 'Reduces hives and itching', when: 'Hives, skin rash', how: '1 tablet once daily', dose: '10mg', dur: 'As needed' }], contra: [{ c: 'Severe renal impairment', reason: 'Reduced clearance', sev: 'RELATIVE' }], interactions: [{ with: 'Alcohol', type: 'DRUG_FOOD', sev: 'MINOR', effect: 'Increased drowsiness', rec: 'Avoid alcohol' }], warnings: [{ w: 'May cause drowsiness in some patients', cat: 'PATIENT' }], sideEffects: [{ se: 'Drowsiness', freq: 'UNCOMMON', sev: 'MILD' },{ se: 'Dry mouth', freq: 'COMMON', sev: 'MILD' },{ se: 'Headache', freq: 'UNCOMMON', sev: 'MILD' }], age: [{ min: 24, max: null, group: 'CHILD', adj: '5mg (half tablet)' }], pop: [{ p: 'PREGNANT', safety: 'SAFE', rationale: 'Category B' },{ p: 'LACTATING', safety: 'CAUTION', rationale: 'Excreted in breast milk' }], timing: [{ t: 'AFTER_MEAL', instr: 'Take in evening if drowsiness occurs' }], food: [], durRules: [], monitor: [] },
      { name: 'Atorvastatin', generic: 'Atorvastatin', category: 'CARDIOVASCULAR', form: 'TABLET', strength: '10mg', otc: false, ingredients: [{ i: 'Atorvastatin', q: '10mg', r: 'ACTIVE' }], indications: [{ ind: 'High Cholesterol', why: 'HMG-CoA reductase inhibitor (statin)', when: 'Elevated LDL cholesterol', how: '1 tablet at bedtime', dose: '10-40mg at bedtime', dur: 'Ongoing' }], contra: [{ c: 'Active liver disease', reason: 'Risk of hepatotoxicity', sev: 'ABSOLUTE' },{ c: 'Pregnancy', reason: 'Teratogenic', sev: 'ABSOLUTE' }], interactions: [{ with: 'Clarithromycin', type: 'DRUG_DRUG', sev: 'MAJOR', effect: 'Increased statin levels, rhabdomyolysis risk', rec: 'Use azithromycin instead' }], warnings: [{ w: 'Rhabdomyolysis risk', cat: 'BLACK_BOX' }], sideEffects: [{ se: 'Muscle pain', freq: 'COMMON', sev: 'MODERATE' },{ se: 'Liver enzyme elevation', freq: 'UNCOMMON', sev: 'MODERATE' },{ se: 'Rhabdomyolysis', freq: 'RARE', sev: 'SEVERE' }], age: [], pop: [{ p: 'PREGNANT', safety: 'CONTRAINDICATED', rationale: 'Teratogenic - Category X' },{ p: 'LACTATING', safety: 'CONTRAINDICATED', rationale: 'Not safe in lactation' }], timing: [{ t: 'BEDTIME', instr: 'Take at bedtime (cholesterol synthesis peaks at night)' }], food: [{ f: 'Grapefruit juice', instr: 'AVOID', reason: 'Increases statin levels significantly' }], durRules: [{ min: 'Ongoing', max: 'Ongoing', def: 'Ongoing', cond: 'Hyperlipidemia' }], monitor: [{ param: 'Liver function', freq: 'Before starting, then at 12 weeks', thresh: 'ALT > 3x ULN', act: 'Discontinue or reduce dose' },{ param: 'Lipid profile', freq: 'Every 3-6 months', thresh: 'LDL above target', act: 'Intensify therapy' }] },
      { name: 'Azithromycin', generic: 'Azithromycin', category: 'ANTIBIOTIC', form: 'TABLET', strength: '500mg', otc: false, ingredients: [{ i: 'Azithromycin', q: '500mg', r: 'ACTIVE' }], indications: [{ ind: 'Bacterial Infection', why: 'Macrolide antibiotic, convenient once-daily dosing', when: 'Respiratory, skin, or genital infections', how: '500mg day 1, then 250mg days 2-5', dose: '500mg day 1', dur: '5 days' },{ ind: 'Pneumonia', why: 'Effective against atypical pneumonia pathogens', when: 'Community-acquired pneumonia', how: '500mg daily for 3-5 days', dose: '500mg', dur: '3-5 days' }], contra: [{ c: 'Macrolide allergy', reason: 'Hypersensitivity', sev: 'ABSOLUTE' },{ c: 'QT prolongation history', reason: 'Risk of arrhythmia', sev: 'ABSOLUTE' }], interactions: [{ with: 'Warfarin', type: 'DRUG_DRUG', sev: 'MAJOR', effect: 'Increased anticoagulant effect', rec: 'Monitor INR closely' }], warnings: [{ w: 'QT prolongation risk', cat: 'PRESCRIBING' }], sideEffects: [{ se: 'Nausea', freq: 'COMMON', sev: 'MILD' },{ se: 'Diarrhea', freq: 'COMMON', sev: 'MILD' },{ se: 'Abdominal pain', freq: 'COMMON', sev: 'MILD' }], age: [{ min: 6, max: 216, group: 'CHILD', adj: '10mg/kg day 1, 5mg/kg days 2-5' }], pop: [{ p: 'PREGNANT', safety: 'SAFE', rationale: 'Category B' }], timing: [{ t: 'EMPTY_STOMACH', instr: 'Take 1 hour before or 2 hours after food' }], food: [{ f: 'Antacids', instr: 'SEPARATE_BY_2H', reason: 'Reduced absorption' }], durRules: [{ min: '3 days', max: '5 days', def: '5 days' }], monitor: [] },
      { name: 'Ciprofloxacin', generic: 'Ciprofloxacin', category: 'ANTIBIOTIC', form: 'TABLET', strength: '500mg', otc: false, ingredients: [{ i: 'Ciprofloxacin', q: '500mg', r: 'ACTIVE' }], indications: [{ ind: 'UTI', why: 'Fluoroquinolone effective against gram-negative UTI pathogens', when: 'Complicated or recurrent UTI', how: '500mg twice daily for 5-7 days', dose: '500mg BD', dur: '5-7 days' },{ ind: 'Bacterial Infection', why: 'Broad-spectrum for serious infections', when: 'When other antibiotics unsuitable', how: '500-750mg twice daily', dose: '500mg BD', dur: '7-14 days' }], contra: [{ c: 'Fluoroquinolone allergy', reason: 'Hypersensitivity', sev: 'ABSOLUTE' },{ c: 'Children under 18', reason: 'Cartilage damage risk', sev: 'ABSOLUTE' },{ c: 'QT prolongation', reason: 'Arrhythmia risk', sev: 'ABSOLUTE' }], interactions: [{ with: 'Antacids', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Reduced absorption', rec: 'Space 2 hours apart' },{ with: 'Theophylline', type: 'DRUG_DRUG', sev: 'MAJOR', effect: 'Increased theophylline levels', rec: 'Monitor levels' }], warnings: [{ w: 'Tendon rupture risk (Achilles)', cat: 'BLACK_BOX' },{ w: 'Fluoroquinolone-associated disability', cat: 'BLACK_BOX' }], sideEffects: [{ se: 'Nausea', freq: 'COMMON', sev: 'MILD' },{ se: 'Diarrhea', freq: 'COMMON', sev: 'MILD' },{ se: 'Tendon pain', freq: 'RARE', sev: 'SEVERE' },{ se: 'Dizziness', freq: 'UNCOMMON', sev: 'MILD' }], age: [{ min: 216, max: null, group: 'ADULT' }], pop: [{ p: 'PREGNANT', safety: 'AVOID', rationale: 'Category C - cartilage risk' },{ p: 'PEDIATRIC', safety: 'AVOID', rationale: 'Cartilage damage risk' }], timing: [{ t: 'EMPTY_STOMACH', instr: 'Take 1 hour before or 2 hours after food' }], food: [{ f: 'Dairy products', instr: 'SEPARATE_BY_2H', reason: 'Calcium reduces absorption' },{ f: 'Antacids', instr: 'SEPARATE_BY_2H', reason: 'Reduced absorption' }], durRules: [{ min: '5 days', max: '14 days', def: '7 days' }], monitor: [] },
      { name: 'Losartan', generic: 'Losartan', category: 'ANTIHYPERTENSIVE', form: 'TABLET', strength: '50mg', otc: false, ingredients: [{ i: 'Losartan Potassium', q: '50mg', r: 'ACTIVE' }], indications: [{ ind: 'Hypertension', why: 'ARB - blocks angiotensin II, reduces BP with renal protection', when: 'Hypertension, especially with diabetes', how: '1 tablet once daily', dose: '50mg once daily', dur: 'Ongoing' },{ ind: 'Diabetic Nephropathy', why: 'Renal protective effect in diabetes', when: 'Type 2 diabetes with proteinuria', how: '50-100mg once daily', dose: '50mg', dur: 'Ongoing' }], contra: [{ c: 'Pregnancy', reason: 'Fetal toxicity, especially 2nd/3rd trimester', sev: 'ABSOLUTE' },{ c: 'Bilateral renal artery stenosis', reason: 'Renal failure risk', sev: 'ABSOLUTE' }], interactions: [{ with: 'NSAIDs', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Reduced antihypertensive and renal effect', rec: 'Monitor renal function' },{ with: 'Potassium supplements', type: 'DRUG_DRUG', sev: 'MODERATE', effect: 'Hyperkalemia risk', rec: 'Monitor potassium' }], warnings: [{ w: 'Fetal toxicity in pregnancy', cat: 'PREGNANCY' }], sideEffects: [{ se: 'Dizziness', freq: 'COMMON', sev: 'MILD' },{ se: 'Hyperkalemia', freq: 'UNCOMMON', sev: 'MODERATE' },{ se: 'Fatigue', freq: 'COMMON', sev: 'MILD' }], age: [], pop: [{ p: 'PREGNANT', safety: 'CONTRAINDICATED', rationale: 'Fetal toxicity - Category D' },{ p: 'LACTATING', safety: 'CAUTION', rationale: 'Limited data' },{ p: 'RENAL_IMPAIRMENT', safety: 'CAUTION', rationale: 'Monitor renal function' }], timing: [{ t: 'AFTER_MEAL', instr: 'Take at same time daily' }], food: [{ f: 'Potassium-rich foods', instr: 'CAUTION', reason: 'Risk of hyperkalemia' }], durRules: [{ min: 'Ongoing', max: 'Ongoing', def: 'Ongoing' }], monitor: [{ param: 'Blood pressure', freq: 'Every 2-4 weeks until controlled' },{ param: 'Renal function', freq: 'At baseline and periodically' },{ param: 'Potassium', freq: 'At baseline and periodically' }] },
    ]

    for (const med of alloMeds) {
      const m = await db.medicine.create({
        data: {
          name: med.name, genericName: med.generic, modality: 'ALLOPATHY', category: med.category,
          form: med.form, strength: med.strength, isOTC: med.otc, isPrescription: !med.otc,
        },
      })
      for (const ing of med.ingredients) {
        await db.medicineIngredient.create({ data: { medicineId: m.id, ingredient: ing.i, quantity: ing.q, role: ing.r } }).catch(() => {})
      }
      for (const ind of med.indications) {
        const issue = allIssues.find(i => i.name === ind.ind || i.name.includes(ind.ind))
        await db.medicineIndication.create({ data: { medicineId: m.id, issueId: issue?.id, indication: ind.ind, whyToUse: ind.why, whenToUse: ind.when, howToUseDaily: ind.how, medianDose: ind.dose, duration: ind.dur, priority: 1 } }).catch(() => {})
      }
      for (const c of med.contra) {
        await db.medicineContraindication.create({ data: { medicineId: m.id, contraindication: c.c, reason: c.reason, severity: c.sev } }).catch(() => {})
      }
      for (const ix of med.interactions) {
        await db.medicineInteraction.create({ data: { medicineId: m.id, interactingWith: ix.with, interactionType: ix.type, severity: ix.sev, effect: ix.effect, recommendation: ix.rec } }).catch(() => {})
      }
      for (const w of med.warnings) {
        await db.medicineWarning.create({ data: { medicineId: m.id, warning: w.w, category: w.cat } }).catch(() => {})
      }
      for (const se of med.sideEffects) {
        await db.medicineSideEffect.create({ data: { medicineId: m.id, sideEffect: se.se, frequency: se.freq, severity: se.sev } }).catch(() => {})
      }
      for (const a of med.age) {
        await db.medicineAgeRule.create({ data: { medicineId: m.id, minAge: a.min, maxAge: a.max ?? undefined, ageGroup: a.group, doseAdjustment: a.adj, caution: a.caut } }).catch(() => {})
      }
      for (const p of med.pop) {
        await db.medicinePopulationRule.create({ data: { medicineId: m.id, population: p.p, safetyCategory: p.safety, rationale: p.rationale } }).catch(() => {})
      }
      for (const t of med.timing) {
        await db.medicineTimingRule.create({ data: { medicineId: m.id, timing: t.t, instruction: t.instr } }).catch(() => {})
      }
      for (const f of med.food) {
        await db.medicineFoodInstruction.create({ data: { medicineId: m.id, food: f.f, instruction: f.instr, reason: f.reason } }).catch(() => {})
      }
      for (const d of med.durRules) {
        await db.medicineDurationRule.create({ data: { medicineId: m.id, minDuration: d.min, maxDuration: d.max, defaultDuration: d.def, condition: d.cond, reviewBy: d.rev } }).catch(() => {})
      }
      for (const mn of med.monitor) {
        await db.medicineMonitoringRule.create({ data: { medicineId: m.id, parameter: mn.param, frequency: mn.freq, threshold: mn.thresh, action: mn.act } }).catch(() => {})
      }
    }

    // Additional Allopathy medicines (quick batch)
    const extraAllo = [
      { n: 'Diclofenac', c: 'ANALGESIC', f: 'TABLET', s: '50mg' },
      { n: 'Aspirin', c: 'ANALGESIC', f: 'TABLET', s: '75mg' },
      { n: 'Naproxen', c: 'ANALGESIC', f: 'TABLET', s: '250mg' },
      { n: 'Pantoprazole', c: 'GI', f: 'TABLET', s: '40mg' },
      { n: 'Domperidone', c: 'GI', f: 'TABLET', s: '10mg' },
      { n: 'Ondansetron', c: 'GI', f: 'TABLET', s: '4mg' },
      { n: 'Loperamide', c: 'GI', f: 'CAPSULE', s: '2mg' },
      { n: 'Lactulose', c: 'GI', f: 'SYRUP', s: '10g/15ml' },
      { n: 'Metoprolol', c: 'ANTIHYPERTENSIVE', f: 'TABLET', s: '50mg' },
      { n: 'Ramipril', c: 'ANTIHYPERTENSIVE', f: 'TABLET', s: '5mg' },
      { n: 'Hydrochlorothiazide', c: 'DIURETIC', f: 'TABLET', s: '25mg' },
      { n: 'Clopidogrel', c: 'CARDIOVASCULAR', f: 'TABLET', s: '75mg' },
      { n: 'Rosuvastatin', c: 'CARDIOVASCULAR', f: 'TABLET', s: '10mg' },
      { n: 'Glimepiride', c: 'ANTIDIABETIC', f: 'TABLET', s: '2mg' },
      { n: 'Sitagliptin', c: 'ANTIDIABETIC', f: 'TABLET', s: '100mg' },
      { n: 'Montelukast', c: 'RESPIRATORY', f: 'TABLET', s: '10mg' },
      { n: 'Budesonide', c: 'RESPIRATORY', f: 'INHALER', s: '200mcg' },
      { n: 'Amitriptyline', c: 'PSYCHIATRIC', f: 'TABLET', s: '25mg' },
      { n: 'Fluoxetine', c: 'PSYCHIATRIC', f: 'CAPSULE', s: '20mg' },
      { n: 'Alprazolam', c: 'PSYCHIATRIC', f: 'TABLET', s: '0.5mg' },
      { n: 'Sertraline', c: 'PSYCHIATRIC', f: 'TABLET', s: '50mg' },
      { n: 'Clobetasol', c: 'DERMATOLOGICAL', f: 'CREAM', s: '0.05%' },
      { n: 'Clotrimazole', c: 'DERMATOLOGICAL', f: 'CREAM', s: '1%' },
      { n: 'Permethrin', c: 'DERMATOLOGICAL', f: 'CREAM', s: '5%' },
      { n: 'Levothyroxine', c: 'ENDOCRINE', f: 'TABLET', s: '50mcg' },
      { n: 'Prednisolone', c: 'STEROID', f: 'TABLET', s: '5mg' },
      { n: 'Albendazole', c: 'ANTHELMINTIC', f: 'TABLET', s: '400mg' },
      { n: 'Iron Supplement', c: 'HEMATINIC', f: 'TABLET', s: '325mg' },
      { n: 'Vitamin D3', c: 'VITAMIN', f: 'CAPSULE', s: '60000IU' },
      { n: 'Calcium Carbonate', c: 'SUPPLEMENT', f: 'TABLET', s: '500mg' },
      { n: 'Multivitamin', c: 'VITAMIN', f: 'TABLET', s: 'Standard' },
      { n: 'Folic Acid', c: 'VITAMIN', f: 'TABLET', s: '5mg' },
      { n: 'Doxycycline', c: 'ANTIBIOTIC', f: 'CAPSULE', s: '100mg' },
      { n: 'Metronidazole', c: 'ANTIBIOTIC', f: 'TABLET', s: '400mg' },
      { n: 'Ceftriaxone', c: 'ANTIBIOTIC', f: 'INJECTION', s: '1g' },
      { n: 'Dicyclomine', c: 'GI', f: 'TABLET', s: '20mg' },
      { n: 'Ranitidine', c: 'GI', f: 'TABLET', s: '150mg' },
      { n: 'Sucralfate', c: 'GI', f: 'TABLET', s: '1g' },
      { n: 'Levocetirizine', c: 'ALLERGY', f: 'TABLET', s: '5mg' },
      { n: 'Carbamazepine', c: 'NEUROLOGICAL', f: 'TABLET', s: '200mg' },
      { n: 'Gabapentin', c: 'NEUROLOGICAL', f: 'CAPSULE', s: '300mg' },
    ]

    for (const med of extraAllo) {
      const m = await db.medicine.create({
        data: { name: med.n, modality: 'ALLOPATHY', category: med.c, form: med.f, strength: med.s, isPrescription: true },
      })
      await db.medicineIngredient.create({ data: { medicineId: m.id, ingredient: med.n, quantity: med.s, role: 'ACTIVE' } }).catch(() => {})
    }

    // Ayurveda Medicines
    const ayurMeds = [
      { n: 'Ashwagandha', c: 'RASAYANA', f: 'CHURNA', s: '5g', indications: [{ ind: 'Stress', why: 'Adaptogenic herb reduces cortisol and improves vitality', how: '3-5g churna twice daily with warm milk' },{ ind: 'Anxiety', why: 'Anxiolytic without sedation', how: '3-5g with warm milk at bedtime' }] },
      { n: 'Triphala', c: 'DIGESTIVE', f: 'CHURNA', s: '5g', indications: [{ ind: 'Constipation', why: 'Gentle bowel regulator and detoxifier', how: '3-5g at bedtime with warm water' },{ ind: 'Dyspepsia', why: 'Improves digestion and absorption', how: '2-3g before food' }] },
      { n: 'Chyawanprash', c: 'RASAYANA', f: 'LEHYAM', s: '500g', indications: [{ ind: 'Common Cold', why: 'Premier immunomodulator with Amla base', how: '1-2 teaspoon twice daily' },{ ind: 'Weakness', why: 'Rejuvenative tonic', how: '1-2 teaspoon with warm milk' }] },
      { n: 'Giloy (Guduchi)', c: 'RASAYANA', f: 'KWATH', s: '15-30ml', indications: [{ ind: 'Fever', why: 'Potent antipyretic and immunomodulator', how: '15-30ml kwath twice daily' },{ ind: 'Diabetes Type 2', why: 'Hypoglycemic and immunomodulatory', how: '15-30ml kwath before food' }] },
      { n: 'Tulsi (Holy Basil)', c: 'RESPIRATORY', f: 'ARK', s: '5-10ml', indications: [{ ind: 'Cough', why: 'Natural antimicrobial for respiratory health', how: '5-10ml ark with warm water' },{ ind: 'Common Cold', why: 'Antiviral and antibacterial properties', how: '5-10ml twice daily' }] },
      { n: 'Turmeric (Haridra)', c: 'ANTIINFLAMMATORY', f: 'CHURNA', s: '3g', indications: [{ ind: 'Joint Pain', why: 'Curcumin is potent anti-inflammatory', how: '1-3g with warm milk' },{ ind: 'Skin Allergy', why: 'Anti-allergic and blood purifying', how: '1-2g with honey' }] },
      { n: 'Brahmi', c: 'MEDHYA', f: 'CHURNA', s: '5g', indications: [{ ind: 'Memory Loss', why: 'Nootropic herb improves cognition', how: '3-6g twice daily with milk' },{ ind: 'Anxiety', why: 'Anxiolytic and memory enhancer', how: '3-6g with ghee' }] },
      { n: 'Shatavari', c: 'STREEJEEVAK', f: 'CHURNA', s: '5g', indications: [{ ind: 'Menopause', why: 'Premier female tonic, hormone balancing', how: '3-6g with warm milk' },{ ind: 'Menstrual Irregularity', why: 'Regulates menstrual cycle', how: '3-6g twice daily' }] },
      { n: 'Arjuna', c: 'HRIDYA', f: 'KWATH', s: '15-30ml', indications: [{ ind: 'Hypertension', why: 'Cardioprotective, reduces BP', how: '15-30ml kwath twice daily' },{ ind: 'Heart Failure', why: 'Strengthens cardiac muscle', how: '15-30ml with milk' }] },
      { n: 'Guggulu', c: 'MEDOHARA', f: 'VATI', s: '500mg', indications: [{ ind: 'Obesity', why: 'Lipid-lowering and metabolism booster', how: '1-2 tablets twice daily' },{ ind: 'Osteoarthritis', why: 'Anti-arthritic', how: '1-2 tablets with warm water' }] },
      { n: 'Neem', c: 'VISHAGHNA', f: 'CHURNA', s: '3g', indications: [{ ind: 'Skin Allergy', why: 'Blood purifier and antimicrobial', how: '3-6g twice daily' },{ ind: 'Fungal Infection', why: 'Potent antifungal', how: 'Apply paste externally' }] },
      { n: 'Amla', c: 'RASAYANA', f: 'CHURNA', s: '5g', indications: [{ ind: 'Common Cold', why: 'Richest natural vitamin C source', how: '3-6g twice daily with honey' },{ ind: 'Weakness', why: 'Rejuvenative and antioxidant', how: '3-6g with milk' }] },
      { n: 'Punarnava', c: 'MUTRAKRICCHRA', f: 'KWATH', s: '15-30ml', indications: [{ ind: 'Kidney Stones', why: 'Diuretic and kidney protective', how: '15-30ml kwath twice daily' },{ ind: 'Swelling', why: 'Reduces edema', how: '15-30ml twice daily' }] },
      { n: 'Shankhpushpi', c: 'MEDHYA', f: 'CHURNA', s: '5g', indications: [{ ind: 'Insomnia', why: 'Calms mind, promotes sleep', how: '3-6g with warm milk at bedtime' },{ ind: 'Anxiety', why: 'Anxiolytic brain tonic', how: '3-6g twice daily' }] },
      { n: 'Pippali', c: 'SHWASAHARA', f: 'CHURNA', s: '2g', indications: [{ ind: 'Asthma', why: 'Potent respiratory herb, bronchodilator', how: '1-3g with honey' },{ ind: 'Cough', why: 'Expectorant and anti-inflammatory', how: '1-2g with honey' }] },
      { n: 'Yashtimadhu (Licorice)', c: 'SHWASAHARA', f: 'CHURNA', s: '3g', indications: [{ ind: 'Cough', why: 'Demulcent and anti-inflammatory', how: '3-5g twice daily' },{ ind: 'Acid Reflux', why: 'Soothing for gastric mucosa', how: '2-3g with water' }] },
      { n: 'Kutki', c: 'YAKRITUTTEJAK', f: 'CHURNA', s: '2g', indications: [{ ind: 'Hepatitis B', why: 'Hepatoprotective bitter herb', how: '1-3g twice daily' },{ ind: 'Fever', why: 'Antipyretic', how: '1-2g with honey' }] },
      { n: 'Bhringraj', c: 'KESHYA', f: 'THAILAM', s: '100ml', indications: [{ ind: 'Alopecia', why: 'Premier hair tonic', how: 'Apply on scalp, leave overnight' }] },
      { n: 'Manjishtha', c: 'VISHAGHNA', f: 'CHURNA', s: '3g', indications: [{ ind: 'Eczema', why: 'Blood purifying herb', how: '3-6g twice daily' },{ ind: 'Acne', why: 'Purifies blood, reduces inflammation', how: '3-6g with honey' }] },
      { n: 'Gokshura', c: 'MUTRAKRICCHRA', f: 'CHURNA', s: '5g', indications: [{ ind: 'UTI', why: 'Diuretic and urinary tract protective', how: '3-6g twice daily' },{ ind: 'Kidney Stones', why: 'Prevents stone formation', how: '5g with water' }] },
      { n: 'Vacha', c: 'MEDHYA', f: 'CHURNA', s: '500mg', indications: [{ ind: 'Epilepsy', why: 'Brain stimulant and anticonvulsant', how: '250mg-1g twice daily' }] },
      { n: 'Jatamansi', c: 'NIDRAJANANA', f: 'CHURNA', s: '2g', indications: [{ ind: 'Insomnia', why: 'Natural sedative', how: '1-3g at bedtime with milk' },{ ind: 'Anxiety', why: 'Anxiolytic', how: '1-2g twice daily' }] },
      { n: 'Tagar', c: 'NIDRAJANANA', f: 'CHURNA', s: '2g', indications: [{ ind: 'Insomnia', why: 'Sleep-promoting herb', how: '1-3g at bedtime' }] },
      { n: 'Sariva', c: 'VISHAGHNA', f: 'CHURNA', s: '5g', indications: [{ ind: 'Fever', why: 'Blood purifier and antipyretic', how: '3-6g twice daily' }] },
      { n: 'Rasna', c: 'VATAVYADHI', f: 'KWATH', s: '15-30ml', indications: [{ ind: 'Arthritis', why: 'Anti-arthritic', how: '15-30ml kwath twice daily' },{ ind: 'Back Pain', why: 'Anti-inflammatory', how: '15-30ml with warm water' }] },
      { n: 'Trikatu', c: 'AGNIVARDHAK', f: 'CHURNA', s: '500mg', indications: [{ ind: 'Dyspepsia', why: 'Digestive fire enhancer', how: '250mg-1g with honey' }] },
      { n: 'Hingu (Asafoetida)', c: 'AGNIVARDHAK', f: 'CHURNA', s: '250mg', indications: [{ ind: 'Bloating', why: 'Carminative and digestive', how: '125-500mg after food' }] },
      { n: 'Vidanga', c: 'KRUMIGHNA', f: 'CHURNA', s: '3g', indications: [{ ind: 'Worm Infestation', why: 'Anthelmintic', how: '3-6g with honey' }] },
      { n: 'Musta', c: 'DIGESTIVE', f: 'CHURNA', s: '5g', indications: [{ ind: 'Diarrhea', why: 'Digestive and antidiarrheal', how: '3-6g twice daily' },{ ind: 'Fever', why: 'Antipyretic', how: '3-5g with water' }] },
      { n: 'Chandan', c: 'DAHAPRASHAMANA', f: 'CHURNA', s: '2g', indications: [{ ind: 'Itching', why: 'Cooling and soothing', how: '1-3g with water' }] },
      { n: 'Lodhra', c: 'STREEJEEVAK', f: 'CHURNA', s: '3g', indications: [{ ind: 'Menorrhagia', why: 'Stops excessive bleeding', how: '3-6g twice daily' }] },
    ]

    for (const med of ayurMeds) {
      const m = await db.medicine.create({
        data: { name: med.n, modality: 'AYURVEDA', category: med.c, form: med.f, strength: med.s, isOTC: true, isPrescription: false },
      })
      await db.medicineIngredient.create({ data: { medicineId: m.id, ingredient: med.n, quantity: med.s, role: 'ACTIVE' } }).catch(() => {})
      for (const ind of med.indications) {
        const issue = allIssues.find(i => i.name === ind.ind || i.name.includes(ind.ind))
        await db.medicineIndication.create({ data: { medicineId: m.id, issueId: issue?.id, indication: ind.ind, whyToUse: ind.why, howToUseDaily: ind.how, priority: 1 } }).catch(() => {})
      }
      await db.medicineTimingRule.create({ data: { medicineId: m.id, timing: 'AFTER_MEAL', instruction: 'Take after food as per Ayurvedic tradition' } }).catch(() => {})
    }

    // Homeopathy Medicines
    const homoMeds = [
      { n: 'Nux Vomica', c: 'GASTROINTESTINAL', s: '30C', indications: [{ ind: 'Dyspepsia', why: 'For digestive complaints from lifestyle excesses', how: '3-4 globules 3 times daily' },{ ind: 'Constipation', why: 'For constipation with ineffectual urging', how: '3-4 globules twice daily' }] },
      { n: 'Belladonna', c: 'FEBRILE', s: '30C', indications: [{ ind: 'Fever', why: 'For sudden onset fevers with redness and heat', how: '3-4 globules every 2-3 hours in acute phase' },{ ind: 'Headache', why: 'For throbbing headache with redness', how: '3-4 globules every 2 hours' }] },
      { n: 'Arnica Montana', c: 'TRAUMA', s: '30C', indications: [{ ind: 'Muscle Strain', why: 'First medicine for any physical trauma', how: '3-4 globules 3 times daily' },{ ind: 'Back Pain', why: 'For injury-related back pain', how: '3-4 globules 3 times daily' }] },
      { n: 'Bryonia Alba', c: 'RESPIRATORY', s: '30C', indications: [{ ind: 'Cough', why: 'For dry cough worse with movement', how: '3-4 globules 3 times daily' },{ ind: 'Constipation', why: 'For dry, hard stools', how: '3-4 globules twice daily' }] },
      { n: 'Rhus Toxicodendron', c: 'MUSCULOSKELETAL', s: '30C', indications: [{ ind: 'Joint Pain', why: 'For pain better with movement, worse at rest', how: '3-4 globules 3 times daily' },{ ind: 'Back Pain', why: 'For pain worse on beginning motion', how: '3-4 globules 3 times daily' }] },
      { n: 'Pulsatilla', c: 'RESPIRATORY', s: '30C', indications: [{ ind: 'Common Cold', why: 'For mild, changeable symptoms, worse in heat', how: '3-4 globules 3 times daily' }] },
      { n: 'Sulphur', c: 'SKIN', s: '30C', indications: [{ ind: 'Eczema', why: 'For skin conditions with itching and burning', how: '3-4 globules twice daily' },{ ind: 'Itching', why: 'For intense itching worse from heat', how: '3-4 globules once daily' }] },
      { n: 'Lycopodium', c: 'GASTROINTESTINAL', s: '30C', indications: [{ ind: 'Dyspepsia', why: 'For digestive issues with bloating', how: '3-4 globules twice daily' }] },
      { n: 'Arsenicum Album', c: 'GASTROINTESTINAL', s: '30C', indications: [{ ind: 'Food Poisoning', why: 'For conditions with burning and restlessness', how: '3-4 globules every 2-3 hours in acute phase' },{ ind: 'Diarrhea', why: 'For watery diarrhea with burning', how: '3-4 globules every 2 hours' }] },
      { n: 'Natrum Muriaticum', c: 'PSYCHIATRIC', s: '30C', indications: [{ ind: 'Depression', why: 'For grief and emotional suppression', how: '3-4 globules twice daily' },{ ind: 'Headache', why: 'For bursting headache', how: '3-4 globules twice daily' }] },
      { n: 'Calcarea Carbonica', c: 'CONSTITUTIONAL', s: '30C', indications: [{ ind: 'Obesity', why: 'For constitutionally cold, overweight individuals', how: '3-4 globules once daily' }] },
      { n: 'Phosphorus', c: 'RESPIRATORY', s: '30C', indications: [{ ind: 'Cough', why: 'For tall, thin individuals with respiratory tendency', how: '3-4 globules twice daily' }] },
      { n: 'Sepia', c: 'GYNECOLOGICAL', s: '30C', indications: [{ ind: 'Menopause', why: 'For female complaints with fatigue and indifference', how: '3-4 globules twice daily' }] },
      { n: 'Silicea', c: 'CONSTITUTIONAL', s: '30C', indications: [{ ind: 'Boils', why: 'For promoting suppuration', how: '3-4 globules once daily' }] },
      { n: 'Apis Mellifica', c: 'ALLERGY', s: '30C', indications: [{ ind: 'Urticaria', why: 'For stinging, burning swellings', how: '3-4 globules every 2-3 hours' }] },
      { n: 'Ignatia', c: 'PSYCHIATRIC', s: '30C', indications: [{ ind: 'Anxiety', why: 'For emotional trauma and paradoxical symptoms', how: '3-4 globules 3 times daily' }] },
      { n: 'Gelsemium', c: 'FEBRILE', s: '30C', indications: [{ ind: 'Influenza', why: 'For conditions with heaviness and trembling', how: '3-4 globules 3 times daily' }] },
      { n: 'Aconitum Napellus', c: 'FEBRILE', s: '30C', indications: [{ ind: 'Fever', why: 'For sudden onset conditions with fear', how: '3-4 globules every 30 min to 1 hour' }] },
      { n: 'Argentum Nitricum', c: 'GASTROINTESTINAL', s: '30C', indications: [{ ind: 'Anxiety', why: 'For impulsive anxiety with digestive symptoms', how: '3-4 globules twice daily' }] },
      { n: 'Carbo Vegetabilis', c: 'GASTROINTESTINAL', s: '30C', indications: [{ ind: 'Bloating', why: 'For severe digestive weakness with flatulence', how: '3-4 globules twice daily' }] },
      { n: 'Drosera', c: 'RESPIRATORY', s: '30C', indications: [{ ind: 'Cough', why: 'For spasmodic cough', how: '3-4 globules 3 times daily' }] },
      { n: 'Hepar Sulphuris', c: 'RESPIRATORY', s: '30C', indications: [{ ind: 'Tonsillitis', why: 'For suppurative conditions with sensitivity', how: '3-4 globules 3 times daily' }] },
      { n: 'Ruta Graveolens', c: 'MUSCULOSKELETAL', s: '30C', indications: [{ ind: 'Sprain', why: 'For tendon and periosteum injuries', how: '3-4 globules 3 times daily' }] },
      { n: 'Thuja Occidentalis', c: 'SKIN', s: '30C', indications: [{ ind: 'Warts', why: 'For sycotic constitution and warts', how: '3-4 globules once daily' }] },
      { n: 'Ipecacuanha', c: 'GASTROINTESTINAL', s: '30C', indications: [{ ind: 'Nausea', why: 'For persistent nausea not relieved by vomiting', how: '3-4 globules every 2-3 hours' }] },
    ]

    for (const med of homoMeds) {
      const m = await db.medicine.create({
        data: { name: med.n, modality: 'HOMEOPATHY', category: med.c, form: 'GLOBULE', strength: med.s, isOTC: true, isPrescription: false },
      })
      await db.medicineIngredient.create({ data: { medicineId: m.id, ingredient: med.n, quantity: med.s, role: 'ACTIVE' } }).catch(() => {})
      for (const ind of med.indications) {
        const issue = allIssues.find(i => i.name === ind.ind || i.name.includes(ind.ind))
        await db.medicineIndication.create({ data: { medicineId: m.id, issueId: issue?.id, indication: ind.ind, whyToUse: ind.why, howToUseDaily: ind.how, priority: 1 } }).catch(() => {})
      }
      await db.medicineTimingRule.create({ data: { medicineId: m.id, timing: 'EMPTY_STOMACH', instruction: 'Take on empty stomach, 30 min before or after food. Avoid strong smells, coffee, camphor.' } }).catch(() => {})
    }

    // Create demo encounters, consents, etc.
    for (let i = 0; i < 5; i++) {
      const encounter = await db.encounter.create({
        data: {
          patientId: patients[i].id,
          practitionerId: practitioners[i % 3].id,
          tenantId: tenant.id,
          modality: ['ALLOPATHY','AYURVEDA','HOMEOPATHY'][i % 3],
          status: i < 2 ? 'IN_PROGRESS' : 'COMPLETED',
          priority: i === 0 ? 'EMERGENCY' : i === 1 ? 'URGENT' : 'ROUTINE',
          reason: ['Chest pain','Headache','Fever','Back pain','Skin rash'][i],
        },
      })
      await db.intake.create({
        data: {
          encounterId: encounter.id,
          chiefComplaint: ['Chest pain for 2 hours','Headache for 3 days','Fever for 2 days','Back pain for 1 week','Skin rash for 5 days'][i],
          historyOfPresentIllness: ['Patient presented with acute chest pain','Chronic tension headache','Low-grade fever with body aches','Mechanical back pain after lifting','Erythematous rash with itching'][i],
        },
      }).catch(() => {})
    }

    const totalIssues = await db.healthIssue.count()
    const totalMeds = await db.medicine.count()

    return NextResponse.json({
      message: 'Seed completed successfully',
      counts: {
        issues: totalIssues,
        medicines: totalMeds,
        allopathyMeds: await db.medicine.count({ where: { modality: 'ALLOPATHY' } }),
        ayurvedaMeds: await db.medicine.count({ where: { modality: 'AYURVEDA' } }),
        homeopathyMeds: await db.medicine.count({ where: { modality: 'HOMEOPATHY' } }),
        aliases: await db.healthIssueAlias.count(),
        translations: await db.healthIssueTranslation.count(),
        wingApproaches: await db.healthIssueWing.count(),
        indications: await db.medicineIndication.count(),
        ingredients: await db.medicineIngredient.count(),
        contraindications: await db.medicineContraindication.count(),
        interactions: await db.medicineInteraction.count(),
        sideEffects: await db.medicineSideEffect.count(),
        patients: patients.length,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 })
  }
}
