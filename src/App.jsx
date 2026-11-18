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
import MobileSectionTabs from './components/MobileSectionTabs';
import { DEFAULT_DOCTOR } from './data/defaultDoctor';
import { PRESCRIPTION_TEMPLATES } from './data/templatesData';
import { FONT_PAIR_PRESETS } from './data/fontPresets';
import { fetchPrescriptionsFromCloud, savePrescriptionToCloud, deletePrescriptionFromCloud } from './lib/supabase';

export function App() {
  // Load doctor profile from localStorage or default
  const [doctor, setDoctor] = useState(() => {
    try {
      const saved = localStorage.getItem('amar_rx_doctor');
      if (saved) {
        return { ...DEFAULT_DOCTOR, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
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
    bp: ''
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
  const [editingRecordId, setEditingRecordId] = useState(null); // Track if currently editing a saved record
  const [saveStatusFeedback, setSaveStatusFeedback] = useState(null); // 'saved' | 'updated' | 'error'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'
  const [mobileTab, setMobileTab] = useState('medicines'); // 'patient' | 'clinical' | 'medicines' | 'advice'

  // Patient Prescription Records / History (localStorage + Supabase Cloud Sync)
  const [patientRecords, setPatientRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('amar_rx_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [];
  });

  // Sync with Supabase cloud on initial load
  useEffect(() => {
    async function loadCloudRecords() {
      try {
        const cloudData = await fetchPrescriptionsFromCloud();
        if (cloudData && cloudData.length > 0) {
          // Merge local & cloud records, avoiding duplicates
          setPatientRecords(prev => {
            const existingIds = new Set(prev.map(p => String(p.id)));
            const newFromCloud = cloudData.filter(c => !existingIds.has(String(c.id)));
            const merged = [...newFromCloud, ...prev];
            try {
              localStorage.setItem('amar_rx_records', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Initial cloud sync notice:', err);
      }
    }
    loadCloudRecords();
  }, []);

  // Save records to localStorage and async backup to Supabase
  const saveRecordsToStorage = (records, recordToSync = null) => {
    setPatientRecords(records);
    try {
      localStorage.setItem('amar_rx_records', JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save patient records to storage:', e);
    }

    // Async push to Supabase cloud
    if (recordToSync) {
      savePrescriptionToCloud(recordToSync).catch(err => {
        console.warn('Cloud sync error:', err);
      });
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

    let updated;
    if (existingIdx >= 0) {
      updated = [...patientRecords];
      updated[existingIdx] = { ...updated[existingIdx], ...newRecord };
    } else {
      updated = [newRecord, ...patientRecords];
    }

    setEditingRecordId(currentRecordId);
    saveRecordsToStorage(updated, newRecord);
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
    setTimeout(() => {
      window.print();
    }, 150);
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

  // Persist doctor profile
  const handleSaveDoctor = (updatedDoctor) => {
    setDoctor(updatedDoctor);
    localStorage.setItem('amar_rx_doctor', JSON.stringify(updatedDoctor));
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
  const handleNewPrescription = () => {
    // If current prescription has patient name or medicines, save to history before reset
    if (patient.name || medicines.length > 0) {
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
      bp: ''
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
    // Auto-save to patient records upon print so history is always current
    saveCurrentPrescriptionToHistory();
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        
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
        <div className={`grid gap-6 print:block print:w-full ${
          viewMode === 'split' 
            ? 'grid-cols-1 lg:grid-cols-12' 
            : 'grid-cols-1'
        }`}>
          
          {/* LEFT: Editor Pane */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={`no-print space-y-4 ${
              viewMode === 'split' ? 'lg:col-span-6 xl:col-span-6' : 'max-w-4xl mx-auto w-full'
            }`}>
              
              {/* Patient Demographics */}
              <div className={`transition-all ${mobileTab !== 'patient' ? 'hidden md:block' : 'block'}`}>
                <PatientInfoBar
                  patient={patient}
                  onChange={setPatient}
                  isEditing={Boolean(editingRecordId)}
                  onCancelEdit={() => setEditingRecordId(null)}
                  onReset={() => {
                    setEditingRecordId(null);
                    setPatient(prev => ({
                      ...prev,
                      name: '',
                      age: '',
                      weight: '',
                      bp: '',
                      rxId: 'RX-' + Math.floor(1000 + Math.random() * 9000)
                    }));
                  }}
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
              viewMode === 'split' ? 'lg:col-span-6 xl:col-span-6' : 'max-w-[210mm] mx-auto w-full'
            }`}>
              <div className="sticky top-20 print:static">
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
      />

      {/* 1-Click Clinical Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
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
      />

    </div>
  );
}

export default App;
