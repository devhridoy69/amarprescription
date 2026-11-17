// Ready-Made Clinical Prescription Protocols / Templates
export const PRESCRIPTION_TEMPLATES = [
  {
    id: 'tpl-viral-fever',
    title: 'Viral Fever / Common Cold (সাধারণ সর্দি ও জ্বর)',
    category: 'General Medicine',
    diagnosis: 'Acute Viral URTI with Fever',
    complaints: [
      { text: 'Fever (জ্বর) - ১০২° ফারেনহাইট', duration: '৩ দিন' },
      { text: 'Runny nose & sneezing (সর্দি ও হাঁচি)', duration: '৩ দিন' },
      { text: 'Dry cough (শুকনা কাশি)', duration: '২ দিন' },
      { text: 'Body ache & headache (গা হাত-পা ব্যথা)', duration: '২ দিন' },
    ],
    vitals: {
      bp: '120/80',
      pulse: '84',
      temp: '101.4',
      weight: '62',
      spo2: '98',
      rbs: ''
    },
    investigations: [
      'CBC with ESR',
      'Dengue NS1 Antigen (if fever persists > 3 days)'
    ],
    medicines: [
      {
        id: 't-med-1',
        type: 'Tab',
        brandName: 'Napa Extend',
        genericName: 'Paracetamol',
        strength: '665 mg',
        dosage: '1+0+1',
        unit: 'Tablet',
        instruction: 'ভরা পেটে (৮ ঘণ্টা পর পর)',
        duration: '৫ দিন',
        isFraction: false
      },
      {
        id: 't-med-2',
        type: 'Tab',
        brandName: 'Fexo',
        genericName: 'Fexofenadine HCl',
        strength: '120 mg',
        dosage: '0+0+1',
        unit: 'Tablet',
        instruction: 'রাতে খাবার পর',
        duration: '৭ দিন',
        isFraction: false
      },
      {
        id: 't-med-3',
        type: 'Tab',
        brandName: 'Maxpro',
        genericName: 'Esomeprazole',
        strength: '20 mg',
        dosage: '1+0+1',
        unit: 'Tablet',
        instruction: 'খাবার ২০ মিনিট আগে',
        duration: '৭ দিন',
        isFraction: false
      },
      {
        id: 't-med-4',
        type: 'Syp',
        brandName: 'Adrylex Syrup',
        genericName: 'Dextromethorphan + Phenylephrine',
        strength: 'Cough Formula',
        dosage: '1+1+1',
        unit: '১/২ কাপ (Half Cup) কুসুম গরম পানিতে ২ চামচ',
        instruction: 'খাবার পর কুসুম গরম পানি সহ',
        duration: '৫ দিন',
        isFraction: true,
        fractionDetail: { num: 1, den: 2, label: '1/2' }
      }
    ],
    advice: [
      'প্রচুর পরিমাণে বিশুদ্ধ পানি ও তরল খাবার গ্রহণ করুন',
      'কুসুম গরম পানিতে লবণ দিয়ে কুলকুচি ও গড়গড়া করবেন দিনে ৩ বার',
      'ধুলোবালি ও ঠান্ডা বাতাস এড়িয়ে চলুন এবং মাস্ক ব্যবহার করুন',
      'পর্যাপ্ত বিশ্রাম নিন'
    ],
    nextVisit: '৫ দিন পর (জ্বর না কমলে দ্রুত যোগাযোগ করবেন)'
  },
  {
    id: 'tpl-gerd-gastritis',
    title: 'Gastritis & Acid Reflux (গ্যাস্ট্রিক ও বুক জ্বালা)',
    category: 'Gastroenterology',
    diagnosis: 'Acid Peptic Disease (APD) / GERD',
    complaints: [
      { text: 'Burning sensation in chest & epigastrium (বুক ও পেট জ্বালাপোড়া)', duration: '৭ দিন' },
      { text: 'Sour belching & nausea (টক ঢেঁকুর ও বমি বমি ভাব)', duration: '৫ দিন' },
      { text: 'Loss of appetite (খাবারে অরুচি)', duration: '৭ দিন' },
    ],
    vitals: {
      bp: '125/80',
      pulse: '76',
      temp: '98.4',
      weight: '68',
      spo2: '99',
      rbs: ''
    },
    investigations: [
      'USG of Whole Abdomen',
      'Serum Creatinine',
      'Endoscopy of Upper GI Tract (if no response)'
    ],
    medicines: [
      {
        id: 't-med-5',
        type: 'Tab',
        brandName: 'Pantonix',
        genericName: 'Pantoprazole',
        strength: '20 mg',
        dosage: '1+0+1',
        unit: 'Tablet',
        instruction: 'খাবার ৩০ মিনিট আগে খালি পেটে',
        duration: '১৪ দিন',
        isFraction: false
      },
      {
        id: 't-med-6',
        type: 'Tab',
        brandName: 'Motigut',
        genericName: 'Domperidone',
        strength: '10 mg',
        dosage: '1+1+1',
        unit: 'Tablet',
        instruction: 'খাবার ১৫ মিনিট আগে',
        duration: '৭ দিন',
        isFraction: false
      },
      {
        id: 't-med-7',
        type: 'Syp',
        brandName: 'Entacyd Plus',
        genericName: 'Magaldrate + Simethicone',
        strength: 'Suspension',
        dosage: '1+1+1',
        unit: '২ চামচ / ১/২ কাপ (Half Cup) পানিতে',
        instruction: 'খাবার ১ ঘণ্টা পরে সেব্য',
        duration: '৭ দিন',
        isFraction: true,
        fractionDetail: { num: 1, den: 2, label: '1/2' }
      }
    ],
    advice: [
      'তৈলাক্ত, ভাজাপোড়া ও অতিরিক্ত মসলাযুক্ত খাবার সম্পূর্ণ পরিহার করুন',
      'সময়মত খাবার গ্রহণ করবেন, দীর্ঘ সময় খালি পেটে থাকবেন না',
      'রাতে খাবার খাওয়ার অন্তত ২ ঘণ্টা পর ঘুমাতে যাবেন',
      'ধূমপান ও অতিরিক্ত চা/কফি বর্জন করুন'
    ],
    nextVisit: '১৪ দিন পর'
  },
  {
    id: 'tpl-hypertension',
    title: 'Essential Hypertension (উচ্চ রক্তচাপ)',
    category: 'Cardiology',
    diagnosis: 'Stage 1 Essential Hypertension (Primary HTN)',
    complaints: [
      { text: 'Occipital headache & neck heaviness (ঘাড় ও মাথায় ভারি অনুভূতি)', duration: '১৫ দিন' },
      { text: 'Occasional palpitation & dizziness (মাঝে মাঝে বুক ধড়ফড় ও মাথা ঘোরা)', duration: '১০ দিন' },
    ],
    vitals: {
      bp: '150/95',
      pulse: '78',
      temp: '98.6',
      weight: '75',
      spo2: '98',
      rbs: '6.4'
    },
    investigations: [
      'ECG (12 Leads)',
      'Lipid Profile (Fasting)',
      'Serum Creatinine & Electrolytes',
      'Urine for Microalbumin',
      'RBS'
    ],
    medicines: [
      {
        id: 't-med-8',
        type: 'Tab',
        brandName: 'Bizoran',
        genericName: 'Amlodipine + Olmesartan',
        strength: '5/20 mg',
        dosage: '1+0+0',
        unit: 'Tablet',
        instruction: 'প্রতিদিন সকালে নাস্তার পর নির্দিষ্ট সময়ে',
        duration: 'চলবে',
        isFraction: false
      },
      {
        id: 't-med-9',
        type: 'Tab',
        brandName: 'Bisocor',
        genericName: 'Bisoprolol',
        strength: '2.5 mg',
        dosage: '1/2+0+0',
        unit: '১/২ Tablet (আধ খানা)',
        instruction: 'প্রতিদিন সকালে ১/২ ট্যাবলেট',
        duration: 'চলবে',
        isFraction: true,
        fractionDetail: { num: 1, den: 2, label: '1/2' }
      },
      {
        id: 't-med-10',
        type: 'Tab',
        brandName: 'Rosuva',
        genericName: 'Rosuvastatin',
        strength: '10 mg',
        dosage: '0+0+1',
        unit: 'Tablet',
        instruction: 'রাতে খাবার পর',
        duration: 'চলবে',
        isFraction: false
      }
    ],
    advice: [
      'খাবারে বাড়তি কাঁচা লবণ ও চর্বিযুক্ত খাবার সম্পূর্ণ পরিহার করুন',
      'প্রতিদিন নিয়ম করে অন্তত ৩০-৪০ মিনিট দ্রুত হাঁটুন',
      'ওজন নিয়ন্ত্রণে রাখুন ও মানসিক চাপমুক্ত থাকুন',
      'প্রতি সপ্তাহে নিয়মিত রক্তচাপ মেপে খাতায় লিখে রাখবেন'
    ],
    nextVisit: '১ মাস পর (রিপোর্ট সহ)'
  },
  {
    id: 'tpl-acute-tonsillitis',
    title: 'Acute Pharyngitis / Tonsillitis (তীব্র গলা ব্যথা ও ইনফেকশন)',
    category: 'ENT / Infectious',
    diagnosis: 'Acute Streptococcal Pharyngitis',
    complaints: [
      { text: 'Severe sore throat & painful swallowing (তীব্র গলা ব্যথা ও খাবার গিলতে কষ্ট)', duration: '৩ দিন' },
      { text: 'Fever with chills (জ্বর ও কাঁপুনি)', duration: '২ দিন' },
    ],
    vitals: {
      bp: '115/75',
      pulse: '90',
      temp: '102.0',
      weight: '58',
      spo2: '99',
      rbs: ''
    },
    investigations: [
      'CBC with ESR'
    ],
    medicines: [
      {
        id: 't-med-11',
        type: 'Tab',
        brandName: 'Azith',
        genericName: 'Azithromycin',
        strength: '500 mg',
        dosage: '1+0+0',
        unit: 'Tablet',
        instruction: 'প্রতিদিন নির্দিষ্ট সময়ে খাবার ১ ঘণ্টা আগে',
        duration: '৫ দিন',
        isFraction: false
      },
      {
        id: 't-med-12',
        type: 'Tab',
        brandName: 'Napa Extra',
        genericName: 'Paracetamol + Caffeine',
        strength: '500+65 mg',
        dosage: '1+0+1',
        unit: 'Tablet',
        instruction: 'খাবার পরে (ব্যথা বা জ্বর থাকলে)',
        duration: '৫ দিন',
        isFraction: false
      },
      {
        id: 't-med-13',
        type: 'Tab',
        brandName: 'Finix',
        genericName: 'Rabeprazole',
        strength: '20 mg',
        dosage: '1+0+1',
        unit: 'Tablet',
        instruction: 'খাবার ২০ মিনিট আগে',
        duration: '১০ দিন',
        isFraction: false
      }
    ],
    advice: [
      'কুসুম গরম পানিতে সামান্য লবণ দিয়ে দিনে ৪-৫ বার গড়গড়া করুন',
      'ঠান্ডা পানি, আইসক্রিম ও ফ্রিজের খাবার সম্পূর্ণ বর্জন করুন',
      'অ্যান্টিবায়োটিক ৫ দিনের পূর্ণ কোর্স শেষ করবেন, কোনো বেলা বাদ দেবেন না'
    ],
    nextVisit: '৫ দিন পর'
  },
  {
    id: 'tpl-low-back-pain',
    title: 'Low Back Pain / Muscle Spasm (কোমরে তীব্র ব্যথা)',
    category: 'Orthopedics',
    diagnosis: 'Mechanical Low Back Pain with Lumbar Muscle Spasm',
    complaints: [
      { text: 'Severe lower back pain radiating to gluteal region (কোমর ও নিতম্বে তীব্র ব্যথা)', duration: '১০ দিন' },
      { text: 'Difficulty in bending & standing (সামনে ঝুঁকতে ও দীর্ঘক্ষণ দাঁড়িয়ে থাকতে কষ্ট)', duration: '১০ দিন' },
    ],
    vitals: {
      bp: '120/80',
      pulse: '72',
      temp: '98.4',
      weight: '70',
      spo2: '99',
      rbs: ''
    },
    investigations: [
      'X-Ray Lumbo-Sacral Spine (A/P & Lat view)',
      'Serum Calcium & Vit D3',
      'Serum Uric Acid'
    ],
    medicines: [
      {
        id: 't-med-14',
        type: 'Tab',
        brandName: 'Napryn',
        genericName: 'Naproxen Sodium',
        strength: '500 mg',
        dosage: '1+0+1',
        unit: 'Tablet',
        instruction: 'অবশ্যই ভরা পেটে খাবেন',
        duration: '৫ দিন',
        isFraction: false
      },
      {
        id: 't-med-15',
        type: 'Tab',
        brandName: 'Beklo',
        genericName: 'Baclofen',
        strength: '10 mg',
        dosage: '1/2+0+1/2',
        unit: '১/২ Tablet (আধ খানা)',
        instruction: 'খাবার পর সকালে আধ খানা ও রাতে আধ খানা',
        duration: '৭ দিন',
        isFraction: true,
        fractionDetail: { num: 1, den: 2, label: '1/2' }
      },
      {
        id: 't-med-16',
        type: 'Cap',
        brandName: 'Maxpro',
        genericName: 'Esomeprazole',
        strength: '20 mg',
        dosage: '1+0+1',
        unit: 'Capsule',
        instruction: 'খাবার ২০ মিনিট আগে',
        duration: '১৪ দিন',
        isFraction: false
      },
      {
        id: 't-med-17',
        type: 'Tab',
        brandName: 'Neuro-B',
        genericName: 'Vit B1+B6+B12',
        strength: 'Standard',
        dosage: '1+0+1',
        unit: 'Tablet',
        instruction: 'খাবার পর',
        duration: '১ মাস',
        isFraction: false
      }
    ],
    advice: [
      'ভারী কোনো জিনিস তুলবেন না ও সামনে ঝুঁকে কাজ করবেন না',
      'শক্ত সমান বিছানায় ঘুমাবেন, নরম তোষক পরিহার করুন',
      'কোমরে গরম পানির সেঁক দিন দিনে ২ বার ১০ মিনিট করে',
      'ব্যথা কমে এলে চিকিৎসকের পরামর্শে হালকা পিঠের ব্যায়াম করবেন'
    ],
    nextVisit: '৭ দিন পর'
  }
];
