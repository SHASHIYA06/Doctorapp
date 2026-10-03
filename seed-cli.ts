import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ log: ['error'] })

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
const PRE = ['Acute','Chronic','Mild','Moderate','Severe','Recurrent','Persistent','Intermittent','Progressive','Intractable']
const SUF = ['in Adults','in Children','in Elderly','in Pregnancy','with Complications','Early Stage','Late Stage','Uncomplicated','Complicated','Refractory']

const HINDI: Record<string, string[]> = {
  'Fever':['bukhar','jvar'],'Headache':['sir dard'],'Common Cold':['sardi','jukham'],'Cough':['khansi'],
  'Stomach Pain':['pet dard'],'Diarrhea':['dast'],'Constipation':['kabz'],'Back Pain':['kamar dard'],
  'Joint Pain':['jod dard'],'Asthma':['dama'],'Acid Reflux':['acidit'],'Nausea':['ulti'],
  'Dizziness':['chakkar'],'Itching':['khujli'],'Hypertension':['bp high'],'Insomnia':['neend na aana'],
}

const WING: Record<string, { ALLOPATHY: string; AYURVEDA: string; HOMEOPATHY: string }> = {
  'Fever':{ALLOPATHY:'Antipyretics, rest, hydration',AYURVEDA:'Gudichi kwath, Godanti Bhasma',HOMEOPATHY:'Aconite, Belladonna, Gelsemium'},
  'Headache':{ALLOPATHY:'Paracetamol, Ibuprofen, specific migraine meds',AYURVEDA:'Shirashoolari Vati, Brahmi, Nasya',HOMEOPATHY:'Belladonna, Nux Vomica, Iris'},
  'Common Cold':{ALLOPATHY:'Antihistamines, Decongestants, Paracetamol',AYURVEDA:'Talisadi Churna, Sitopaladi, Tulsi',HOMEOPATHY:'Aconite, Allium Cepa, Nux Vomica'},
  'Cough':{ALLOPATHY:'Antitussives/Expectorants, treat cause',AYURVEDA:'Sitopaladi, Talisadi, honey+ginger',HOMEOPATHY:'Drosera, Bryonia, Rumex'},
}
const DW={ALLOPATHY:'Evidence-based pharmacological treatment',AYURVEDA:'Dosha-balancing with herbs and diet',HOMEOPATHY:'Individualized remedy based on symptom totality'}

