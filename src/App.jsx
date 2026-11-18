import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PatientInfoBar from './components/PatientInfoBar';
import MedicineSection from './components/MedicineSection';
import ClinicalSection from './components/ClinicalSection';
import AdviceSection from './components/AdviceSection';
import PrescriptionPreview from './components/PrescriptionPreview';
import DoctorProfileModal from './components/DoctorProfileModal';
import TemplatesModal from './components/TemplatesModal';
import MobileSectionTabs from './components/MobileSectionTabs';
import { DEFAULT_DOCTOR } from './data/defaultDoctor';
import { PRESCRIPTION_TEMPLATES } from './data/templatesData';
import { FONT_PAIR_PRESETS } from './data/fontPresets';

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
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'
  const [mobileTab, setMobileTab] = useState('medicines'); // 'patient' | 'clinical' | 'medicines' | 'advice'

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

  // Reset entire prescription for new patient
  const handleNewPrescription = () => {
    if (confirm('নতুন প্রেসক্রিপশন শুরু করবেন? বর্তমান ডাটা ক্লিয়ার হবে।')) {
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
      setAdviceList([
        'প্রচুর পরিমাণে বিশুদ্ধ পানি পান করুন',
        'ভরা পেটে ওষুধ সেবন করবেন'
      ]);
      setNextVisit('৭ দিন পর');
      setSpecialNote('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onOpenDoctorSettings={() => setIsDoctorModalOpen(true)}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onNewPrescription={handleNewPrescription}
        onPrint={handlePrint}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        selectedFontId={selectedFontId}
        onSelectFontId={handleSelectFontId}
        fontPresets={FONT_PAIR_PRESETS}
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
                  onReset={() => setPatient(prev => ({
                    ...prev,
                    name: '',
                    age: '',
                    weight: '',
                    bp: '',
                    rxId: 'RX-' + Math.floor(1000 + Math.random() * 9000)
                  }))}
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

          {/* RIGHT: Live A4 Prescription Preview (WYSIWYG) */}
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

    </div>
  );
}

export default App;
