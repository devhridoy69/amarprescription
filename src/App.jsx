import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PatientInfoBar from './components/PatientInfoBar';
import MedicineSection from './components/MedicineSection';
import ClinicalSection from './components/ClinicalSection';
import AdviceSection from './components/AdviceSection';
import PrescriptionPreview from './components/PrescriptionPreview';
import DoctorProfileModal from './components/DoctorProfileModal';
import TemplatesModal from './components/TemplatesModal';
import DashboardModal from './components/DashboardModal';
import AuthModal from './components/AuthModal';
import AdminPanelModal from './components/AdminPanelModal';
import MobileSectionTabs from './components/MobileSectionTabs';
import PublicPrescriptionView from './components/PublicPrescriptionView';
import PricingModal from './components/PricingModal';
import { ChamberModal } from './components/ChamberModal';
import { getPlansConfig, getPlanPermissions, normalizePlanId } from './data/plansConfig';
import { DEFAULT_DOCTOR } from './data/defaultDoctor';
import { PRESCRIPTION_TEMPLATES } from './data/templatesData';
import { FONT_PAIR_PRESETS } from './data/fontPresets';
import { 
  fetchPrescriptionsFromCloud, 
  savePrescriptionToCloud, 
  deletePrescriptionFromCloud,
  fetchChamberProfilesFromCloud,
  saveChamberProfilesToCloud
} from './lib/supabase';
import { 
  downloadMedicinesForOffline, 
  queuePendingPrescription, 
  getPendingPrescriptionsCount, 
  syncPendingPrescriptionsToCloud 
} from './lib/offlineSync';