async function main() {
  const existing = await db.healthIssue.count()
  if (existing > 4000) { console.log(`Already seeded: ${existing} issues, ${await db.medicine.count()} meds`); await db.$disconnect(); return }

  console.log('Setting up tenant...')
  let tenant = await db.tenant.findFirst({where:{code:'MGH-001'}})
  if(!tenant) tenant = await db.tenant.create({data:{name:'MedGovern Demo Hospital',code:'MGH-001'}})
  await db.role.upsert({where:{name:'CLINICIAN'},create:{name:'CLINICIAN',permissions:'["read","write","review"]'},update:{}})

  console.log('Creating practitioners & patients...')
  for(const [n,m] of [['Dr. Sharma','ALLOPATHY'],['Vaidya Joshi','AYURVEDA'],['Dr. Patel','HOMEOPATHY']] as [string,string][]) {
    await db.practitioner.create({data:{tenantId:tenant.id,name:n,specialization:'General Medicine',modality:m}}).catch(()=>{})
  }
  const names=[['Rahul','Kumar'],['Priya','Sharma'],['Amit','Patel'],['Sunita','Gupta'],['Vikram','Singh'],['Anjali','Joshi'],['Suresh','Reddy'],['Meena','Nair']]
  for(let i=0;i<8;i++) await db.patient.create({data:{tenantId:tenant.id,firstName:names[i][0],lastName:names[i][1],gender:i%2===0?'M':'F',dateOfBirth:`${1985+i}-0${i+1}-15`}}).catch(()=>{})

  console.log('Creating 5000+ health issues (batched)...')
  const allIssueData: Array<{name:string;bodySystem:string;clinicalDomain:string;symptomGroup:string;severity:string;chronicity:string;prevalence?:string;isSubtype:boolean}> = []

  for(const [bsKey,bsData] of Object.entries(BS)){
    for(const issueName of bsData.issues){
      allIssueData.push({name:issueName,bodySystem:bsKey,clinicalDomain:bsData.d,symptomGroup:issueName,severity:'MODERATE',chronicity:'ACUTE',prevalence:'COMMON',isSubtype:false})
      for(const p of PRE) allIssueData.push({name:`${p} ${issueName}`,bodySystem:bsKey,clinicalDomain:bsData.d,symptomGroup:issueName,severity:p==='Severe'||p==='Intractable'?'SEVERE':p==='Mild'?'MILD':'MODERATE',chronicity:p==='Chronic'||p==='Persistent'||p==='Progressive'?'CHRONIC':'ACUTE',isSubtype:true})
      for(const s of SUF) allIssueData.push({name:`${issueName} ${s}`,bodySystem:bsKey,clinicalDomain:bsData.d,symptomGroup:issueName,severity:s.includes('Complications')?'SEVERE':'MODERATE',chronicity:s.includes('Elderly')||s.includes('Pregnancy')?'CHRONIC':'ACUTE',isSubtype:true})
    }
  }

  // Batch insert in chunks of 500
  const chunkSize = 500
  for(let i=0;i<allIssueData.length;i+=chunkSize){
    const chunk=allIssueData.slice(i,i+chunkSize)
    await db.healthIssue.createMany({data:chunk,skipDuplicates:true})
    process.stdout.write(`\r  Created ${Math.min(i+chunkSize,allIssueData.length)}/${allIssueData.length} issues...`)
  }
  console.log(`\n  Total: ${allIssueData.length} issues prepared, ${await db.healthIssue.count()} in DB`)

  // Fetch first 200 issues for aliases/wings
  const firstIssues=await db.healthIssue.findMany({take:200,select:{id:true,name:true,bodySystem:true}})

  console.log('Creating aliases & wing approaches...')
  const aliasData: Array<{issueId:string;alias:string;language:string}> = []
  const wingData: Array<{issueId:string;modality:string;approach:string;lifestyleAdvice:string;whenToSeeDoctor:string;evidenceLevel:string}> = []

  for(const issue of firstIssues){
    const h=HINDI[issue.name]
    if(h) for(const a of h) aliasData.push({issueId:issue.id,alias:a,language:'hi'})
    aliasData.push({issueId:issue.id,alias:issue.name.toLowerCase(),language:'en'})
    const w=WING[issue.name]||DW
    for(const mod of ['ALLOPATHY','AYURVEDA','HOMEOPATHY'] as const){
      wingData.push({issueId:issue.id,modality:mod,approach:w[mod],lifestyleAdvice:'Balanced diet, exercise, adequate sleep',whenToSeeDoctor:'If symptoms persist beyond 7 days',evidenceLevel:mod==='ALLOPATHY'?'STRONG':mod==='AYURVEDA'?'MODERATE':'LIMITED'})
    }
  }
  await db.healthIssueAlias.createMany({data:aliasData,skipDuplicates:true})
  await db.healthIssueWing.createMany({data:wingData,skipDuplicates:true})

  console.log('\nDone! Final counts:')
  console.log(`  Health Issues: ${await db.healthIssue.count()}`)
  console.log(`  Aliases: ${await db.healthIssueAlias.count()}`)
  console.log(`  Wing Approaches: ${await db.healthIssueWing.count()}`)
  console.log(`  Medicines: ${await db.medicine.count()}`)
  console.log(`  Patients: ${await db.patient.count()}`)
  console.log(`  Practitioners: ${await db.practitioner.count()}`)
  await db.$disconnect()
}

main().catch(e=>{console.error(e);process.exit(1)})
