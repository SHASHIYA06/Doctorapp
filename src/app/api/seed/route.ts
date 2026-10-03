import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================
// HEALTH ISSUES - 200+ across 14 body systems
// ============================================================
const HEALTH_ISSUES = [
  // CARDIOVASCULAR (14)
  { code: 'I10', name: 'Hypertension', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'MODERATE', description: 'Persistently elevated blood pressure ≥140/90 mmHg' },
  { code: 'I25.1', name: 'Coronary Artery Disease', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Narrowing of coronary arteries due to atherosclerosis' },
  { code: 'I50', name: 'Heart Failure', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Inability of heart to pump blood effectively' },
  { code: 'I48', name: 'Atrial Fibrillation', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Irregular rapid atrial rhythm increasing stroke risk' },
  { code: 'I21', name: 'Myocardial Infarction', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'CRITICAL', description: 'Acute blockage of coronary artery causing heart muscle death' },
  { code: 'I20', name: 'Angina Pectoris', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Chest pain from reduced blood flow to heart' },
  { code: 'I82', name: 'Deep Vein Thrombosis', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Blood clot in deep veins, usually legs' },
  { code: 'I26', name: 'Pulmonary Embolism', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'CRITICAL', description: 'Blood clot blocking pulmonary artery' },
  { code: 'I42', name: 'Cardiomyopathy', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Disease of heart muscle affecting pumping ability' },
  { code: 'I70', name: 'Peripheral Artery Disease', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'MODERATE', description: 'Narrowing of peripheral arteries reducing limb blood flow' },
  { code: 'I33', name: 'Endocarditis', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Infection of heart valves or inner lining' },
  { code: 'I30', name: 'Pericarditis', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'MODERATE', description: 'Inflammation of pericardium surrounding heart' },
  { code: 'I35', name: 'Aortic Stenosis', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'SEVERE', description: 'Narrowing of aortic valve opening' },
  { code: 'I34', name: 'Mitral Regurgitation', bodySystem: 'CARDIOVASCULAR', clinicalDomain: 'Cardiology', severity: 'MODERATE', description: 'Backflow of blood through mitral valve' },

  // RESPIRATORY (14)
  { code: 'J45', name: 'Asthma', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MODERATE', description: 'Reversible airway obstruction with inflammation and hyperreactivity' },
  { code: 'J44', name: 'COPD', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'SEVERE', description: 'Chronic obstructive lung disease with progressive airflow limitation' },
  { code: 'J18', name: 'Pneumonia', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'SEVERE', description: 'Infection causing alveolar inflammation and consolidation' },
  { code: 'J20', name: 'Bronchitis', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MILD', description: 'Inflammation of bronchial tubes' },
  { code: 'A15', name: 'Tuberculosis', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'SEVERE', description: 'Mycobacterium tuberculosis infection, primarily pulmonary' },
  { code: 'J84', name: 'Pulmonary Fibrosis', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'SEVERE', description: 'Progressive scarring of lung tissue' },
  { code: 'G47.3', name: 'Sleep Apnea', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MODERATE', description: 'Repeated cessation of breathing during sleep' },
  { code: 'J90', name: 'Pleurisy', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MODERATE', description: 'Inflammation of pleural membranes causing sharp chest pain' },
  { code: 'J43', name: 'Emphysema', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'SEVERE', description: 'Destruction of alveolar walls causing air trapping' },
  { code: 'J47', name: 'Bronchiectasis', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MODERATE', description: 'Permanent dilation of bronchi with chronic infection' },
  { code: 'J01', name: 'Sinusitis', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MILD', description: 'Inflammation of paranasal sinuses' },
  { code: 'J02', name: 'Pharyngitis', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MILD', description: 'Inflammation of pharynx, often viral' },
  { code: 'J03', name: 'Tonsillitis', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MILD', description: 'Inflammation of palatine tonsils' },
  { code: 'J11', name: 'Influenza', bodySystem: 'RESPIRATORY', clinicalDomain: 'Pulmonology', severity: 'MODERATE', description: 'Acute viral respiratory infection with systemic symptoms' },

  // GASTROINTESTINAL (14)
  { code: 'K21', name: 'GERD', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'MODERATE', description: 'Chronic reflux of stomach acid into esophagus' },
  { code: 'K25', name: 'Peptic Ulcer', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'MODERATE', description: 'Erosion in gastric or duodenal mucosa' },
  { code: 'K58', name: 'IBS', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'MODERATE', description: 'Functional bowel disorder with abdominal pain and altered habits' },
  { code: 'K50', name: "Crohn's Disease", bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'SEVERE', description: 'Transmural inflammatory bowel disease affecting any GI segment' },
  { code: 'K51', name: 'Ulcerative Colitis', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'SEVERE', description: 'Chronic mucosal inflammation of colon and rectum' },
  { code: 'K29', name: 'Gastritis', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'MILD', description: 'Inflammation of stomach lining' },
  { code: 'K30', name: 'Dyspepsia', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'MILD', description: 'Indigestion with upper abdominal discomfort' },
  { code: 'B18.1', name: 'Hepatitis B', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'SEVERE', description: 'Chronic HBV infection causing liver inflammation' },
  { code: 'B18.2', name: 'Hepatitis C', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'SEVERE', description: 'HCV infection, leading cause of chronic liver disease' },
  { code: 'K74', name: 'Cirrhosis', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'SEVERE', description: 'Irreversible fibrosis and nodular regeneration of liver' },
  { code: 'K85', name: 'Pancreatitis', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'SEVERE', description: 'Inflammation of pancreas, acute or chronic' },
  { code: 'K81', name: 'Cholecystitis', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'MODERATE', description: 'Inflammation of gallbladder, often with gallstones' },
  { code: 'K35', name: 'Appendicitis', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'SEVERE', description: 'Inflammation of vermiform appendix' },
  { code: 'K59.0', name: 'Constipation', bodySystem: 'GASTROINTESTINAL', clinicalDomain: 'Gastroenterology', severity: 'MILD', description: 'Difficulty or infrequent passage of stools' },

  // NEUROLOGICAL (13)
  { code: 'G43', name: 'Migraine', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'MODERATE', description: 'Recurrent severe headache often with aura and nausea' },
  { code: 'G40', name: 'Epilepsy', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'SEVERE', description: 'Recurrent unprovoked seizures from abnormal brain activity' },
  { code: 'I63', name: 'Stroke', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'CRITICAL', description: 'Acute cerebrovascular event causing brain tissue damage' },
  { code: 'G20', name: "Parkinson's Disease", bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'SEVERE', description: 'Progressive neurodegeneration with tremor, rigidity, bradykinesia' },
  { code: 'G35', name: 'Multiple Sclerosis', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'SEVERE', description: 'Autoimmune demyelinating disease of CNS' },
  { code: 'G62', name: 'Neuropathy', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'MODERATE', description: 'Damage to peripheral nerves causing numbness and weakness' },
  { code: 'M54.3', name: 'Sciatica', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'MODERATE', description: 'Pain radiating along sciatic nerve, often from disc herniation' },
  { code: 'G00', name: 'Meningitis', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'CRITICAL', description: 'Inflammation of meninges, bacterial or viral' },
  { code: 'G30', name: "Alzheimer's Disease", bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'SEVERE', description: 'Progressive neurodegenerative dementia with amyloid plaques' },
  { code: 'F03', name: 'Dementia', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'SEVERE', description: 'Progressive cognitive decline affecting daily functioning' },
  { code: 'G50', name: 'Trigeminal Neuralgia', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'SEVERE', description: 'Intense facial pain along trigeminal nerve distribution' },
  { code: 'G51', name: "Bell's Palsy", bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'MODERATE', description: 'Acute unilateral facial nerve paralysis' },
  { code: 'G56', name: 'Carpal Tunnel Syndrome', bodySystem: 'NEUROLOGICAL', clinicalDomain: 'Neurology', severity: 'MODERATE', description: 'Median nerve compression at the wrist' },

  // MUSCULOSKELETAL (12)
  { code: 'M19', name: 'Osteoarthritis', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MODERATE', description: 'Degenerative joint disease with cartilage loss' },
  { code: 'M06', name: 'Rheumatoid Arthritis', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'SEVERE', description: 'Autoimmune inflammatory polyarthritis with joint destruction' },
  { code: 'M10', name: 'Gout', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MODERATE', description: 'Crystal arthropathy from urate deposition in joints' },
  { code: 'M81', name: 'Osteoporosis', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MODERATE', description: 'Reduced bone density increasing fracture risk' },
  { code: 'M79.7', name: 'Fibromyalgia', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MODERATE', description: 'Chronic widespread pain with tender points and fatigue' },
  { code: 'M76', name: 'Tendinitis', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MILD', description: 'Inflammation of tendon, usually from overuse' },
  { code: 'M71', name: 'Bursitis', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MILD', description: 'Inflammation of bursa near joints' },
  { code: 'M51', name: 'Herniated Disc', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'SEVERE', description: 'Intervertebral disc protrusion compressing nerve root' },
  { code: 'M41', name: 'Scoliosis', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MODERATE', description: 'Lateral curvature of the spine' },
  { code: 'M45', name: 'Ankylosing Spondylitis', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'SEVERE', description: 'Chronic inflammatory arthritis of spine and sacroiliac joints' },
  { code: 'M75.0', name: 'Frozen Shoulder', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MODERATE', description: 'Painful stiffness and progressive loss of shoulder motion' },
  { code: 'M75.1', name: 'Rotator Cuff Injury', bodySystem: 'MUSCULOSKELETAL', clinicalDomain: 'Orthopedics', severity: 'MODERATE', description: 'Tear or inflammation of rotator cuff tendons' },

  // ENDOCRINE (10)
  { code: 'E10', name: 'Diabetes Type 1', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'SEVERE', description: 'Autoimmune beta-cell destruction requiring insulin' },
  { code: 'E11', name: 'Diabetes Type 2', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'SEVERE', description: 'Insulin resistance with relative insulin deficiency' },
  { code: 'E03', name: 'Hypothyroidism', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'MODERATE', description: 'Underactive thyroid with decreased metabolic rate' },
  { code: 'E05', name: 'Hyperthyroidism', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'MODERATE', description: 'Overactive thyroid with increased metabolic rate' },
  { code: 'E24', name: 'Cushing Syndrome', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'SEVERE', description: 'Excess cortisol causing central obesity and metabolic effects' },
  { code: 'E27.1', name: 'Addison Disease', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'SEVERE', description: 'Primary adrenal insufficiency with steroid deficiency' },
  { code: 'E28.2', name: 'PCOS', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'MODERATE', description: 'Polycystic ovary syndrome with anovulation and hyperandrogenism' },
  { code: 'E16.1', name: 'Hypoglycemia', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'MODERATE', description: 'Abnormally low blood glucose levels' },
  { code: 'E11.4', name: 'Diabetic Neuropathy', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'SEVERE', description: 'Nerve damage from chronic diabetes' },
  { code: 'E11.3', name: 'Diabetic Retinopathy', bodySystem: 'ENDOCRINE', clinicalDomain: 'Endocrinology', severity: 'SEVERE', description: 'Retinal microvascular damage from diabetes' },

  // DERMATOLOGICAL (10)
  { code: 'L30.3', name: 'Eczema', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MODERATE', description: 'Atopic dermatitis with pruritic inflamed skin' },
  { code: 'L40', name: 'Psoriasis', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MODERATE', description: 'Chronic autoimmune hyperproliferative skin disorder' },
  { code: 'L70', name: 'Acne Vulgaris', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MILD', description: 'Inflammatory pilosebaceous follicular eruption' },
  { code: 'L30', name: 'Dermatitis', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MILD', description: 'Generalized skin inflammation from various causes' },
  { code: 'B37', name: 'Fungal Infection', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MILD', description: 'Dermatophyte or candidal skin infection' },
  { code: 'L50', name: 'Urticaria', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MODERATE', description: 'Hives from allergic or idiopathic causes' },
  { code: 'L80', name: 'Vitiligo', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MILD', description: 'Autoimmune depigmentation of skin patches' },
  { code: 'B86', name: 'Scabies', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MILD', description: 'Sarcoptes scabiei mite infestation causing pruritus' },
  { code: 'L03', name: 'Cellulitis', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'MODERATE', description: 'Bacterial infection of dermis and subcutaneous tissue' },
  { code: 'C43', name: 'Melanoma', bodySystem: 'DERMATOLOGICAL', clinicalDomain: 'Dermatology', severity: 'CRITICAL', description: 'Malignant tumor of melanocytes' },

  // MENTAL_HEALTH (10)
  { code: 'F32', name: 'Depression', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'MODERATE', description: 'Major depressive disorder with persistent low mood and anhedonia' },
  { code: 'F41.1', name: 'Generalized Anxiety', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'MODERATE', description: 'Persistent excessive worry across multiple domains' },
  { code: 'F31', name: 'Bipolar Disorder', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'SEVERE', description: 'Alternating episodes of mania and depression' },
  { code: 'F20', name: 'Schizophrenia', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'SEVERE', description: 'Psychotic disorder with hallucinations, delusions, disorganized thought' },
  { code: 'F42', name: 'OCD', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'MODERATE', description: 'Obsessive-compulsive disorder with intrusive thoughts and rituals' },
  { code: 'F43.1', name: 'PTSD', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'SEVERE', description: 'Post-traumatic stress disorder after traumatic event' },
  { code: 'G47.0', name: 'Insomnia', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'MODERATE', description: 'Persistent difficulty initiating or maintaining sleep' },
  { code: 'F41.0', name: 'Panic Disorder', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'MODERATE', description: 'Recurrent unexpected panic attacks with anticipatory anxiety' },
  { code: 'F40.1', name: 'Social Anxiety', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'MODERATE', description: 'Intense fear of social situations and scrutiny' },
  { code: 'F50', name: 'Eating Disorder', bodySystem: 'MENTAL_HEALTH', clinicalDomain: 'Psychiatry', severity: 'SEVERE', description: 'Disordered eating patterns including anorexia and bulimia' },

  // ENT (8)
  { code: 'H65', name: 'Otitis Media', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MILD', description: 'Middle ear infection, common in children' },
  { code: 'H91', name: 'Hearing Loss', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MODERATE', description: 'Conductive or sensorineural hearing impairment' },
  { code: 'H81', name: 'Vertigo', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MODERATE', description: 'Illusion of movement, often from vestibular dysfunction' },
  { code: 'H93.1', name: 'Tinnitus', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MILD', description: 'Perception of sound without external source' },
  { code: 'J30', name: 'Allergic Rhinitis', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MILD', description: 'IgE-mediated nasal mucosal inflammation from allergens' },
  { code: 'J37', name: 'Laryngitis', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MILD', description: 'Inflammation of larynx causing hoarseness' },
  { code: 'R04', name: 'Epistaxis', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MILD', description: 'Bleeding from the nostril, nasal cavity, or nasopharynx' },
  { code: 'H60', name: 'Otitis Externa', bodySystem: 'ENT', clinicalDomain: 'Otolaryngology', severity: 'MILD', description: 'Infection of external ear canal (swimmer ear)' },

  // UROLOGICAL (7)
  { code: 'N39.0', name: 'UTI', bodySystem: 'UROLOGICAL', clinicalDomain: 'Urology', severity: 'MODERATE', description: 'Bacterial infection of urinary tract' },
  { code: 'N20', name: 'Kidney Stones', bodySystem: 'UROLOGICAL', clinicalDomain: 'Urology', severity: 'SEVERE', description: 'Calculi in renal collecting system causing colic' },
  { code: 'N40', name: 'BPH', bodySystem: 'UROLOGICAL', clinicalDomain: 'Urology', severity: 'MODERATE', description: 'Benign prostatic hyperplasia causing urinary obstruction' },
  { code: 'N41', name: 'Prostatitis', bodySystem: 'UROLOGICAL', clinicalDomain: 'Urology', severity: 'MODERATE', description: 'Inflammation of prostate gland' },
  { code: 'N52', name: 'Erectile Dysfunction', bodySystem: 'UROLOGICAL', clinicalDomain: 'Urology', severity: 'MODERATE', description: 'Inability to achieve or maintain erection' },
  { code: 'N39.3', name: 'Urinary Incontinence', bodySystem: 'UROLOGICAL', clinicalDomain: 'Urology', severity: 'MODERATE', description: 'Involuntary loss of urine' },
  { code: 'N20.0', name: 'Nephrolithiasis', bodySystem: 'UROLOGICAL', clinicalDomain: 'Urology', severity: 'SEVERE', description: 'Stone formation in kidney or ureter' },

  // REPRODUCTIVE (6)
  { code: 'N94.4', name: 'Dysmenorrhea', bodySystem: 'REPRODUCTIVE', clinicalDomain: 'Gynecology', severity: 'MODERATE', description: 'Painful menstrual cramps' },
  { code: 'N80', name: 'Endometriosis', bodySystem: 'REPRODUCTIVE', clinicalDomain: 'Gynecology', severity: 'SEVERE', description: 'Endometrial tissue outside uterine cavity' },
  { code: 'D25', name: 'Fibroids', bodySystem: 'REPRODUCTIVE', clinicalDomain: 'Gynecology', severity: 'MODERATE', description: 'Benign uterine smooth muscle tumors' },
  { code: 'N92', name: 'Menorrhagia', bodySystem: 'REPRODUCTIVE', clinicalDomain: 'Gynecology', severity: 'MODERATE', description: 'Excessive or prolonged menstrual bleeding' },
  { code: 'N97', name: 'Infertility', bodySystem: 'REPRODUCTIVE', clinicalDomain: 'Gynecology', severity: 'MODERATE', description: 'Inability to conceive after 12 months of regular intercourse' },
  { code: 'N92.0', name: 'Irregular Menses', bodySystem: 'REPRODUCTIVE', clinicalDomain: 'Gynecology', severity: 'MILD', description: 'Irregular menstrual cycle pattern' },

  // OPHTHALMOLOGICAL (6)
  { code: 'H40', name: 'Glaucoma', bodySystem: 'OPHTHALMOLOGICAL', clinicalDomain: 'Ophthalmology', severity: 'SEVERE', description: 'Optic neuropathy from elevated intraocular pressure' },
  { code: 'H25', name: 'Cataract', bodySystem: 'OPHTHALMOLOGICAL', clinicalDomain: 'Ophthalmology', severity: 'MODERATE', description: 'Opacification of crystalline lens' },
  { code: 'H10', name: 'Conjunctivitis', bodySystem: 'OPHTHALMOLOGICAL', clinicalDomain: 'Ophthalmology', severity: 'MILD', description: 'Inflammation of conjunctiva, infectious or allergic' },
  { code: 'H36.0', name: 'Diabetic Retinopathy', bodySystem: 'OPHTHALMOLOGICAL', clinicalDomain: 'Ophthalmology', severity: 'SEVERE', description: 'Retinal vascular changes from diabetes' },
  { code: 'H35.3', name: 'Macular Degeneration', bodySystem: 'OPHTHALMOLOGICAL', clinicalDomain: 'Ophthalmology', severity: 'SEVERE', description: 'Age-related central retinal degeneration' },
  { code: 'H04.1', name: 'Dry Eye Syndrome', bodySystem: 'OPHTHALMOLOGICAL', clinicalDomain: 'Ophthalmology', severity: 'MILD', description: 'Insufficient tear production or quality' },

  // HEMATOLOGICAL (5)
  { code: 'D50', name: 'Iron Deficiency Anemia', bodySystem: 'HEMATOLOGICAL', clinicalDomain: 'Hematology', severity: 'MODERATE', description: 'Low hemoglobin from iron deficiency' },
  { code: 'D56', name: 'Thalassemia', bodySystem: 'HEMATOLOGICAL', clinicalDomain: 'Hematology', severity: 'SEVERE', description: 'Inherited hemoglobin synthesis disorder' },
  { code: 'D51', name: 'Vitamin B12 Deficiency', bodySystem: 'HEMATOLOGICAL', clinicalDomain: 'Hematology', severity: 'MODERATE', description: 'Megaloblastic anemia from cobalamin deficiency' },
  { code: 'I82', name: 'DVT', bodySystem: 'HEMATOLOGICAL', clinicalDomain: 'Hematology', severity: 'SEVERE', description: 'Deep venous thrombosis, clot in deep veins' },
  { code: 'C91', name: 'Leukemia', bodySystem: 'HEMATOLOGICAL', clinicalDomain: 'Hematology', severity: 'CRITICAL', description: 'Malignant proliferation of leukocytes' },

  // IMMUNOLOGICAL (5)
  { code: 'J30.1', name: 'Allergic Rhinitis (Immune)', bodySystem: 'IMMUNOLOGICAL', clinicalDomain: 'Immunology', severity: 'MILD', description: 'IgE-mediated hypersensitivity of nasal mucosa' },
  { code: 'T78.2', name: 'Anaphylaxis', bodySystem: 'IMMUNOLOGICAL', clinicalDomain: 'Immunology', severity: 'CRITICAL', description: 'Life-threatening systemic allergic reaction' },
  { code: 'M35', name: 'Autoimmune Disorder', bodySystem: 'IMMUNOLOGICAL', clinicalDomain: 'Immunology', severity: 'SEVERE', description: 'Immune system attacking self-tissues' },
  { code: 'M32', name: 'Lupus', bodySystem: 'IMMUNOLOGICAL', clinicalDomain: 'Immunology', severity: 'SEVERE', description: 'Systemic lupus erythematosus, multisystem autoimmune disease' },
  { code: 'I00', name: 'Rheumatic Fever', bodySystem: 'IMMUNOLOGICAL', clinicalDomain: 'Immunology', severity: 'SEVERE', description: 'Post-streptococcal autoimmune inflammatory disease' },
]

// ============================================================
// HINDI ALIASES for common health issues
// ============================================================
const HINDI_ALIASES: Record<string, string[]> = {
  'Hypertension': ['uncha rakt chaap', 'bp high', 'raktavbhighata'],
  'Asthma': ['dama', 'svas kash', 'dam'],
  'Diabetes Type 2': ['madhumeh', 'sugar', 'prameha'],
  'Migraine': ['ardh shirsh shool', 'migraine ka dard'],
  'Depression': ['avsad', 'udaas', 'man ki kamzori'],
  'Eczema': ['pama', 'chhapaki', 'twacha rog'],
  'GERD': ['amlapitta', 'acidit', 'pet mein acid'],
  'Constipation': ['kabz', 'kabja', 'vibhandh'],
  'Osteoarthritis': ['sandhi gath vath', 'jod ka dard'],
  'Insomnia': ['neend na aana', 'anidra'],
  'Anaphylaxis': ['teji se allergy', 'gambhir allergic pratikriya'],
  'Myocardial Infarction': ['dil ka daura', 'heart attack'],
  'Stroke': ['lakva', 'brain attack', 'pakshaghat'],
  'Pneumonia': ['phuphuphi sozish', 'naumoniya'],
  'Tuberculosis': ['kshay rog', 't.b.', 'tapkesh'],
  'Cirrhosis': ['yakrit kathinata', 'liver cirrhosis'],
  'Epilepsy': ['mirgi', 'apasmara', 'daure'],
  'Gout': ['gathiya', 'vat rakta gath'],
  'PCOS': ['ovarian cyst', 'stri rog'],
  'Hepatitis B': ['yakrit sozish b', 'hepatitis b'],
}

// ============================================================
// WING APPROACHES - per body system (fallback when specific not available)
// ============================================================
const WING_BY_SYSTEM: Record<string, { ALLOPATHY: string; AYURVEDA: string; HOMEOPATHY: string }> = {
  CARDIOVASCULAR: { ALLOPATHY: 'Pharmacological management: antihypertensives, antiarrhythmics, anticoagulants. Lifestyle: DASH diet, exercise, smoking cessation.', AYURVEDA: 'Hridya herbs: Arjuna, Guggulu, Sarpagandha. Panchakarma: Hrid Basti. Diet: low salt, Medhya Rasayana. Pranayama.', HOMEOPATHY: 'Constitutional remedy based on cardiovascular symptom picture. Natrum Mur, Lachesis, Glonoine for acute episodes.' },
  RESPIRATORY: { ALLOPATHY: 'Bronchodilators, inhaled corticosteroids, antihistamines, antibiotics if bacterial. Step-wise therapy for asthma.', AYURVEDA: 'Shwasahara herbs: Kantakari, Vasa, Pippali. Talisadi/Sitopaladi Churna. Nasya for upper respiratory. Pranayama.', HOMEOPATHY: 'Remedy selection based on respiratory symptom totality. Arsenicum for wheezing, Bryonia for dry cough, Ant Tart for rattling.' },
  GASTROINTESTINAL: { ALLOPATHY: 'PPIs, antacids, antispasmodics, antibiotics for H. pylori. Endoscopy for diagnosis. Lifestyle modifications.', AYURVEDA: 'Agni-deepana and Pachana herbs: Hingwastak, Pippali, Trikatu. Avipattikar for acidity. Basti for IBS.', HOMEOPATHY: 'Nux Vomica for GI from lifestyle excess, Pulsatilla for rich food, Carbo Veg for bloating, Arsenicum for food poisoning.' },
  NEUROLOGICAL: { ALLOPATHY: 'Disease-specific: anticonvulsants, dopaminergics, thrombolytics. Pain management: NSAIDs, gabapentinoids.', AYURVEDA: 'Medhya Rasayana: Brahmi, Ashwagandha, Shankhpushpi. Shirodhara for headache. Kati Basti for sciatica. Nasya therapy.', HOMEOPATHY: 'Constitutional prescribing. Belladonna for acute throbbing, Gelsemium for heaviness, Natrum Mur for chronic headache.' },
  MUSCULOSKELETAL: { ALLOPATHY: 'NSAIDs, DMARDs, biologics, corticosteroids. Physiotherapy. Joint replacement for advanced disease.', AYURVEDA: 'Vata-hara herbs: Guggulu, Rasna, Bala. Yogaraj Guggulu for arthritis. Kati Basti, Pinda Sweda. Abhyanga with Mahanarayan Taila.', HOMEOPATHY: 'Rhus Tox for worse-at-rest, Bryonia for worse-with-movement, Arnica for injury, Calcarea Carb for bone health.' },
  ENDOCRINE: { ALLOPATHY: 'Hormone replacement, insulin, oral hypoglycemics, anti-thyroid drugs. Regular monitoring of levels.', AYURVEDA: 'Guduchi, Karela, Jamun for diabetes. Kanchanar Guggulu for thyroid. Shatavari for hormonal balance. Pathya Ahara-Vihara.', HOMEOPATHY: 'Syzygium for diabetes, Thyroidinum for thyroid, Natrum Mur for diabetes with emotional component.' },
  DERMATOLOGICAL: { ALLOPATHY: 'Topical corticosteroids, immunomodulators, antifungals, retinoids. Phototherapy for psoriasis.', AYURVEDA: 'Twacha rog herbs: Nimba, Manjishtha, Khadira. Panchatikta Ghrita for eczema. Raktashodhana (blood purification).', HOMEOPATHY: 'Sulphur for itching, Graphites for oozing, Arsenicum for burning, Psorinum for chronic skin, Thuja for warts.' },
  MENTAL_HEALTH: { ALLOPATHY: 'SSRIs, SNRIs, benzodiazepines (short-term), antipsychotics. CBT, counseling, lifestyle interventions.', AYURVEDA: 'Medhya Rasayana: Ashwagandha, Brahmi, Shankhpushpi, Jatamansi. Shirodhara, Abhyanga. Nidra promotion.', HOMEOPATHY: 'Ignatia for grief, Natrum Mur for suppressed emotions, Aurum Met for severe depression, Aconite for acute anxiety.' },
  ENT: { ALLOPATHY: 'Decongestants, antihistamines, antibiotics for bacterial infection. Steroid nasal sprays. Surgery when indicated.', AYURVEDA: 'Nasya therapy with Anu Taila. Talisadi for sinusitis. Haridra for allergy. Shunthi for pharyngitis.', HOMEOPATHY: 'Pulsatilla for thick discharge, Kali Bich for sinus, Belladonna for throbbing ear pain, Hepar Sulph for tonsillitis.' },
  UROLOGICAL: { ALLOPATHY: 'Antibiotics for UTI, alpha-blockers for BPH, PDE5 inhibitors for ED. Lithotripsy for stones.', AYURVEDA: 'Mutrakricchra herbs: Gokshura, Punarnava, Varuna. Chandraprabha Vati. Basti therapy for prostate.', HOMEOPATHY: 'Cantharis for UTI with burning, Lycopodium for prostate, Berberis for kidney stones, Sarsaparilla for renal colic.' },
  REPRODUCTIVE: { ALLOPATHY: 'Hormonal therapy, NSAIDs for pain, surgery for fibroids/endometriosis. Fertility treatments.', AYURVEDA: 'Shatavari for female reproductive health, Ashoka for menorrhagia, Lodhra for leucorrhea. Uttar Basti.', HOMEOPATHY: 'Pulsatilla for menstrual irregularity, Sepia for menopause, Calcarea Carb for heavy menses, Sabina for bleeding.' },
  OPHTHALMOLOGICAL: { ALLOPATHY: 'IOP-lowering drops for glaucoma, surgery for cataract. Anti-VEGF for macular degeneration. Artificial tears.', AYURVEDA: 'Triphala eye wash, Saptamrita Lauha. Nasya and Shirodhara for eye strain. Dietary: Amla, carrot.', HOMEOPATHY: 'Physostigma for glaucoma, Calcarea Fluor for cataract, Euphrasia for conjunctivitis.' },
  HEMATOLOGICAL: { ALLOPATHY: 'Iron supplements, B12 injections, transfusions. Anticoagulants. Chemotherapy for leukemia.', AYURVEDA: 'Punarnava, Manjishtha for blood purification. Loh Bhasma for iron deficiency. Amalaki for vitamin C.', HOMEOPATHY: 'Ferrum Phos for anemia, China for blood loss, Phosphorus for bleeding disorders.' },
  IMMUNOLOGICAL: { ALLOPATHY: 'Antihistamines, epinephrine for anaphylaxis, immunosuppressants for autoimmune. Biologics for lupus.', AYURVEDA: 'Guduchi for immunity, Nimba for allergy, Manjishtha for autoimmune. Panchatikta Ghrita.', HOMEOPATHY: 'Apis for allergic swelling, Arsenicum for allergic asthma, Thuja for immune dysfunction, Sulphur for chronic allergy.' },
}

// Specific wing overrides for key conditions
const WING_SPECIFIC: Record<string, { ALLOPATHY: string; AYURVEDA: string; HOMEOPATHY: string }> = {
  'Hypertension': { ALLOPATHY: 'Amlodipine, Losartan, ACE inhibitors, diuretics. Lifestyle: DASH diet, exercise, salt restriction, weight management.', AYURVEDA: 'Arjuna kwath, Sarpagandha (Rauwolfia serpentina), Guggulu, Pranayama (Bhastrika, Anulom Vilom), low-salt diet.', HOMEOPATHY: 'Natrum Mur for emotional causes, Lachesis for high BP with hot flashes, Glonoine for sudden BP spike, Baryta Carb for elderly.' },
  'Diabetes Type 2': { ALLOPATHY: 'Metformin first-line, Sulfonylureas, DPP-4 inhibitors, SGLT2 inhibitors, GLP-1 agonists. Insulin if needed.', AYURVEDA: 'Guduchi, Jamun seed, Karela, Meshashringi, Chandraprabha Vati. Pathya Ahara: bitter gourd, barley. Vyayama.', HOMEOPATHY: 'Syzygium Jambolanum for blood sugar, Phosphoric Acid for weakness from diabetes, Uranium Nitricum for diabetes with emaciation.' },
  'Asthma': { ALLOPATHY: 'Bronchodilators (Salbutamol), inhaled corticosteroids, Montelukast. Step-wise therapy per GINA guidelines.', AYURVEDA: 'Kanakasava, Bharangyadi Avaleha, Shwasakuthar Rasa, Pippali long pepper therapy (Vardhamana Pippali).', HOMEOPATHY: 'Arsenicum Album for wheezing with anxiety, Natrum Sulph for humid asthma, Blatta Orientalis for severe attacks.' },
  'Depression': { ALLOPATHY: 'SSRIs (Fluoxetine, Sertraline), SNRIs (Venlafaxine), atypical antidepressants. CBT, exercise, sleep hygiene.', AYURVEDA: 'Ashwagandha, Brahmi, Shankhpushpi, Jatamansi. Shirodhara with Brahmi Taila. Abhyanga. Medhya Rasayana.', HOMEOPATHY: 'Natrum Mur for grief, Ignatia for emotional paradoxical symptoms, Aurum Met for severe depression, Sepia for post-partum.' },
  'Migraine': { ALLOPATHY: 'Acute: Triptans, NSAIDs. Prophylaxis: Propranolol, Flunarizine, Topiramate. Identify triggers.', AYURVEDA: 'Shirashoolari Vati, Brahmi for stress migraine, Nasya with Anu Taila, Shirodhara. Avoid triggers (Amla, Ati-Matra).', HOMEOPATHY: 'Belladonna for throbbing right-sided, Iris for migraine with visual aura, Natrum Mur for periodic migraine, Sanguinaria for right-sided.' },
}

// ============================================================
// ALLOPATHY MEDICINES (80+)
// ============================================================
const ALLOPATHY_MEDS = [
  // Analgesics/Antipyretics
  { name: 'Paracetamol', generic: 'Acetaminophen', category: 'ANALGESIC', form: 'TABLET', strength: '500mg', mfr: 'Generic', isRx: false, schedule: 'OTC' },
  { name: 'Ibuprofen', generic: 'Ibuprofen', category: 'NSAID', form: 'TABLET', strength: '400mg', mfr: 'Generic', isRx: false, schedule: 'OTC' },
  { name: 'Aspirin', generic: 'Acetylsalicylic Acid', category: 'NSAID', form: 'TABLET', strength: '75mg', mfr: 'Generic', isRx: false, schedule: 'OTC' },
  { name: 'Diclofenac', generic: 'Diclofenac Sodium', category: 'NSAID', form: 'TABLET', strength: '50mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Naproxen', generic: 'Naproxen', category: 'NSAID', form: 'TABLET', strength: '250mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Tramadol', generic: 'Tramadol HCl', category: 'OPIOID_ANALGESIC', form: 'CAPSULE', strength: '50mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H1' },
  { name: 'Morphine', generic: 'Morphine Sulfate', category: 'OPIOID_ANALGESIC', form: 'INJECTION', strength: '10mg/ml', mfr: 'Generic', isRx: true, schedule: 'NARCOTIC' },
  // Antibiotics
  { name: 'Amoxicillin', generic: 'Amoxicillin', category: 'ANTIBIOTIC', form: 'CAPSULE', strength: '500mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Azithromycin', generic: 'Azithromycin', category: 'ANTIBIOTIC', form: 'TABLET', strength: '500mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ciprofloxacin', generic: 'Ciprofloxacin', category: 'ANTIBIOTIC', form: 'TABLET', strength: '500mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ceftriaxone', generic: 'Ceftriaxone', category: 'ANTIBIOTIC', form: 'INJECTION', strength: '1g', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Doxycycline', generic: 'Doxycycline', category: 'ANTIBIOTIC', form: 'CAPSULE', strength: '100mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Metronidazole', generic: 'Metronidazole', category: 'ANTIBIOTIC', form: 'TABLET', strength: '400mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Fluconazole', generic: 'Fluconazole', category: 'ANTIFUNGAL', form: 'CAPSULE', strength: '150mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Trimethoprim-Sulfamethoxazole', generic: 'TMP-SMX', category: 'ANTIBIOTIC', form: 'TABLET', strength: '160/800mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Nitrofurantoin', generic: 'Nitrofurantoin', category: 'ANTIBIOTIC', form: 'CAPSULE', strength: '100mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Antidiabetic
  { name: 'Metformin', generic: 'Metformin HCl', category: 'ANTIDIABETIC', form: 'TABLET', strength: '500mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Glimepiride', generic: 'Glimepiride', category: 'ANTIDIABETIC', form: 'TABLET', strength: '2mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Sitagliptin', generic: 'Sitagliptin', category: 'ANTIDIABETIC', form: 'TABLET', strength: '100mg', mfr: 'MSD', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Pioglitazone', generic: 'Pioglitazone', category: 'ANTIDIABETIC', form: 'TABLET', strength: '15mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Dapagliflozin', generic: 'Dapagliflozin', category: 'ANTIDIABETIC', form: 'TABLET', strength: '10mg', mfr: 'AstraZeneca', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Insulin Glargine', generic: 'Insulin Glargine', category: 'ANTIDIABETIC', form: 'INJECTION', strength: '100U/ml', mfr: 'Sanofi', isRx: true, schedule: 'SCHEDULE_H' },
  // Cardiovascular
  { name: 'Amlodipine', generic: 'Amlodipine Besylate', category: 'ANTIHYPERTENSIVE', form: 'TABLET', strength: '5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Losartan', generic: 'Losartan Potassium', category: 'ANTIHYPERTENSIVE', form: 'TABLET', strength: '50mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Atenolol', generic: 'Atenolol', category: 'ANTIHYPERTENSIVE', form: 'TABLET', strength: '50mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Metoprolol', generic: 'Metoprolol Succinate', category: 'ANTIHYPERTENSIVE', form: 'TABLET', strength: '50mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ramipril', generic: 'Ramipril', category: 'ACE_INHIBITOR', form: 'TABLET', strength: '5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Enalapril', generic: 'Enalapril Maleate', category: 'ACE_INHIBITOR', form: 'TABLET', strength: '10mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Telmisartan', generic: 'Telmisartan', category: 'ANTIHYPERTENSIVE', form: 'TABLET', strength: '40mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Clopidogrel', generic: 'Clopidogrel', category: 'ANTIPLATELET', form: 'TABLET', strength: '75mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Warfarin', generic: 'Warfarin Sodium', category: 'ANTICOAGULANT', form: 'TABLET', strength: '5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Atorvastatin', generic: 'Atorvastatin', category: 'STATIN', form: 'TABLET', strength: '10mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Rosuvastatin', generic: 'Rosuvastatin', category: 'STATIN', form: 'TABLET', strength: '10mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Digoxin', generic: 'Digoxin', category: 'CARDIAC', form: 'TABLET', strength: '0.25mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Amiodarone', generic: 'Amiodarone', category: 'ANTIARRHYTHMIC', form: 'TABLET', strength: '200mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // GI
  { name: 'Omeprazole', generic: 'Omeprazole', category: 'PPI', form: 'CAPSULE', strength: '20mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Pantoprazole', generic: 'Pantoprazole', category: 'PPI', form: 'TABLET', strength: '40mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ranitidine', generic: 'Ranitidine HCl', category: 'H2_BLOCKER', form: 'TABLET', strength: '150mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Domperidone', generic: 'Domperidone', category: 'PROKINETIC', form: 'TABLET', strength: '10mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ondansetron', generic: 'Ondansetron', category: 'ANTIEMETIC', form: 'TABLET', strength: '4mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Loperamide', generic: 'Loperamide', category: 'ANTIDIARRHEAL', form: 'CAPSULE', strength: '2mg', mfr: 'Generic', isRx: false, schedule: 'OTC' },
  // Respiratory
  { name: 'Montelukast', generic: 'Montelukast', category: 'LEUKOTRIENE_ANTAGONIST', form: 'TABLET', strength: '10mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Salbutamol', generic: 'Salbutamol', category: 'BRONCHODILATOR', form: 'INHALER', strength: '100mcg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ipratropium', generic: 'Ipratropium Bromide', category: 'BRONCHODILATOR', form: 'INHALER', strength: '20mcg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Budesonide', generic: 'Budesonide', category: 'INHALED_CORTICOSTEROID', form: 'INHALER', strength: '200mcg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Fluticasone', generic: 'Fluticasone Propionate', category: 'INHALED_CORTICOSTEROID', form: 'INHALER', strength: '250mcg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Theophylline', generic: 'Theophylline', category: 'BRONCHODILATOR', form: 'TABLET', strength: '200mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Allergy
  { name: 'Cetirizine', generic: 'Cetirizine', category: 'ANTIHISTAMINE', form: 'TABLET', strength: '10mg', mfr: 'Generic', isRx: false, schedule: 'OTC' },
  { name: 'Loratadine', generic: 'Loratadine', category: 'ANTIHISTAMINE', form: 'TABLET', strength: '10mg', mfr: 'Generic', isRx: false, schedule: 'OTC' },
  { name: 'Fexofenadine', generic: 'Fexofenadine', category: 'ANTIHISTAMINE', form: 'TABLET', strength: '120mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Steroids
  { name: 'Prednisolone', generic: 'Prednisolone', category: 'CORTICOSTEROID', form: 'TABLET', strength: '5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Dexamethasone', generic: 'Dexamethasone', category: 'CORTICOSTEROID', form: 'TABLET', strength: '4mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Hydrocortisone', generic: 'Hydrocortisone', category: 'TOPICAL_STEROID', form: 'CREAM', strength: '1%', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Mometasone', generic: 'Mometasone Furoate', category: 'TOPICAL_STEROID', form: 'CREAM', strength: '0.1%', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Betamethasone', generic: 'Betamethasone', category: 'TOPICAL_STEROID', form: 'CREAM', strength: '0.05%', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Psychiatric
  { name: 'Sertraline', generic: 'Sertraline', category: 'SSRI', form: 'TABLET', strength: '50mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Fluoxetine', generic: 'Fluoxetine', category: 'SSRI', form: 'CAPSULE', strength: '20mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Alprazolam', generic: 'Alprazolam', category: 'BENZODIAZEPINE', form: 'TABLET', strength: '0.5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_X' },
  { name: 'Diazepam', generic: 'Diazepam', category: 'BENZODIAZEPINE', form: 'TABLET', strength: '5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_X' },
  // Endocrine
  { name: 'Levothyroxine', generic: 'Levothyroxine', category: 'THYROID', form: 'TABLET', strength: '50mcg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Diuretics
  { name: 'Furosemide', generic: 'Furosemide', category: 'DIURETIC', form: 'TABLET', strength: '40mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Spironolactone', generic: 'Spironolactone', category: 'DIURETIC', form: 'TABLET', strength: '25mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Neurological
  { name: 'Gabapentin', generic: 'Gabapentin', category: 'ANTICONVULSANT', form: 'CAPSULE', strength: '300mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Pregabalin', generic: 'Pregabalin', category: 'ANTICONVULSANT', form: 'CAPSULE', strength: '75mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H1' },
  { name: 'Carbamazepine', generic: 'Carbamazepine', category: 'ANTICONVULSANT', form: 'TABLET', strength: '200mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Valproate', generic: 'Sodium Valproate', category: 'ANTICONVULSANT', form: 'TABLET', strength: '200mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Levetiracetam', generic: 'Levetiracetam', category: 'ANTICONVULSANT', form: 'TABLET', strength: '500mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Levodopa-Carbidopa', generic: 'Levodopa/Carbidopa', category: 'ANTIPARKINSON', form: 'TABLET', strength: '100/25mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ropinirole', generic: 'Ropinirole', category: 'ANTIPARKINSON', form: 'TABLET', strength: '0.5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Nimodipine', generic: 'Nimodipine', category: 'CALCIUM_CHANNEL_BLOCKER', form: 'TABLET', strength: '30mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Urological
  { name: 'Tamsulosin', generic: 'Tamsulosin', category: 'ALPHA_BLOCKER', form: 'CAPSULE', strength: '0.4mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Finasteride', generic: 'Finasteride', category: '5_ALPHA_REDUCTASE_INHIBITOR', form: 'TABLET', strength: '5mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Sildenafil', generic: 'Sildenafil', category: 'PDE5_INHIBITOR', form: 'TABLET', strength: '50mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Anti-infective (parasitic)
  { name: 'Albendazole', generic: 'Albendazole', category: 'ANTHELMINTIC', form: 'TABLET', strength: '400mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Ivermectin', generic: 'Ivermectin', category: 'ANTIPARASITIC', form: 'TABLET', strength: '6mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Chloroquine', generic: 'Chloroquine Phosphate', category: 'ANTIMALARIAL', form: 'TABLET', strength: '250mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  { name: 'Artemether', generic: 'Artemether', category: 'ANTIMALARIAL', form: 'INJECTION', strength: '80mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
  // Others
  { name: 'ORS', generic: 'Oral Rehydration Salts', category: 'REHYDRATION', form: 'SYRUP', strength: '21.5g/L', mfr: 'Generic', isRx: false, schedule: 'OTC' },
  { name: 'Ranolazine', generic: 'Ranolazine', category: 'ANTIANGINAL', form: 'TABLET', strength: '500mg', mfr: 'Generic', isRx: true, schedule: 'SCHEDULE_H' },
]

// ============================================================
// AYURVEDA MEDICINES (50+)
// ============================================================
const AYURVEDA_MEDS = [
  // Single Herbs
  { name: 'Ashwagandha', category: 'RASAYANA', form: 'CHURNA', strength: '5g' },
  { name: 'Brahmi', category: 'MEDHYA', form: 'CHURNA', strength: '5g' },
  { name: 'Triphala', category: 'DIGESTIVE', form: 'CHURNA', strength: '5g' },
  { name: 'Chyawanprash', category: 'RASAYANA', form: 'LEHYAM', strength: '500g' },
  { name: 'Shatavari', category: 'STREEJEEVAK', form: 'CHURNA', strength: '5g' },
  { name: 'Guggulu', category: 'MEDOHARA', form: 'VATI', strength: '500mg' },
  { name: 'Haridra (Turmeric)', category: 'ANTIINFLAMMATORY', form: 'CHURNA', strength: '3g' },
  { name: 'Nimba (Neem)', category: 'VISHAGHNA', form: 'CHURNA', strength: '3g' },
  { name: 'Amalaki (Amla)', category: 'RASAYANA', form: 'CHURNA', strength: '5g' },
  { name: 'Tulsi', category: 'SHWASAHARA', form: 'ARK', strength: '5-10ml' },
  { name: 'Arjuna', category: 'HRIDYA', form: 'KWATH', strength: '15-30ml' },
  { name: 'Guduchi', category: 'RASAYANA', form: 'KWATH', strength: '15-30ml' },
  { name: 'Pippali', category: 'SHWASAHARA', form: 'CHURNA', strength: '2g' },
  { name: 'Yashtimadhu', category: 'SHWASAHARA', form: 'CHURNA', strength: '3g' },
  { name: 'Shankhpushpi', category: 'MEDHYA', form: 'CHURNA', strength: '5g' },
  { name: 'Bhringraj', category: 'KESHYA', form: 'THAILAM', strength: '100ml' },
  { name: 'Kutki', category: 'YAKRITUTTEJAK', form: 'CHURNA', strength: '2g' },
  { name: 'Kalmegh', category: 'YAKRITUTTEJAK', form: 'CHURNA', strength: '3g' },
  { name: 'Manjishtha', category: 'VISHAGHNA', form: 'CHURNA', strength: '3g' },
  { name: 'Sariva', category: 'VISHAGHNA', form: 'CHURNA', strength: '5g' },
  { name: 'Chandan', category: 'DAHAPRASHAMANA', form: 'CHURNA', strength: '2g' },
  { name: 'Musta', category: 'DIGESTIVE', form: 'CHURNA', strength: '5g' },
  { name: 'Punarnava', category: 'MUTRAKRICCHRA', form: 'KWATH', strength: '15-30ml' },
  // Classical Formulations
  { name: 'Dashmool', category: 'VATAVYADHI', form: 'KWATH', strength: '15-30ml' },
  { name: 'Sutshekhar Ras', category: 'AMLAPITTA', form: 'RAS', strength: '250mg' },
  { name: 'Praval Panchamrit', category: 'AMLAPITTA', form: 'RAS', strength: '250mg' },
  { name: 'Kamdudha Ras', category: 'RAKTAPITTA', form: 'RAS', strength: '250mg' },
  { name: 'Laghu Sutshekhar', category: 'AMLAPITTA', form: 'RAS', strength: '125mg' },
  { name: 'Arogyavardhini Vati', category: 'YAKRITVIKAR', form: 'VATI', strength: '250mg' },
  { name: 'Trikatu', category: 'AGNIVARDHAK', form: 'CHURNA', strength: '500mg' },
  { name: 'Avipattikar Churna', category: 'AMLAPITTA', form: 'CHURNA', strength: '3g' },
  { name: 'Hingwastak Churna', category: 'AGNIVARDHAK', form: 'CHURNA', strength: '3g' },
  { name: 'Sitopaladi Churna', category: 'SHWASAHARA', form: 'CHURNA', strength: '3g' },
  { name: 'Talisadi Churna', category: 'SHWASAHARA', form: 'CHURNA', strength: '3g' },
  { name: 'Mahasudarshan Ghan Vati', category: 'JVARA', form: 'VATI', strength: '500mg' },
  { name: 'Gandhak Rasayan', category: 'KUSHTA', form: 'RAS', strength: '250mg' },
  { name: 'Kishore Guggulu', category: 'VATARAKTA', form: 'VATI', strength: '500mg' },
  { name: 'Kaishore Guggulu', category: 'VATARAKTA', form: 'VATI', strength: '500mg' },
  { name: 'Trayodashang Guggulu', category: 'VATAVYADHI', form: 'VATI', strength: '500mg' },
  { name: 'Maha Yograj Guggulu', category: 'VATAVYADHI', form: 'VATI', strength: '500mg' },
  { name: 'Panchamrit Parpati', category: 'AMLAPITTA', form: 'RAS', strength: '250mg' },
  { name: 'Laxmi Vilas Ras', category: 'VATAVYADHI', form: 'RAS', strength: '125mg' },
  { name: 'Mahalakshmivilas Ras', category: 'VATAVYADHI', form: 'RAS', strength: '125mg' },
  { name: 'Brihat Vat Chintamani Ras', category: 'VATAVYADHI', form: 'RAS', strength: '125mg' },
  { name: 'Sameer Pannag Ras', category: 'VATAVYADHI', form: 'RAS', strength: '125mg' },
  { name: 'Vasant Kusumakar Ras', category: 'PRAMEHA', form: 'RAS', strength: '125mg' },
  // Bhasma
  { name: 'Swarna Bhasma', category: 'BHASMA', form: 'BHASMA', strength: '15mg' },
  { name: 'Abhrak Bhasma', category: 'BHASMA', form: 'BHASMA', strength: '125mg' },
  { name: 'Praval Bhasma', category: 'BHASMA', form: 'BHASMA', strength: '250mg' },
  { name: 'Loh Bhasma', category: 'BHASMA', form: 'BHASMA', strength: '125mg' },
  { name: 'Shankh Bhasma', category: 'BHASMA', form: 'BHASMA', strength: '250mg' },
  { name: 'Godanti Bhasma', category: 'BHASMA', form: 'BHASMA', strength: '250mg' },
  { name: 'Tamra Bhasma', category: 'BHASMA', form: 'BHASMA', strength: '125mg' },
]

// ============================================================
// HOMEOPATHY MEDICINES (40+)
// ============================================================
const HOMEOPATHY_MEDS = [
  { name: 'Nux Vomica', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Arsenicum Album', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Belladonna', category: 'FEBRILE', form: 'GLOBULES', strength: '30C' },
  { name: 'Bryonia Alba', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Rhus Tox', category: 'MUSCULOSKELETAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Pulsatilla', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Sulphur', category: 'SKIN', form: 'GLOBULES', strength: '30C' },
  { name: 'Lycopodium', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Natrum Mur', category: 'PSYCHIATRIC', form: 'GLOBULES', strength: '30C' },
  { name: 'Calcarea Carb', category: 'CONSTITUTIONAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Sepia', category: 'GYNECOLOGICAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Phosphorus', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Argentum Nitricum', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Ignatia', category: 'PSYCHIATRIC', form: 'GLOBULES', strength: '30C' },
  { name: 'Gelsemium', category: 'FEBRILE', form: 'GLOBULES', strength: '30C' },
  { name: 'Aconite', category: 'FEBRILE', form: 'GLOBULES', strength: '30C' },
  { name: 'Apis Mellifica', category: 'ALLERGY', form: 'GLOBULES', strength: '30C' },
  { name: 'Carbo Veg', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Nux Moschata', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Staphysagria', category: 'UROLOGICAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Calcarea Phos', category: 'CONSTITUTIONAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Kali Bich', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Merc Sol', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Silicea', category: 'CONSTITUTIONAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Hepar Sulph', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Thuja', category: 'SKIN', form: 'GLOBULES', strength: '30C' },
  { name: 'Medorrhinum', category: 'MIASMATIC', form: 'GLOBULES', strength: '30C' },
  { name: 'Tuberculinum', category: 'MIASMATIC', form: 'GLOBULES', strength: '30C' },
  { name: 'Psorinum', category: 'MIASMATIC', form: 'GLOBULES', strength: '30C' },
  { name: 'Carcinosinum', category: 'MIASMATIC', form: 'GLOBULES', strength: '30C' },
  { name: 'China', category: 'HEMATOLOGICAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Ipecac', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Drosera', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Spongia', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Antimonium Tart', category: 'RESPIRATORY', form: 'GLOBULES', strength: '30C' },
  { name: 'Colocynth', category: 'GASTROINTESTINAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Magnesia Phos', category: 'MUSCULOSKELETAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Ranunculus Bulb', category: 'MUSCULOSKELETAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Cimicifuga', category: 'GYNECOLOGICAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Ambra Grisea', category: 'PSYCHIATRIC', form: 'GLOBULES', strength: '30C' },
  { name: 'Arnica Montana', category: 'TRAUMA', form: 'GLOBULES', strength: '30C' },
  { name: 'Ruta Graveolens', category: 'MUSCULOSKELETAL', form: 'GLOBULES', strength: '30C' },
  { name: 'Euphrasia', category: 'OPHTHALMOLOGICAL', form: 'GLOBULES', strength: '30C' },
]

// ============================================================
// RECALL DATA
// ============================================================
const RECALL_DATA = [
  { batch: 'RB-2024-0451', reason: 'Dissolution failure - batch fails USP dissolution test specification', severity: 'MODERATE', initiatedBy: 'CDSCO' },
  { batch: 'RB-2024-0823', reason: 'Microbial contamination - exceed microbial limits in non-sterile product', severity: 'SEVERE', initiatedBy: 'CDSCO' },
  { batch: 'RB-2024-1102', reason: 'Label mix-up - incorrect strength declared on labeling', severity: 'SEVERE', initiatedBy: 'Manufacturer' },
  { batch: 'RB-2025-0089', reason: 'Impurity above specification - N-nitrosodimethylamine (NDMA) detected', severity: 'CRITICAL', initiatedBy: 'CDSCO' },
  { batch: 'RB-2025-0214', reason: 'Stability failure - content assay below specification at 12 months', severity: 'MODERATE', initiatedBy: 'Manufacturer' },
  { batch: 'RB-2025-0367', reason: 'Cross-contamination - trace penicillin detected in non-penicillin product', severity: 'CRITICAL', initiatedBy: 'CDSCO' },
]

// ============================================================
// SEED ROUTE HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  try {
    // Check if already seeded (both issues AND medicines)
    const existingIssues = await db.healthIssue.count()
    const existingMeds = await db.medicine.count()
    const forceReseed = new URL(req.url).searchParams.get('force') === 'true'
    if (existingIssues > 100 && existingMeds > 10 && !forceReseed) {
      return NextResponse.json({
        message: 'Already seeded',
        counts: { issues: existingIssues, medicines: existingMeds },
      })
    }

    // Ensure tenant exists
    let tenant = await db.tenant.findFirst()
    if (!tenant) {
      tenant = await db.tenant.create({ data: { name: 'MedGovern Demo', code: 'DEMO', jurisdiction: 'IN' } })
    }

    // ── Create Health Issues (skip if already exist) ──
    const createdIssues: Array<{ id: string; name: string; bodySystem: string }> = []

    if (existingIssues < 100) {
    for (const issue of HEALTH_ISSUES) {
      const created = await db.healthIssue.create({
        data: {
          code: issue.code,
          name: issue.name,
          description: issue.description,
          bodySystem: issue.bodySystem,
          clinicalDomain: issue.clinicalDomain,
          symptomGroup: issue.name,
          severity: issue.severity,
          chronicity: issue.severity === 'CRITICAL' ? 'ACUTE' : issue.severity === 'SEVERE' ? 'CHRONIC' : 'ACUTE',
          prevalence: issue.severity === 'CRITICAL' ? 'UNCOMMON' : issue.severity === 'SEVERE' ? 'COMMON' : 'VERY_COMMON',
          isActive: true,
          // Create aliases inline
          aliases: {
            create: [
              { alias: issue.name.toLowerCase(), language: 'en' },
              ...(HINDI_ALIASES[issue.name] || []).map(a => ({ alias: a, language: 'hi' })),
            ],
          },
          // Create translations inline (Hindi, Tamil, Bengali)
          translations: {
            create: [
              { language: 'hi', name: issue.name, description: `${issue.name} (Hindi)` },
              { language: 'ta', name: issue.name, description: `${issue.name} (Tamil)` },
              { language: 'bn', name: issue.name, description: `${issue.name} (Bengali)` },
            ],
          },
          // Create wing approaches inline
          wingApproaches: {
            create: (() => {
              const wingData = WING_SPECIFIC[issue.name] || WING_BY_SYSTEM[issue.bodySystem] || {
                ALLOPATHY: 'Evidence-based pharmacological treatment with lifestyle modifications.',
                AYURVEDA: 'Dosha-balancing approach with herbs, Panchakarma, diet (Ahara-Vihara).',
                HOMEOPATHY: 'Individualized remedy selection based on symptom totality and miasmatic analysis.',
              }
              return [
                { modality: 'ALLOPATHY', approach: wingData.ALLOPATHY, evidenceLevel: 'STRONG' },
                { modality: 'AYURVEDA', approach: wingData.AYURVEDA, evidenceLevel: 'TRADITIONAL' },
                { modality: 'HOMEOPATHY', approach: wingData.HOMEOPATHY, evidenceLevel: 'LIMITED' },
              ]
            })(),
          },
        },
      })
      createdIssues.push({ id: created.id, name: issue.name, bodySystem: issue.bodySystem })
    }
    } // end if (existingIssues < 100)

    // If issues already exist, load them for medicine indication linking
    if (createdIssues.length === 0 && existingIssues > 0) {
      const existingIssueRecords = await db.healthIssue.findMany({ select: { id: true, name: true, bodySystem: true } })
      createdIssues.push(...existingIssueRecords.map(i => ({ id: i.id, name: i.name, bodySystem: i.bodySystem || '' })))
    }

    // ── Create Allopathy Medicines (skip if already exist) ──
    const createdMeds: Array<{ id: string; name: string }> = []

    if (existingMeds < 10) {

    for (const med of ALLOPATHY_MEDS) {
      const m = await db.medicine.create({
        data: {
          name: med.name,
          genericName: med.generic,
          modality: 'ALLOPATHY',
          category: med.category,
          subCategory: med.schedule,
          form: med.form,
          strength: med.strength,
          manufacturer: med.mfr,
          isPrescription: med.isRx,
          isOTC: !med.isRx,
        },
      })
      createdMeds.push({ id: m.id, name: m.name })

      // Create ingredient
      await db.medicineIngredient.create({
        data: { medicineId: m.id, ingredient: med.name, quantity: med.strength, role: 'ACTIVE' },
      }).catch(() => {})

      // Create a basic indication for key medicines
      const indicationMap: Record<string, string> = {
        'Paracetamol': 'Fever, Headache, Body Pain',
        'Ibuprofen': 'Joint Pain, Back Pain, Inflammation',
        'Metformin': 'Diabetes Type 2',
        'Amlodipine': 'Hypertension',
        'Omeprazole': 'GERD, Peptic Ulcer',
        'Montelukast': 'Asthma',
        'Sertraline': 'Depression, Generalized Anxiety',
        'Levothyroxine': 'Hypothyroidism',
        'Atorvastatin': 'Coronary Artery Disease',
      }
      if (indicationMap[med.name]) {
        const indications = indicationMap[med.name].split(', ')
        for (const ind of indications) {
          const issue = createdIssues.find(i => i.name === ind || i.name.includes(ind))
          await db.medicineIndication.create({
            data: { medicineId: m.id, issueId: issue?.id, indication: ind, priority: 1 },
          }).catch(() => {})
        }
      }
    }

    // ── Create Ayurveda Medicines ──
    for (const med of AYURVEDA_MEDS) {
      const m = await db.medicine.create({
        data: {
          name: med.name,
          modality: 'AYURVEDA',
          category: med.category,
          form: med.form,
          strength: med.strength,
          isPrescription: false,
          isOTC: true,
        },
      })
      createdMeds.push({ id: m.id, name: m.name })

      await db.medicineIngredient.create({
        data: { medicineId: m.id, ingredient: med.name, quantity: med.strength, role: 'ACTIVE' },
      }).catch(() => {})

      // Ayurvedic indication mapping
      const ayurIndMap: Record<string, string[]> = {
        'Ashwagandha': ['Depression', 'Insomnia'],
        'Brahmi': ['Depression', 'Anxiety', 'Dementia'],
        'Triphala': ['Constipation'],
        'Chyawanprash': ['COPD'],
        'Shatavari': ['Menorrhagia', 'Irregular Menses'],
        'Arjuna': ['Hypertension', 'Heart Failure'],
        'Guduchi': ['Diabetes Type 2'],
        'Pippali': ['Asthma'],
        'Shankhpushpi': ['Insomnia', 'Generalized Anxiety'],
        'Kutki': ['Hepatitis B'],
        'Manjishtha': ['Eczema', 'Psoriasis'],
        'Punarnava': ['Kidney Stones'],
        'Sitopaladi Churna': ['Asthma', 'Bronchitis'],
        'Talisadi Churna': ['Asthma', 'Sinusitis'],
        'Hingwastak Churna': ['Dyspepsia', 'GERD'],
        'Arogyavardhini Vati': ['Hepatitis B', 'Cirrhosis'],
        'Vasant Kusumakar Ras': ['Diabetes Type 2'],
        'Kaishore Guggulu': ['Gout'],
        'Maha Yograj Guggulu': ['Rheumatoid Arthritis'],
      }
      if (ayurIndMap[med.name]) {
        for (const ind of ayurIndMap[med.name]) {
          const issue = createdIssues.find(i => i.name === ind || i.name.includes(ind))
          await db.medicineIndication.create({
            data: { medicineId: m.id, issueId: issue?.id, indication: ind, priority: 1 },
          }).catch(() => {})
        }
      }
    }

    // ── Create Homeopathy Medicines ──
    for (const med of HOMEOPATHY_MEDS) {
      const m = await db.medicine.create({
        data: {
          name: med.name,
          modality: 'HOMEOPATHY',
          category: med.category,
          form: med.form,
          strength: med.strength,
          isPrescription: false,
          isOTC: true,
        },
      })
      createdMeds.push({ id: m.id, name: m.name })

      await db.medicineIngredient.create({
        data: { medicineId: m.id, ingredient: med.name, quantity: med.strength, role: 'ACTIVE' },
      }).catch(() => {})

      // Homeopathy indication mapping
      const homoIndMap: Record<string, string[]> = {
        'Nux Vomica': ['Dyspepsia', 'Constipation'],
        'Arsenicum Album': ['Asthma', 'Diarrhea'],
        'Belladonna': ['Migraine', 'Otitis Media'],
        'Bryonia Alba': ['COPD', 'Constipation'],
        'Rhus Tox': ['Osteoarthritis', 'Back Pain'],
        'Pulsatilla': ['Sinusitis', 'Irregular Menses'],
        'Sulphur': ['Eczema', 'Psoriasis'],
        'Lycopodium': ['Dyspepsia', 'BPH'],
        'Natrum Mur': ['Depression', 'Migraine'],
        'Calcarea Carb': ['Osteoporosis'],
        'Sepia': ['Menorrhagia', 'Depression'],
        'Phosphorus': ['COPD', 'Pneumonia'],
        'Ignatia': ['Depression', 'Generalized Anxiety'],
        'Gelsemium': ['Influenza'],
        'Aconite': ['Myocardial Infarction'],
        'Apis Mellifica': ['Urticaria', 'Otitis Media'],
        'Carbo Veg': ['Dyspepsia'],
        'Drosera': ['Asthma', 'Bronchitis'],
        'Hepar Sulph': ['Tonsillitis', 'Cellulitis'],
        'Thuja': ['Vitiligo', 'Psoriasis'],
        'China': ['Iron Deficiency Anemia'],
        'Silicea': ['Osteoporosis'],
        'Cimicifuga': ['Dysmenorrhea', 'Migraine'],
        'Arnica Montana': ['Herniated Disc', 'Tendinitis'],
        'Ruta Graveolens': ['Tendinitis', 'Rotator Cuff Injury'],
        'Euphrasia': ['Conjunctivitis'],
        'Colocynth': ['IBS'],
        'Magnesia Phos': ['Dysmenorrhea'],
      }
      if (homoIndMap[med.name]) {
        for (const ind of homoIndMap[med.name]) {
          const issue = createdIssues.find(i => i.name === ind || i.name.includes(ind))
          await db.medicineIndication.create({
            data: { medicineId: m.id, issueId: issue?.id, indication: ind, priority: 1 },
          }).catch(() => {})
        }
      }
    }

    // ── Create Medicine Recalls ──
    // Assign recalls to some medicines
    const recallMedNames = ['Ranitidine', 'Metformin', 'Valsartan', 'Omeprazole', 'Azithromycin', 'Amoxicillin']
    for (let i = 0; i < RECALL_DATA.length; i++) {
      const recall = RECALL_DATA[i]
      const medName = recallMedNames[i]
      const med = createdMeds.find(m => m.name === medName)
      if (med) {
        await db.medicineRecall.create({
          data: {
            medicineId: med.id,
            batchNumber: recall.batch,
            reason: recall.reason,
            severity: recall.severity,
            initiatedBy: recall.initiatedBy,
            isActive: true,
          },
        }).catch(() => {})
      }
    }

    } // end if (existingMeds < 10)

    // ── Create Practitioners (if not exist) ──
    const existingPractitioners = await db.practitioner.count()
    if (existingPractitioners === 0) {
    await Promise.all([
      db.practitioner.create({ data: { tenantId: tenant.id, name: 'Dr. Sharma (Allopathy)', specialization: 'General Medicine', modality: 'ALLOPATHY', licenseNumber: 'AP-2024-001' } }),
      db.practitioner.create({ data: { tenantId: tenant.id, name: 'Vaidya Joshi (Ayurveda)', specialization: 'Kayachikitsa', modality: 'AYURVEDA', licenseNumber: 'AY-2024-001' } }),
      db.practitioner.create({ data: { tenantId: tenant.id, name: 'Dr. Patel (Homeopathy)', specialization: 'General Homeopathy', modality: 'HOMEOPATHY', licenseNumber: 'HO-2024-001' } }),
    ])
    } // end if (existingPractitioners === 0)

    // ── Create Demo Patients (if not exist) ──
    const existingPatients = await db.patient.count()
    const patients = []
    if (existingPatients === 0) {
    const patientNames = [
      { fn: 'Rahul', ln: 'Kumar', dob: '1990-01-15', g: 'M', bg: 'B+' },
      { fn: 'Priya', ln: 'Sharma', dob: '1985-03-22', g: 'F', bg: 'O+' },
      { fn: 'Amit', ln: 'Patel', dob: '1978-07-11', g: 'M', bg: 'A+' },
      { fn: 'Sunita', ln: 'Gupta', dob: '1992-11-05', g: 'F', bg: 'AB+' },
      { fn: 'Vikram', ln: 'Singh', dob: '1968-09-30', g: 'M', bg: 'O-' },
      { fn: 'Anjali', ln: 'Joshi', dob: '1995-04-18', g: 'F', bg: 'B+' },
    ]
    for (let i = 0; i < patientNames.length; i++) {
      patients.push(await db.patient.create({
        data: {
          tenantId: tenant.id,
          firstName: patientNames[i].fn,
          lastName: patientNames[i].ln,
          dateOfBirth: patientNames[i].dob,
          gender: patientNames[i].g,
          phone: `+91-9876543${100 + i}`,
          bloodGroup: patientNames[i].bg,
        },
      }))
    }
    } // end if (existingPatients === 0)

    // ── Return counts ──
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
        recalls: await db.medicineRecall.count(),
        patients: await db.patient.count(),
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 })
  }
}