export function App() {
  // Detect if user visited via QR code link (?rx=... or ?id=...)
  const [publicRxId, setPublicRxId] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('rx') || params.get('id') || null;
    } catch (e) {
      return null;
    }
  });

  // Check remember me validity (1 month = 30 days) on initial mount
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('amar_rx_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem('amar_rx_current_user');
          return null; // Expired 1 month session
        }
        return parsed;
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  // Chamber profiles list for the logged-in doctor
  const [chamberProfiles, setChamberProfiles] = useState(() => {
    try {
      const userPhone = JSON.parse(localStorage.getItem('amar_rx_current_user') || '{}')?.phone || 'default';
      const savedList = localStorage.getItem(`amar_rx_chambers_${userPhone}`);
      if (savedList) {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const savedDoc = typeof window !== 'undefined' ? localStorage.getItem('amar_rx_doctor') : null;
    const docData = savedDoc ? JSON.parse(savedDoc) : DEFAULT_DOCTOR;
    return [{ ...DEFAULT_DOCTOR, ...docData, id: 'chamber_main' }];
  });

  const [activeChamberId, setActiveChamberId] = useState(() => {
    try {
      const userPhone = JSON.parse(localStorage.getItem('amar_rx_current_user') || '{}')?.phone || 'default';
      return localStorage.getItem(`amar_rx_active_chamber_${userPhone}`) || 'chamber_main';
    } catch (e) {
      return 'chamber_main';
    }
  });

  // Dedicated Chamber Add / Edit Modal states
  const [isChamberModalOpen, setIsChamberModalOpen] = useState(false);
  const [editingChamberProfile, setEditingChamberProfile] = useState(null);

  // Doctor state: initialize from user account if logged in, else default
  const [doctor, setDoctor] = useState(() => {
    try {
      const savedUser = localStorage.getItem('amar_rx_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return {
          ...DEFAULT_DOCTOR,
          name: u.full_name || DEFAULT_DOCTOR.name,
          degrees: u.degrees || DEFAULT_DOCTOR.degrees,
          specialty: u.specialty || DEFAULT_DOCTOR.specialty,
          bmdcReg: u.bmdc_reg || DEFAULT_DOCTOR.bmdcReg,
          phone: u.phone || DEFAULT_DOCTOR.phone,
          workplace: u.workplace || DEFAULT_DOCTOR.workplace,
          chamberName: u.chamber_name || DEFAULT_DOCTOR.chamberName,
          chamberAddress: u.chamber_address || DEFAULT_DOCTOR.chamberAddress,
          visitingHours: u.visiting_hours || DEFAULT_DOCTOR.visitingHours,
          appointmentPhone: u.appointment_phone || DEFAULT_DOCTOR.appointmentPhone,
          has_watermark: u.has_watermark,
          show_qr: u.show_qr,
          plan: u.plan || 'free'
        };
      }
      const savedDoc = localStorage.getItem('amar_rx_doctor');
      if (savedDoc) {
        return { ...DEFAULT_DOCTOR, ...JSON.parse(savedDoc) };
      }
    } catch (e) {}
    return DEFAULT_DOCTOR;
  });

  // Patient Info State (Default blank for doctor to fill up)
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    ageUnit: 'Y',
    gender: 'Male',
    date: new Date().toISOString().split('T')[0],
    rxId: 'RX-' + Math.floor(1000 + Math.random() * 9000),
    weight: '',
    weightUnit: 'kg',
    bp: '',
    phone: ''
  });

  // Clinical State (Default blank for doctor to fill up)
  const [complaints, setComplaints] = useState([]);
  const [vitals, setVitals] = useState({ bp: '', pulse: '', temp: '', weight: '', spo2: '', rbs: '' });
  const [diagnosis, setDiagnosis] = useState('');
  const [investigations, setInvestigations] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [adviceList, setAdviceList] = useState([]);
  const [nextVisit, setNextVisit] = useState('');
  const [specialNote, setSpecialNote] = useState('');

  // UI Modals & Views
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [plansConfig, setPlansConfig] = useState(getPlansConfig);

  // Listen to plan config updates from admin panel
  useEffect(() => {
    const handlePlanUpdate = () => {
      setPlansConfig(getPlansConfig());
    };
    window.addEventListener('amar_rx_plans_updated', handlePlanUpdate);
    return () => window.removeEventListener('amar_rx_plans_updated', handlePlanUpdate);
  }, []);

  // Listen to user plan/watermark updates from admin panel in real-time
  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
        setDoctor(prev => ({
          ...prev,
          ...e.detail,
          has_watermark: e.detail.has_watermark,
          show_qr: e.detail.show_qr,
          plan: e.detail.plan || 'free'
        }));
      }
    };
    window.addEventListener('amar_rx_user_updated', handleUserUpdate);
    return () => window.removeEventListener('amar_rx_user_updated', handleUserUpdate);
  }, []);
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('amar_rx_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [editingRecordId, setEditingRecordId] = useState(null); // Track if currently editing a saved record
  const [saveStatusFeedback, setSaveStatusFeedback] = useState(null); // 'saved' | 'updated' | 'error'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'
  const [mobileTab, setMobileTab] = useState('medicines'); // 'patient' | 'clinical' | 'medicines' | 'advice'

  // Separate local storage records key per logged-in doctor
  const getDoctorStorageKey = (phone) => {
    return phone ? `amar_rx_records_${phone.replace(/\s+/g, '')}` : 'amar_rx_records';
  };

  // Patient Prescription Records / History (localStorage + Supabase Cloud Sync)
  const [patientRecords, setPatientRecords] = useState(() => {
    try {
      const savedUser = localStorage.getItem('amar_rx_current_user');
      const phone = savedUser ? JSON.parse(savedUser).phone : null;
      const key = getDoctorStorageKey(phone);
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Sync with Supabase cloud when user logs in or initial load
  useEffect(() => {
    async function loadCloudRecords() {
      if (!currentUser && !adminUser) {
        setPatientRecords([]);
        return;
      }
      try {
        const cloudData = await fetchPrescriptionsFromCloud(currentUser?.phone);
        if (cloudData && cloudData.length > 0) {
          const docKey = getDoctorStorageKey(currentUser?.phone);
          setPatientRecords(cloudData);
          try {
            localStorage.setItem(docKey, JSON.stringify(cloudData));
          } catch (e) {}
        }

        // Also sync chamber profiles from Supabase cloud
        if (currentUser?.phone) {
          const cloudChambers = await fetchChamberProfilesFromCloud(currentUser.phone);
          if (cloudChambers && Array.isArray(cloudChambers) && cloudChambers.length > 0) {
            setChamberProfiles(cloudChambers);
            try {
              localStorage.setItem(`amar_rx_chambers_${currentUser.phone}`, JSON.stringify(cloudChambers));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Initial cloud sync notice:', err);
      }
    }
    loadCloudRecords();
  }, [currentUser, adminUser]);

  // Offline & Online Network Detection + Sync State
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Background Cache: Download 21k medicines into IndexedDB for 100% offline access
  useEffect(() => {
    downloadMedicinesForOffline();

    // Check pending count initially
    getPendingPrescriptionsCount().then(setPendingSyncCount);

    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-sync any queued offline prescriptions to Supabase cloud!
      const synced = await syncPendingPrescriptionsToCloud();
      if (synced > 0) {
        getPendingPrescriptionsCount().then(setPendingSyncCount);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleSyncedEvent = () => {
      getPendingPrescriptionsCount().then(setPendingSyncCount);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('rx_offline_synced', handleSyncedEvent);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('rx_offline_synced', handleSyncedEvent);
    };
  }, []);

  // Save records to doctor's separate localStorage and async backup to Supabase
  const saveRecordsToStorage = (records, recordToSync = null) => {
    setPatientRecords(records);
    const docKey = getDoctorStorageKey(currentUser?.phone);
    try {
      localStorage.setItem(docKey, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save patient records to storage:', e);
    }

    // Async push to Supabase cloud if online, or queue for offline auto-sync
    if (recordToSync) {
      if (navigator.onLine) {
        savePrescriptionToCloud(recordToSync, currentUser?.phone).catch(async (err) => {
          console.warn('Cloud sync error, queuing locally:', err);
          await queuePendingPrescription(recordToSync, currentUser?.phone);
          const count = await getPendingPrescriptionsCount();
          setPendingSyncCount(count);
        });
      } else {
        // Queue for offline auto-sync
        queuePendingPrescription(recordToSync, currentUser?.phone).then(async () => {
          const count = await getPendingPrescriptionsCount();
          setPendingSyncCount(count);
        });
      }
    }
  };

  // Helper to save or update current prescription into history
  const saveCurrentPrescriptionToHistory = () => {
    if (!patient.name && medicines.length === 0 && !diagnosis) {
      return null; // Blank prescription, no need to auto-save
    }

    const currentRecordId = editingRecordId || ('rec-' + (patient.rxId || Date.now()));

    const newRecord = {
      id: currentRecordId,
      date: patient.date || new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      patient: { ...patient },
      doctor: { ...doctor }, // Save current doctor details so public QR view displays full doctor header
      doctorProfile: { ...doctor },
      complaints: [...complaints],
      vitals: { ...vitals },
      diagnosis,
      investigations: [...investigations],
      medicines: [...medicines],
      adviceList: [...adviceList],
      nextVisit,
      specialNote,
      isFollowUpDone: false,
      followUpDate: nextVisit ? patient.date : null
    };

    const existingIdx = patientRecords.findIndex(r => 
      r.id === currentRecordId || 
      (r.patient?.rxId && patient.rxId && r.patient.rxId === patient.rxId)
    );

    // If saving a new prescription, enforce subscription usage limit
    if (existingIdx < 0) {
      const perms = getPlanPermissions(currentUser?.plan);
      const maxLimit = perms.prescriptionLimit;

      if (patientRecords.length >= maxLimit) {
        alert(`আপনার ${perms.name} প্রেসক্রিপশন সেভ ও প্রিন্টের লিমিট (${maxLimit === Infinity ? 'আনলিমিটেড' : maxLimit + 'টি'}) পূর্ণ হয়ে গেছে। আরও প্রেসক্রিপশন সেভ করতে দয়া করে আপনার প্ল্যান আপগ্রেড করুন।`);
        setIsPricingModalOpen(true);
        return null;
      }
    }

    let updated;
    if (existingIdx >= 0) {
      updated = [...patientRecords];
      updated[existingIdx] = { ...updated[existingIdx], ...newRecord };
    } else {
      updated = [newRecord, ...patientRecords];
    }

    setEditingRecordId(currentRecordId);
    saveRecordsToStorage(updated, newRecord);

    // Update Recent Suggestions permanently only when prescription is saved/printed
    try {
      // 1. Recent Complaints
      if (complaints && complaints.length > 0) {
        const RECENT_COMPLAINTS_KEY = 'amar_rx_recent_complaints';
        const savedComplaints = JSON.parse(localStorage.getItem(RECENT_COMPLAINTS_KEY) || '[]');
        let mergedComplaints = [...savedComplaints];
        complaints.forEach(item => {
          if (!item.text) return;
          mergedComplaints = [
            { text: item.text, duration: item.duration || '3 days' },
            ...mergedComplaints.filter(c => c.text !== item.text)
          ];
        });
        localStorage.setItem(RECENT_COMPLAINTS_KEY, JSON.stringify(mergedComplaints.slice(0, 10)));
      }

      // 2. Recent Diagnoses
      if (diagnosis && diagnosis.trim()) {
        const RECENT_DIAGNOSES_KEY = 'amar_rx_recent_diagnoses';
        const savedDiagnoses = JSON.parse(localStorage.getItem(RECENT_DIAGNOSES_KEY) || '[]');
        const diagItems = diagnosis.split(',').map(d => d.trim()).filter(Boolean);
        let mergedDiagnoses = [...savedDiagnoses];
        diagItems.forEach(d => {
          mergedDiagnoses = [d, ...mergedDiagnoses.filter(x => x !== d)];
        });
        localStorage.setItem(RECENT_DIAGNOSES_KEY, JSON.stringify(mergedDiagnoses.slice(0, 10)));
      }

      // 3. Recent Investigations
      if (investigations && investigations.length > 0) {
        const RECENT_INVESTIGATIONS_KEY = 'amar_rx_recent_investigations';
        const savedInv = JSON.parse(localStorage.getItem(RECENT_INVESTIGATIONS_KEY) || '[]');
        let mergedInv = [...savedInv];
        investigations.forEach(inv => {
          if (!inv) return;
          mergedInv = [inv, ...mergedInv.filter(x => x !== inv)];
        });
        localStorage.setItem(RECENT_INVESTIGATIONS_KEY, JSON.stringify(mergedInv.slice(0, 10)));
      }

      // 4. Recent Medicines
      if (medicines && medicines.length > 0) {
        const RECENT_MEDICINES_KEY = 'amar_rx_recent_medicines';
        const savedMeds = JSON.parse(localStorage.getItem(RECENT_MEDICINES_KEY) || '[]');
        let mergedMeds = [...savedMeds];
        medicines.forEach(m => {
          if (!m.brandName) return;
          mergedMeds = [
            {
              type: m.type || 'Tab',
              brandName: m.brandName,
              genericName: m.genericName || '',
              strength: m.strength || '',
              dosage: m.dosage || '1+0+1',
              unit: m.unit || '',
              instruction: m.instruction || '',
              duration: m.duration || ''
            },
            ...mergedMeds.filter(x => 
              (x.brandName || '').toLowerCase() !== (m.brandName || '').toLowerCase() ||
              x.type !== m.type
            )
          ];
        });
        localStorage.setItem(RECENT_MEDICINES_KEY, JSON.stringify(mergedMeds.slice(0, 10)));
      }

      // 5. Recent Advice
      if (adviceList && adviceList.length > 0) {
        const RECENT_ADVICE_KEY = 'amar_rx_recent_advice';
        const savedAdvice = JSON.parse(localStorage.getItem(RECENT_ADVICE_KEY) || '[]');
        let mergedAdvice = [...savedAdvice];
        adviceList.forEach(adv => {
          if (!adv) return;
          mergedAdvice = [adv, ...mergedAdvice.filter(x => x !== adv)];
        });
        localStorage.setItem(RECENT_ADVICE_KEY, JSON.stringify(mergedAdvice.slice(0, 10)));
      }

      // Notify all sections that recents have updated for the next patient/prescription
      window.dispatchEvent(new Event('rx_recent_updated'));
    } catch (err) {
      console.warn('Failed to sync recent suggestions:', err);
    }

    return newRecord;
  };

  // Load a historic prescription into editor for Re-Editing
  const handleLoadPrescription = (record) => {
    if (!record) return;
    setEditingRecordId(record.id);
    if (record.patient) setPatient(record.patient);
    if (record.complaints) setComplaints(record.complaints);
    if (record.vitals) setVitals(record.vitals);
    setDiagnosis(record.diagnosis || '');
    if (record.investigations) setInvestigations(record.investigations);
    if (record.medicines) setMedicines(record.medicines);
    if (record.adviceList) setAdviceList(record.adviceList);
    setNextVisit(record.nextVisit || '');
    setSpecialNote(record.specialNote || '');
  };

  // 1-Click direct reprint from history
  const handleReprintPrescription = (record) => {
    handleLoadPrescription(record);
    // Close dashboard modal so screen is clean
    setIsDashboardOpen(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Delete a patient record from history and Supabase cloud
  const handleDeleteRecord = (recordId) => {
    const updated = patientRecords.filter(r => r.id !== recordId);
    setPatientRecords(updated);
    try {
      localStorage.setItem('amar_rx_records', JSON.stringify(updated));
    } catch (e) {}
    deletePrescriptionFromCloud(recordId);

    // If currently editing this record, reset editing state
    if (editingRecordId === recordId) {
      setEditingRecordId(null);
    }
  };

  // Toggle follow-up complete/pending status
  const handleToggleFollowUpStatus = (recordId) => {
    let toggledRecord = null;
    const updated = patientRecords.map(r => {
      if (r.id === recordId) {
        toggledRecord = { ...r, isFollowUpDone: !r.isFollowUpDone };
        return toggledRecord;
      }
      return r;
    });
    saveRecordsToStorage(updated, toggledRecord);
  };

  // Dark Mode State with localStorage persistence
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('amar_rx_theme');
      return saved === 'dark';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('amar_rx_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('amar_rx_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Multi-Font Typography State with localStorage persistence (Default: Noto Sans Bengali + Noto Sans)
  const [selectedFontId, setSelectedFontId] = useState(() => {
    try {
      const saved = localStorage.getItem('amar_rx_font_id');
      if (saved && FONT_PAIR_PRESETS.some(f => f.id === saved)) {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return 'noto-noto'; // Default font: Noto Sans Bengali + Noto Sans
  });

  const selectedFont = FONT_PAIR_PRESETS.find(f => f.id === selectedFontId) || FONT_PAIR_PRESETS[0];

  useEffect(() => {
    if (selectedFont) {
      document.documentElement.style.setProperty('--app-font', selectedFont.fontFamily);
      localStorage.setItem('amar_rx_font_id', selectedFontId);
    }
  }, [selectedFontId, selectedFont]);

  // UI Font Size Zoom State with localStorage persistence (Default: 108% for better readability)
  const [uiTextZoom, setUiTextZoom] = useState(() => {
    try {
      const saved = localStorage.getItem('amar_rx_ui_zoom');
      if (saved) {
        const parsed = Number(saved);
        if (parsed <= 100) return 108; // Upgrade previous 100% to 108%
        return parsed;
      }
    } catch (e) {}
    return 108;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--ui-text-zoom', `${uiTextZoom}%`);
    localStorage.setItem('amar_rx_ui_zoom', String(uiTextZoom));
  }, [uiTextZoom]);

  const handleSelectFontId = (fontId) => {
    setSelectedFontId(fontId);
  };

  // Print pad settings (Blank Header/Footer for pre-printed pads, Paper size A4/Letter, Scale, Multi-page)
  const [printSettings, setPrintSettings] = useState(() => {
    const saved = localStorage.getItem('amar_rx_print_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      showHeader: true, // true = print doctor header, false = blank space for pre-printed hospital pad
      headerHeightMm: 45, // height of blank header space in mm
      showFooter: true, // true = print software/emergency footer, false = blank space
      footerHeightMm: 25, // height of blank footer space in mm
      pageCount: 1, // 1 or 2 pages
      paperSize: 'A4', // 'A4' or 'Letter'
      scale: 100 // zoom/scale percentage: 80 to 120%
    };
  });

  const handleUpdatePrintSettings = (newSettings) => {
    setPrintSettings(newSettings);
    localStorage.setItem('amar_rx_print_settings', JSON.stringify(newSettings));
  };

  // Persist doctor profile and sync with active chamber profile
  const handleSaveDoctor = (updatedDoctor) => {
    setDoctor(updatedDoctor);
    localStorage.setItem('amar_rx_doctor', JSON.stringify(updatedDoctor));

    const userPhone = currentUser?.phone || 'default';
    const chamberId = activeChamberId || 'chamber_main';

    setChamberProfiles(prev => {
      const idx = prev.findIndex(p => p.id === chamberId);
      let updatedList;
      if (idx >= 0) {
        updatedList = [...prev];
        updatedList[idx] = { ...prev[idx], ...updatedDoctor };
      } else {
        updatedList = [...prev, { ...updatedDoctor, id: chamberId }];
      }
      try {
        localStorage.setItem(`amar_rx_chambers_${userPhone}`, JSON.stringify(updatedList));
        saveChamberProfilesToCloud(userPhone, updatedList);
      } catch (e) {}
      return updatedList;
    });
  };

  // Switch Active Chamber Profile
  const handleSelectChamberProfile = (profile) => {
    const perms = getPlanPermissions(currentUser?.plan);
    if (!perms.canSwitchChambers && chamberProfiles.length > 1 && profile.id !== chamberProfiles[0]?.id) {
      setIsPricingModalOpen(true);
      alert('মাল্টিপল চেম্বার সুইচিং (পপুলার, ইবনে সিনা বা একাধিক চেম্বার আলাদা পরিচালনা) ফিচারটি আপনার বর্তমান প্ল্যানে অন্তর্ভুক্ত নয়। আপগ্রেড করতে প্রাইসিং প্ল্যান দেখুন।');
      return;
    }
    setActiveChamberId(profile.id);
    setDoctor(profile);
    const userPhone = currentUser?.phone || 'default';
    try {
      localStorage.setItem(`amar_rx_active_chamber_${userPhone}`, profile.id);
      localStorage.setItem('amar_rx_doctor', JSON.stringify(profile));
    } catch (e) {}
  };

  // Add New Chamber (Opens ChamberModal in new mode)
  const handleAddNewChamber = () => {
    const perms = getPlanPermissions(currentUser?.plan);
    if (!perms.canSwitchChambers && chamberProfiles.length >= 1) {
      setIsPricingModalOpen(true);
      alert('মাল্টিপল চেম্বার যুক্ত করার জন্য Enterprise VIP প্যাকেজ প্রয়োজন।');
      return;
    }
    setEditingChamberProfile(null);
    setIsChamberModalOpen(true);
  };

  // Edit Existing Chamber (Opens ChamberModal in edit mode)
  const handleEditChamberProfile = (chamber) => {
    setEditingChamberProfile(chamber);
    setIsChamberModalOpen(true);
  };

  // Save Chamber from ChamberModal (Add new or Update existing)
  const handleSaveChamber = (chamberData, isNew = false, setAsActive = true) => {
    const userPhone = currentUser?.phone || 'default';
    let updatedList;

    if (isNew) {
      updatedList = [...chamberProfiles, chamberData];
    } else {
      updatedList = chamberProfiles.map(p => (p.id === chamberData.id ? { ...p, ...chamberData } : p));
    }

    setChamberProfiles(updatedList);
    try {
      localStorage.setItem(`amar_rx_chambers_${userPhone}`, JSON.stringify(updatedList));
      saveChamberProfilesToCloud(userPhone, updatedList);
    } catch (e) {}

    if (setAsActive || activeChamberId === chamberData.id) {
      setActiveChamberId(chamberData.id);
      setDoctor(prev => ({ ...prev, ...chamberData }));
      try {
        localStorage.setItem(`amar_rx_active_chamber_${userPhone}`, chamberData.id);
        localStorage.setItem('amar_rx_doctor', JSON.stringify({ ...doctor, ...chamberData }));
      } catch (e) {}
    }
  };

  // Restore Default Main Chamber
  const handleRestoreMainChamber = () => {
    const userPhone = currentUser?.phone || 'default';
    const mainChamber = {
      ...DEFAULT_DOCTOR,
      ...doctor,
      id: 'chamber_main',
      chamberName: DEFAULT_DOCTOR.chamberName,
      chamberAddress: DEFAULT_DOCTOR.chamberAddress,
      visitingHours: DEFAULT_DOCTOR.visitingHours,
      appointmentPhone: DEFAULT_DOCTOR.phone
    };

    let updatedList;
    const exists = chamberProfiles.some(p => p.id === 'chamber_main');
    if (exists) {
      updatedList = chamberProfiles.map(p => (p.id === 'chamber_main' ? mainChamber : p));
    } else {
      updatedList = [mainChamber, ...chamberProfiles];
    }

    setChamberProfiles(updatedList);
    setActiveChamberId('chamber_main');
    setDoctor(mainChamber);

    try {
      localStorage.setItem(`amar_rx_chambers_${userPhone}`, JSON.stringify(updatedList));
      localStorage.setItem(`amar_rx_active_chamber_${userPhone}`, 'chamber_main');
      localStorage.setItem('amar_rx_doctor', JSON.stringify(mainChamber));
      saveChamberProfilesToCloud(userPhone, updatedList);
    } catch (e) {}

    alert('প্রধান চেম্বার ("' + DEFAULT_DOCTOR.chamberName + '") সফলভাবে রিস্টোর ও সক্রিয় করা হয়েছে!');
  };

  // Delete a Chamber Profile
  const handleDeleteChamberProfile = (profileId) => {
    if (chamberProfiles.length <= 1) {
      alert('কমপক্ষে একটি চেম্বার প্রোফাইল অবশ্যই থাকতে হবে।');
      return;
    }
    const userPhone = currentUser?.phone || 'default';
    const remaining = chamberProfiles.filter(p => p.id !== profileId);
    setChamberProfiles(remaining);
    try {
      localStorage.setItem(`amar_rx_chambers_${userPhone}`, JSON.stringify(remaining));
      saveChamberProfilesToCloud(userPhone, remaining);
    } catch (e) {}

    if (activeChamberId === profileId && remaining.length > 0) {
      handleSelectChamberProfile(remaining[0]);
    }
  };

  // Medicine handlers
  const handleAddMedicine = (newMed) => {
    setMedicines(prev => [...prev, newMed]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleReorderMedicines = (newOrder) => {
    setMedicines(newOrder);
  };

  // Apply a ready-made template
  const handleApplyTemplate = (tpl) => {
    setDiagnosis(tpl.diagnosis || '');
    setComplaints(tpl.complaints || []);
    if (tpl.vitals) {
      setVitals(prev => ({ ...prev, ...tpl.vitals }));
    }
    setInvestigations(tpl.investigations || []);
    setMedicines(tpl.medicines || []);
    setAdviceList(tpl.advice || []);
    setNextVisit(tpl.nextVisit || '');
  };

  // Reset entire prescription for new patient (Auto-saves current to history if has data)
  const handleNewPrescription = (forceReset = false) => {
    // If current prescription has patient name or medicines and not forced, save to history before reset
    if (!forceReset && (patient.name || medicines.length > 0)) {
      saveCurrentPrescriptionToHistory();
    }

    setEditingRecordId(null);
    setPatient({
      name: '',
      age: '',
      ageUnit: 'Y',
      gender: 'Male',
      date: new Date().toISOString().split('T')[0],
      rxId: 'RX-' + Math.floor(1000 + Math.random() * 9000),
      weight: '',
      weightUnit: 'kg',
      bp: '',
      phone: ''
    });
    setComplaints([]);
    setVitals({ bp: '', pulse: '', temp: '', weight: '', spo2: '', rbs: '' });
    setDiagnosis('');
    setInvestigations([]);
    setMedicines([]);
    setAdviceList([]);
    setNextVisit('');
    setSpecialNote('');
  };

  const handlePrint = () => {
    const perms = getPlanPermissions(currentUser?.plan);
    const maxLimit = perms.prescriptionLimit;

    if (!editingRecordId && patientRecords.length >= maxLimit) {
      alert(`আপনার ${perms.name} প্রেসক্রিপশন প্রিন্ট ও সেভের লিমিট (${maxLimit === Infinity ? 'আনলিমিটেড' : maxLimit + 'টি'}) পূর্ণ হয়ে গেছে। আরও প্রেসক্রিপশন প্রিন্ট করতে দয়া করে আপনার প্ল্যান আপগ্রেড করুন।`);
      setIsPricingModalOpen(true);
      return;
    }

    // Auto-save to patient records upon print so history is always current
    saveCurrentPrescriptionToHistory();
    window.print();
  };

  const handleLoginSuccess = (userData, remember = true) => {
    // 1 Month = 30 days validity if remember me checked, else 1 day session
    const validityDurationMs = remember 
      ? 30 * 24 * 60 * 60 * 1000 
      : 24 * 60 * 60 * 1000;

    const sessionUser = {
      ...userData,
      rememberMe: remember,
      expiresAt: Date.now() + validityDurationMs
    };

    setCurrentUser(sessionUser);
    try {
      localStorage.setItem('amar_rx_current_user', JSON.stringify(sessionUser));
    } catch (e) {}
    
    // Auto populate doctor profile with registered doctor details
    if (userData.full_name) {
      const initialDoc = {
        name: userData.full_name,
        degrees: userData.degrees || DEFAULT_DOCTOR.degrees,
        specialty: userData.specialty || DEFAULT_DOCTOR.specialty,
        bmdcReg: userData.bmdc_reg || DEFAULT_DOCTOR.bmdcReg,
        phone: userData.phone || DEFAULT_DOCTOR.phone,
        workplace: userData.workplace || DEFAULT_DOCTOR.workplace,
        chamberName: userData.chamber_name || DEFAULT_DOCTOR.chamberName,
        chamberAddress: userData.chamber_address || DEFAULT_DOCTOR.chamberAddress,
        visitingHours: userData.visiting_hours || DEFAULT_DOCTOR.visitingHours,
        appointmentPhone: userData.appointment_phone || DEFAULT_DOCTOR.appointmentPhone,
        has_watermark: userData.has_watermark,
        show_qr: userData.show_qr,
        plan: userData.plan || 'free'
      };
      setDoctor(initialDoc);

      // Load or initialize user's chamber profiles
      const userPhone = userData.phone || 'default';
      let userChambers = [];
      try {
        const raw = localStorage.getItem(`amar_rx_chambers_${userPhone}`);
        if (raw) userChambers = JSON.parse(raw);
      } catch (e) {}

      if (!userChambers || userChambers.length === 0) {
        const defaultProfile = { ...initialDoc, id: 'chamber_main' };
        userChambers = [defaultProfile];
        try {
          localStorage.setItem(`amar_rx_chambers_${userPhone}`, JSON.stringify(userChambers));
          localStorage.setItem(`amar_rx_active_chamber_${userPhone}`, 'chamber_main');
        } catch (e) {}
      }
      setChamberProfiles(userChambers);
      setActiveChamberId(userChambers[0].id);
    }
  };

  const handleAdminLoginSuccess = (adminData, remember = true) => {
    const sessionAdmin = {
      ...adminData,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };
    setAdminUser(sessionAdmin);
    setIsAdminPanelOpen(true);
    try {
      localStorage.setItem('amar_rx_admin_user', JSON.stringify(sessionAdmin));
    } catch (e) {}
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setIsAdminPanelOpen(false);
    try {
      localStorage.removeItem('amar_rx_admin_user');
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminUser(null);
    setPatientRecords([]);
    setDoctor(DEFAULT_DOCTOR);
    try {
      localStorage.removeItem('amar_rx_current_user');
      localStorage.removeItem('amar_rx_admin_user');
    } catch (e) {}
  };

  // Determine if authentication is active
  const isAuthenticated = Boolean(currentUser || adminUser);

  // If visited via QR Code scan (?rx=RX-1234), show patient public viewer with 1-click PDF download
  if (publicRxId) {
    return (
      <PublicPrescriptionView
        rxId={publicRxId}
        onBackToApp={() => {
          setPublicRxId(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans ${
      viewMode === 'split' ? 'lg:h-screen lg:overflow-hidden' : ''
    }`}>
      
      {/* 1. If Admin is logged in, show dedicated Admin Panel View ONLY */}
      {adminUser ? (
        <AdminPanelModal
          isOpen={true}
          onClose={handleAdminLogout}
          adminUser={adminUser}
          onAdminLogout={handleAdminLogout}
          darkMode={darkMode}
        />
      ) : !currentUser ? (
        /* 2. STRICT SECURITY GATE: If user is not logged in, DO NOT RENDER any dashboard, editor, or prescription UI! */
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
          
          {/* Animated Medical Gradient Mesh Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"></div>

            {/* Glowing Animated Blobs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-blob-1"></div>
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-emerald-500/15 rounded-full blur-3xl animate-blob-2"></div>
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-blob-3"></div>
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl animate-blob-1"></div>

            {/* Subtle Center Spotlight behind modal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-teal-400/10 rounded-full blur-3xl"></div>
          </div>

          <AuthModal
            isOpen={true}
            onClose={() => {}}
            onLoginSuccess={handleLoginSuccess}
            onAdminLoginSuccess={handleAdminLoginSuccess}
            isForced={true}
          />
        </div>
      ) : (
        /* 3. Doctor is fully authenticated: Render doctor workspace */
        <>
          {/* Top Navbar */}
          <Navbar
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            onOpenDashboard={() => setIsDashboardOpen(true)}
            onOpenDoctorSettings={() => setIsDoctorModalOpen(true)}
            onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            onNewPrescription={handleNewPrescription}
            onPrint={handlePrint}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            selectedFontId={selectedFontId}
            onSelectFontId={handleSelectFontId}
            fontPresets={FONT_PAIR_PRESETS}
            savedCount={patientRecords.length}
            currentUser={currentUser}
            adminUser={adminUser}
            isOnline={isOnline}
            pendingSyncCount={pendingSyncCount}
            onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            doctor={doctor}
            chamberProfiles={chamberProfiles}
            activeChamberId={activeChamberId}
            onSelectChamberProfile={handleSelectChamberProfile}
            onDeleteChamberProfile={handleDeleteChamberProfile}
            onAddNewChamber={handleAddNewChamber}
            onEditChamberProfile={handleEditChamberProfile}
            onRestoreMainChamber={handleRestoreMainChamber}
            onOpenPricing={() => setIsPricingModalOpen(true)}
          />

      {/* Main Content Area */}
      <main className={`w-full mx-auto p-3 sm:p-5 lg:p-6 ${
        viewMode === 'split' 
          ? 'max-w-[1600px] flex-1 flex flex-col min-h-0 overflow-hidden' 
          : 'flex-1 max-w-7xl'
      }`}>
        
        {/* Mobile Tab Navigator (visible on small screens when in editor view) */}
        {viewMode !== 'preview' && (
          <MobileSectionTabs
            activeTab={mobileTab}
            onSelectTab={setMobileTab}
            counts={{
              complaints: complaints.length,
              medicines: medicines.length,
              advice: adviceList.length
            }}
          />
        )}

        {/* Dynamic Responsive Layout */}
        <div className={`print:block print:w-full ${
          viewMode === 'split' 
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0' 
            : 'grid grid-cols-1 gap-6'
        }`}>
          
          {/* LEFT: Editor Pane */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={`no-print space-y-4 ${
              viewMode === 'split' 
                ? 'lg:col-span-6 xl:col-span-6 h-full overflow-y-auto pr-2' 
                : 'max-w-4xl mx-auto w-full'
            }`}>
              
              {/* Patient Demographics */}
              <div className={`transition-all ${mobileTab !== 'patient' ? 'hidden md:block' : 'block'}`}>
                <PatientInfoBar
                  patient={patient}
                  onChange={setPatient}
                  isEditing={Boolean(editingRecordId)}
                  onCancelEdit={() => setEditingRecordId(null)}
                  onReset={() => handleNewPrescription(true)}
                />
              </div>

              {/* Clinical Symptoms, Examination & Investigations */}
              <div className={`transition-all ${mobileTab !== 'clinical' ? 'hidden md:block' : 'block'}`}>
                <ClinicalSection
                  complaints={complaints}
                  onUpdateComplaints={setComplaints}
                  vitals={vitals}
                  onUpdateVitals={setVitals}
                  diagnosis={diagnosis}
                  onUpdateDiagnosis={setDiagnosis}
                  investigations={investigations}
                  onUpdateInvestigations={setInvestigations}
                />
              </div>

              {/* Medicine Section (Fast prescribing with 1/2 Cup & Stacked Fraction) */}
              <div className={`transition-all ${mobileTab !== 'medicines' ? 'hidden md:block' : 'block'}`}>
                <MedicineSection
                  medicines={medicines}
                  onAddMedicine={handleAddMedicine}
                  onRemoveMedicine={handleRemoveMedicine}
                  onReorderMedicines={handleReorderMedicines}
                  currentUser={currentUser}
                />
              </div>

              {/* Advice & Next Visit */}
              <div className={`transition-all ${mobileTab !== 'advice' ? 'hidden md:block' : 'block'}`}>
                <AdviceSection
                  adviceList={adviceList}
                  onUpdateAdvice={setAdviceList}
                  nextVisit={nextVisit}
                  onUpdateNextVisit={setNextVisit}
                  specialNote={specialNote}
                  onUpdateSpecialNote={setSpecialNote}
                />
              </div>

            </div>
          )}

          {/* RIGHT: Live Prescription Preview (WYSIWYG) */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`print:w-full print:max-w-full print:block ${
              viewMode === 'split' 
                ? 'lg:col-span-6 xl:col-span-6 h-full overflow-y-auto pl-1' 
                : 'max-w-[210mm] mx-auto w-full'
            }`}>
              <div className="print:static">
                <PrescriptionPreview
                  doctor={doctor}
                  patient={patient}
                  complaints={complaints}
                  vitals={vitals}
                  diagnosis={diagnosis}
                  investigations={investigations}
                  medicines={medicines}
                  adviceList={adviceList}
                  nextVisit={nextVisit}
                  specialNote={specialNote}
                  printSettings={printSettings}
                  onUpdatePrintSettings={handleUpdatePrintSettings}
                  selectedFont={selectedFont}
                  onSelectFontId={handleSelectFontId}
                  fontPresets={FONT_PAIR_PRESETS}
                  onPrint={handlePrint}
                  currentUser={currentUser}
                  onOpenPricing={() => setIsPricingModalOpen(true)}
                />
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Doctor & Chamber Settings Modal */}
      <DoctorProfileModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        doctor={doctor}
        onSave={handleSaveDoctor}
        currentUser={currentUser}
      />

      {/* 1-Click Clinical & Custom Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
        currentPrescription={{
          complaints,
          vitals,
          diagnosis,
          investigations,
          medicines,
          adviceList,
          nextVisit,
          specialNote
        }}
      />

      {/* Chamber Dashboard & Patient History / Follow-up Checklist Modal */}
      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        records={patientRecords}
        onLoadPrescription={handleLoadPrescription}
        onReprintPrescription={handleReprintPrescription}
        onDeleteRecord={handleDeleteRecord}
        onToggleFollowUpStatus={handleToggleFollowUpStatus}
        onNewPrescription={handleNewPrescription}
        darkMode={darkMode}
        activeEditingRecordId={editingRecordId}
        currentUser={currentUser}
        onOpenPricing={() => setIsPricingModalOpen(true)}
      />

      {/* Pricing & Plan Details Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={normalizePlanId(currentUser?.plan)}
        plansConfig={plansConfig}
      />

      {/* Dedicated Chamber Add & Edit Modal */}
      <ChamberModal
        isOpen={isChamberModalOpen}
        onClose={() => setIsChamberModalOpen(false)}
        editingChamber={editingChamberProfile}
        baseDoctor={doctor}
        onSaveChamber={handleSaveChamber}
        darkMode={darkMode}
      />

      {/* Doctor Authentication Modal for manual re-login if already logged in */}
      {currentUser && isAuthModalOpen && (
        <AuthModal
          isOpen={true}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          isForced={false}
        />
      )}

        </>
      )}

    </div>
  );
}

export default App;
