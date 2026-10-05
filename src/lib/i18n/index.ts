// ═══════════════════════════════════════════════════════════════════════
// i18n TRANSLATIONS — 12 Indian Languages
// This is the UI-level translation system (not just data-layer)
// ═══════════════════════════════════════════════════════════════════════

export type AppLanguage = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'ur'

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ',
  ur: 'اردو',
}

type TranslationKey = keyof typeof translations.en

const translations = {
  en: {
    // App
    appName: 'MedGovern AI',
    appTagline: 'Clinician-Governed Multi-Modality Healthcare SaaS',
    appVersion: 'v5.0',

    // Navigation
    navOverview: 'Overview',
    navPatientTools: 'Patient Tools',
    navClinical: 'Clinical',
    navClinicalWorkflow: 'Clinical Workflow',
    navFinance: 'Finance',
    navIntelligence: 'Intelligence',
    navCompliance: 'Compliance',
    navSystem: 'System',

    // Sections
    sectionDashboard: 'Dashboard',
    sectionPatients: 'Patients',
    sectionHealthIssues: 'Health Issues',
    sectionMedicines: 'Medicines',
    sectionSymptomChecker: 'Symptom Checker',
    sectionDrugInteractions: 'Drug Interactions',
    sectionScanVerify: 'Scan & Verify',
    sectionPharmacy: 'Pharmacy',
    sectionConsent: 'Consent',
    sectionIntake: 'Clinical Intake',
    sectionSafety: 'Safety Alerts',
    sectionClinicianQueue: 'Clinician Queue',
    sectionCarePlans: 'Care Plans',
    sectionKnowledge: 'Knowledge Base',
    sectionAudit: 'Audit Trail',
    sectionAnalytics: 'Analytics',
    sectionVoice: 'Voice Assistant',
    sectionRecalls: 'Drug Recalls',
    sectionAdmin: 'Administration',
    sectionAbha: 'ABHA',
    sectionCounterfeit: 'Counterfeit Reports',
    sectionExpiryTracker: 'Expiry Tracker',
    sectionMedicineCompare: 'Medicine Compare',
    sectionDosageTracker: 'Dosage Tracker',
    sectionVaccination: 'Vaccination',
    sectionPrescriptions: 'e-Prescription',
    sectionLabOrders: 'Lab Orders',
    sectionAppointments: 'Appointments',
    sectionClinicalNotes: 'Clinical Notes',
    sectionPatientTimeline: 'Patient Timeline',
    sectionInsurance: 'Insurance & Billing',
    sectionInventory: 'Pharmacy Inventory',
    sectionDischargeSummary: 'Discharge Summary',
    sectionNotifications: 'Notifications',
    sectionReferrals: 'Referrals',
    sectionDocuments: 'Documents & OCR',
    sectionTelemedicine: 'Telemedicine',
    sectionCds: 'CDS Alerts',
    sectionFollowUpReminders: 'Follow-up Reminders',

    // Common actions
    actionSearch: 'Search',
    actionAdd: 'Add',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    actionSave: 'Save',
    actionCancel: 'Cancel',
    actionSubmit: 'Submit',
    actionClose: 'Close',
    actionView: 'View',
    actionDownload: 'Download',
    actionPrint: 'Print',
    actionRefresh: 'Refresh',
    actionFilter: 'Filter',
    actionExport: 'Export',
    actionImport: 'Import',
    actionUpload: 'Upload',

    // Modality
    modalityAllopathy: 'Allopathy',
    modalityAyurveda: 'Ayurveda',
    modalityHomeopathy: 'Homeopathy',
    modalitySwitch: 'Switch Modality',

    // Roles
    rolePatient: 'Patient',
    roleClinician: 'Clinician',
    roleAdmin: 'Admin',

    // Clinical
    clinicalAssistant: 'Clinical Assistant',
    clinicalAskDoctor: 'Ask the Doctor AI',
    clinicalTypeSymptoms: 'Type your symptoms or health concern...',
    clinicalAnalyzing: 'Analyzing your symptoms...',
    clinicalRecommendations: 'Clinical Recommendations',
    clinicalAllopathyRec: 'Allopathy Recommendations',
    clinicalAyurvedaRec: 'Ayurveda Recommendations',
    clinicalHomeopathyRec: 'Homeopathy Recommendations',
    clinicalLabInterpretation: 'Lab Value Interpretation',
    clinicalSafetyWarnings: 'Safety Warnings',
    clinicalRedFlags: 'Red Flags — Seek Immediate Help',
    clinicalLifestyleAdvice: 'Lifestyle Advice',
    clinicalDietAdvice: 'Diet Advice',
    clinicalFollowUp: 'Follow-up Recommendations',
    clinicalWhenToSeeDoctor: 'When to See a Doctor',
    clinicalDisclaimer: 'This is clinical decision-support, not a prescription. Consult your doctor.',
    clinicalFirstLine: 'First-line Treatment',
    clinicalPrescription: 'Prescription Medicine',
    clinicalJanAushadhi: 'Jan Aushadhi Available',
    clinicalIndianBrand: 'Indian Brands',

    // Symptom Checker
    symptomTitle: 'AI Symptom Checker',
    symptomDescription: 'Describe your symptoms and get detailed clinical guidance across all three care modalities',
    symptomEnterSymptoms: 'Enter your symptoms (e.g., "headache, fever, body pain")',
    symptomAddSymptom: 'Add Symptom',
    symptomAnalyze: 'Analyze Symptoms',
    symptomLiveSuggestion: 'Live AI Suggestions',
    symptomPossibleConditions: 'Possible Conditions',
    symptomConfidence: 'Confidence',
    symptomAddLabValue: 'Add Lab Value',
    symptomTestName: 'Test Name',
    symptomTestValue: 'Value',
    symptomHbA1c: 'HbA1c',
    symptomFastingGlucose: 'Fasting Glucose',
    symptomCholesterol: 'Total Cholesterol',
    symptomLDL: 'LDL',
    symptomHDL: 'HDL',
    symptomTriglycerides: 'Triglycerides',
    symptomTSH: 'TSH',
    symptomHemoglobin: 'Hemoglobin',
    symptomCreatinine: 'Creatinine',
    symptomVitaminD: 'Vitamin D',

    // Prescription
    prescriptionTitle: 'e-Prescription',
    prescriptionCreate: 'Create Prescription',
    prescriptionAddMedicine: 'Add Medicine',
    prescriptionMedicineName: 'Medicine Name',
    prescriptionDosage: 'Dosage',
    prescriptionFrequency: 'Frequency',
    prescriptionDuration: 'Duration',
    prescriptionRoute: 'Route',
    prescriptionInstructions: 'Instructions',

    // Footer
    footerDisclaimer: 'This system provides clinical decision support only. All recommendations must be reviewed by a qualified healthcare practitioner.',
    footerCdscO: 'CDSCO Registry',
    footerVersion: 'Version 5.0',

    // General
    loading: 'Loading...',
    noData: 'No data available',
    error: 'An error occurred',
    retry: 'Retry',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    emergency: 'Emergency',
  },

  hi: {
    appName: 'मेडगवर्न AI',
    appTagline: 'चिकित्सक-नियंत्रित बहु-विधा स्वास्थ्य सेवा',
    appVersion: 'v5.0',
    navOverview: 'अवलोकन',
    navPatientTools: 'रोगी उपकरण',
    navClinical: 'चिकित्सकीय',
    navClinicalWorkflow: 'चिकित्सकीय कार्यप्रवाह',
    navFinance: 'वित्त',
    navIntelligence: 'बुद्धिमत्ता',
    navCompliance: 'अनुपालन',
    navSystem: 'प्रणाली',
    sectionDashboard: 'डैशबोर्ड',
    sectionPatients: 'रोगी',
    sectionHealthIssues: 'स्वास्थ्य समस्याएँ',
    sectionMedicines: 'दवाइयाँ',
    sectionSymptomChecker: 'लक्षण परीक्षक',
    sectionDrugInteractions: 'दवा परस्पर क्रिया',
    sectionScanVerify: 'स्कैन और सत्यापन',
    sectionPharmacy: 'औषधालय',
    sectionConsent: 'सहमति',
    sectionIntake: 'चिकित्सकीय प्रवेश',
    sectionSafety: 'सुरक्षा अलर्ट',
    sectionClinicianQueue: 'चिकित्सक कतार',
    sectionCarePlans: 'देखभाल योजना',
    sectionKnowledge: 'ज्ञान आधार',
    sectionAudit: 'ऑडिट ट्रेल',
    sectionAnalytics: 'विश्लेषण',
    sectionVoice: 'ध्वनि सहायक',
    sectionRecalls: 'दवा वापसी',
    sectionAdmin: 'प्रशासन',
    sectionAbha: 'ABHA',
    sectionCounterfeit: 'नकली रिपोर्ट',
    sectionExpiryTracker: 'समाप्ति ट्रैकर',
    sectionMedicineCompare: 'दवा तुलना',
    sectionDosageTracker: 'खुराक ट्रैकर',
    sectionVaccination: 'टीकाकरण',
    sectionPrescriptions: 'ई-पर्चा',
    sectionLabOrders: 'लैब ऑर्डर',
    sectionAppointments: 'अपॉइंटमेंट',
    sectionClinicalNotes: 'चिकित्सकीय नोट',
    sectionPatientTimeline: 'रोगी टाइमलाइन',
    sectionInsurance: 'बीमा और बिलिंग',
    sectionInventory: 'औषधालय इन्वेंटरी',
    sectionDischargeSummary: 'छुट्टी सारांश',
    sectionNotifications: 'सूचनाएँ',
    sectionReferrals: 'रेफरल',
    sectionDocuments: 'दस्तावेज़ और OCR',
    sectionTelemedicine: 'टेलीमेडिसिन',
    sectionCds: 'CDS अलर्ट',
    sectionFollowUpReminders: 'फॉलो-अप रिमाइंडर',
    actionSearch: 'खोजें',
    actionAdd: 'जोड़ें',
    actionEdit: 'संपादित करें',
    actionDelete: 'हटाएँ',
    actionSave: 'सहेजें',
    actionCancel: 'रद्द करें',
    actionSubmit: 'जमा करें',
    actionClose: 'बंद करें',
    actionView: 'देखें',
    actionDownload: 'डाउनलोड',
    actionPrint: 'प्रिंट',
    actionRefresh: 'रिफ्रेश',
    actionFilter: 'फिल्टर',
    actionExport: 'निर्यात',
    actionImport: 'आयात',
    actionUpload: 'अपलोड',
    modalityAllopathy: 'एलोपैथी',
    modalityAyurveda: 'आयुर्वेद',
    modalityHomeopathy: 'होम्योपैथी',
    modalitySwitch: 'विधा बदलें',
    rolePatient: 'रोगी',
    roleClinician: 'चिकित्सक',
    roleAdmin: 'व्यवस्थापक',
    clinicalAssistant: 'चिकित्सकीय सहायक',
    clinicalAskDoctor: 'डॉक्टर AI से पूछें',
    clinicalTypeSymptoms: 'अपने लक्षण या स्वास्थ्य समस्या लिखें...',
    clinicalAnalyzing: 'आपके लक्षणों का विश्लेषण हो रहा है...',
    clinicalRecommendations: 'चिकित्सकीय सिफारिशें',
    clinicalAllopathyRec: 'एलोपैथी सिफारिशें',
    clinicalAyurvedaRec: 'आयुर्वेद सिफारिशें',
    clinicalHomeopathyRec: 'होम्योपैथी सिफारिशें',
    clinicalLabInterpretation: 'लैब मान व्याख्या',
    clinicalSafetyWarnings: 'सुरक्षा चेतावनी',
    clinicalRedFlags: 'लाल झंडे — तत्काल सहायता लें',
    clinicalLifestyleAdvice: 'जीवनशैली सलाह',
    clinicalDietAdvice: 'आहार सलाह',
    clinicalFollowUp: 'फॉलो-अप सिफारिशें',
    clinicalWhenToSeeDoctor: 'डॉक्टर को कब दिखाएँ',
    clinicalDisclaimer: 'यह चिकित्सकीय निर्णय सहायता है, पर्चा नहीं। अपने डॉक्टर से परामर्श करें।',
    clinicalFirstLine: 'प्रथम-पंक्ति उपचार',
    clinicalPrescription: 'पर्चा दवा',
    clinicalJanAushadhi: 'जन औषधि उपलब्ध',
    clinicalIndianBrand: 'भारतीय ब्रांड',
    symptomTitle: 'AI लक्षण परीक्षक',
    symptomDescription: 'अपने लक्षण बताएँ और तीनों विधाओं में विस्तृत चिकित्सकीय मार्गदर्शन प्राप्त करें',
    symptomEnterSymptoms: 'लक्षण दर्ज करें (जैसे, "सिरदर्द, बुखार, शरीर दर्द")',
    symptomAddSymptom: 'लक्षण जोड़ें',
    symptomAnalyze: 'लक्षण विश्लेषण',
    symptomLiveSuggestion: 'लाइव AI सुझाव',
    symptomPossibleConditions: 'संभावित स्थितियाँ',
    symptomConfidence: 'विश्वास',
    symptomAddLabValue: 'लैब मान जोड़ें',
    symptomTestName: 'टेस्ट नाम',
    symptomTestValue: 'मान',
    symptomHbA1c: 'HbA1c',
    symptomFastingGlucose: 'फास्टिंग ग्लूकोज',
    symptomCholesterol: 'कुल कोलेस्ट्रॉल',
    symptomLDL: 'LDL',
    symptomHDL: 'HDL',
    symptomTriglycerides: 'ट्राइग्लिसराइड',
    symptomTSH: 'TSH',
    symptomHemoglobin: 'हीमोग्लोबिन',
    symptomCreatinine: 'क्रिएटिनिन',
    symptomVitaminD: 'विटामिन D',
    prescriptionTitle: 'ई-पर्चा',
    prescriptionCreate: 'पर्चा बनाएँ',
    prescriptionAddMedicine: 'दवा जोड़ें',
    prescriptionMedicineName: 'दवा का नाम',
    prescriptionDosage: 'खुराक',
    prescriptionFrequency: 'आवृत्ति',
    prescriptionDuration: 'अवधि',
    prescriptionRoute: 'मार्ग',
    prescriptionInstructions: 'निर्देश',
    footerDisclaimer: 'यह प्रणाली केवल चिकित्सकीय निर्णय सहायता प्रदान करती है। सभी सिफारिशें योग्य चिकित्सक द्वारा समीक्षित होनी चाहिए।',
    footerCdscO: 'CDSCO रजिस्ट्री',
    footerVersion: 'संस्करण 5.0',
    loading: 'लोड हो रहा है...',
    noData: 'डेटा उपलब्ध नहीं',
    error: 'एक त्रुटि हुई',
    retry: 'पुनः प्रयास',
    success: 'सफल',
    warning: 'चेतावनी',
    info: 'जानकारी',
    emergency: 'आपातकालीन',
  },

  // Other languages use English as fallback with native script names
  bn: {} as Record<string, string>,
  ta: {} as Record<string, string>,
  te: {} as Record<string, string>,
  mr: {} as Record<string, string>,
  gu: {} as Record<string, string>,
  kn: {} as Record<string, string>,
  ml: {} as Record<string, string>,
  pa: {} as Record<string, string>,
  or: {} as Record<string, string>,
  ur: {} as Record<string, string>,
}

// Fill missing translations with English fallback
for (const lang of Object.keys(translations) as AppLanguage[]) {
  if (lang === 'en' || lang === 'hi') continue
  for (const key of Object.keys(translations.en)) {
    if (!(key in translations[lang])) {
      (translations[lang] as Record<string, string>)[key] = translations.en[key as TranslationKey]
    }
  }
}

/**
 * Get translation for a key in the specified language
 * Falls back to English if key not found
 */
export function t(key: string, lang: AppLanguage = 'en'): string {
  const langTranslations = translations[lang]
  if (langTranslations && key in langTranslations) {
    return langTranslations[key as keyof typeof langTranslations]
  }
  // Fallback to English
  if (key in translations.en) {
    return translations.en[key as TranslationKey]
  }
  return key
}

/**
 * Get all translations for a language
 */
export function getTranslations(lang: AppLanguage = 'en'): Record<string, string> {
  return translations[lang] || translations.en
}

export { translations }
