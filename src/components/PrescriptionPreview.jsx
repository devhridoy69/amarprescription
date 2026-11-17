import React, { useState } from 'react';
import { 
  Printer, Layers, Eye, EyeOff, Sliders, ChevronDown, 
  FileText, ArrowDown, ArrowUp, CheckCircle, Info
} from 'lucide-react';
import { StackedFraction, renderWithFractions } from './StackedFraction';

export const PrescriptionPreview = ({ 
  doctor = {}, 
  patient = {}, 
  complaints = [], 
  vitals = {}, 
  diagnosis = '', 
  investigations = [], 
  medicines = [], 
  adviceList = [], 
  nextVisit = '', 
  specialNote = '',
  printSettings = {
    showHeader: true,
    headerHeightMm: 45,
    showFooter: true,
    footerHeightMm: 25,
    pageCount: 1
  },
  onUpdatePrintSettings = () => {},
  selectedFont = null,
  onSelectFontId = () => {},
  fontPresets = []
}) => {
  const [showConfig, setShowConfig] = useState(false);

  // Safe fallback settings if props are undefined
  const settings = {
    showHeader: printSettings?.showHeader ?? true,
    headerHeightMm: printSettings?.headerHeightMm ?? 45,
    showFooter: printSettings?.showFooter ?? true,
    footerHeightMm: printSettings?.footerHeightMm ?? 25,
    pageCount: printSettings?.pageCount ?? 1
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to paginate medicines if doctor has chosen 2 pages or wants auto/manual split
  const isMultiPage = settings.pageCount > 1;
  const splitIndex = Math.ceil(medicines.length / 2);
  const page1Medicines = isMultiPage ? medicines.slice(0, splitIndex) : medicines;
  const page2Medicines = isMultiPage ? medicines.slice(splitIndex) : [];

  const renderSinglePage = (pageNumber, pageMeds, isLastPage) => {
    return (
      <div 
        key={`page-${pageNumber}`}
        style={selectedFont ? { fontFamily: selectedFont.fontFamily } : {}}
        className={`prescription-paper bg-white w-full max-w-[210mm] min-h-[297mm] shadow-xl rounded-xl border border-slate-200/80 p-5 sm:p-7 md:p-9 flex flex-col justify-between text-slate-800 transition-all text-xs print:p-0 print:border-none print:shadow-none print:rounded-none relative ${
          !isLastPage ? 'mb-8 print:mb-0 print:page-break' : ''
        }`}
      >
        {/* TOP: Header (Doctor & Chamber Info OR Blank Space for Pre-printed Letterhead Pad) */}
        <div>
          {settings.showHeader ? (
            <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-teal-700/80">
              
              {/* Left: Doctor Credentials */}
              <div className="col-span-7 sm:col-span-7 space-y-0.5">
                <h1 className="text-base sm:text-lg font-black text-teal-900 tracking-tight leading-tight">
                  {doctor.name || 'Dr. Md. Rafiqul Islam'}
                </h1>
                <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                  {doctor.degrees || 'MBBS, FCPS, MD'}
                </p>
                <p className="text-[11px] text-teal-800 font-medium leading-snug">
                  {doctor.specialty}
                </p>
                <p className="text-[10px] text-slate-600">
                  {doctor.workplace}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  BMDC Reg. No: <span className="font-bold text-slate-700">{doctor.bmdcReg}</span>
                </p>
                {doctor.phone && (
                  <p className="text-[10px] text-slate-600 flex items-center gap-1">
                    <span>Tel: {doctor.phone}</span>
                  </p>
                )}
              </div>

              {/* Right: Chamber / Hospital Details */}
              <div className="col-span-5 sm:col-span-5 text-right space-y-0.5 flex flex-col justify-between">
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    {doctor.chamberName || 'Ayan Specialized Digital Chamber'}
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                    {doctor.chamberAddress}
                  </p>
                </div>
                <div className="pt-1.5 space-y-0.5">
                  {doctor.visitingHours && (
                    <p className="text-[10px] text-slate-600">
                      <span className="font-semibold text-teal-900">সময়:</span> {doctor.visitingHours}
                    </p>
                  )}
                  {doctor.serialPhone && (
                    <p className="text-[10px] font-bold text-teal-800">
                      সিরিয়াল: {doctor.serialPhone}
                    </p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Blank Header Space for pre-printed letterhead pad */
            <div 
              style={{ height: `${settings.headerHeightMm}mm` }} 
              className="w-full border-b border-dashed border-teal-200/60 flex items-center justify-center text-slate-400 text-[11px] no-print bg-slate-50/50 rounded-lg mb-2"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-teal-600" />
                ফাঁকা হেডার স্পেস ({settings.headerHeightMm}mm) — প্রি-প্রিন্টেড প্যাডে প্রিন্ট হবে
              </span>
            </div>
          )}

          {/* PATIENT DEMOGRAPHICS BAR */}
          <div className="my-3 py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] font-medium text-slate-700">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Name:</span>
              <span className="font-bold text-slate-900 text-xs">{patient.name || '—'}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Age:</span>
              <span className="font-bold text-slate-900">{patient.age ? `${patient.age} ${patient.ageUnit || 'Y'}` : '—'}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Sex:</span>
              <span className="font-bold text-slate-900">{patient.gender || '—'}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Date:</span>
              <span className="font-bold text-slate-900">{patient.date || new Date().toISOString().split('T')[0]}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">ID / Rx:</span>
              <span className="font-mono font-bold text-slate-800">{patient.rxId || 'RX-1001'}</span>
            </div>

            {patient.weight && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Wt:</span>
                <span className="font-bold text-slate-900">{patient.weight}</span>
              </div>
            )}

            {patient.bp && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400">BP:</span>
                <span className="font-bold text-rose-700">{patient.bp}</span>
              </div>
            )}
          </div>

          {/* MAIN BODY: 2 Columns (Clinical Notes | Rx Medicines) */}
          <div className="grid grid-cols-12 gap-6 min-h-[145mm] mt-4">
            
            {/* LEFT COLUMN: Clinical Notes (C/C, O/E, Investigations, Diagnosis) */}
            <div className="col-span-4 border-r border-slate-200 pr-4 space-y-4 text-[11px]">
              
              {/* Show clinical notes primarily on Page 1 */}
              {pageNumber === 1 ? (
                <>
                  {/* Chief Complaints (C/C) */}
                  {complaints.length > 0 && (
                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1.5 flex items-center justify-between">
                        <span>C / C :</span>
                      </h3>
                      <ul className="space-y-1 text-slate-700">
                        {complaints.map((c, i) => (
                          <li key={i} className="leading-snug">
                            • {c.text} <span className="text-slate-500 font-normal">({c.duration})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* On Examination (O/E) */}
                  {(vitals.bp || vitals.pulse || vitals.temp || vitals.spo2 || vitals.rbs || vitals.weight) && (
                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1.5">
                        O / E :
                      </h3>
                      <div className="space-y-1 text-slate-700 font-mono text-[10.5px]">
                        {vitals.bp && <div>BP: <span className="font-semibold text-slate-900">{vitals.bp} mmHg</span></div>}
                        {vitals.pulse && <div>Pulse: <span className="font-semibold text-slate-900">{vitals.pulse} /min</span></div>}
                        {vitals.temp && <div>Temp: <span className="font-semibold text-slate-900">{vitals.temp} °F</span></div>}
                        {vitals.spo2 && <div>SpO2: <span className="font-semibold text-slate-900">{vitals.spo2}%</span></div>}
                        {vitals.weight && <div>Weight: <span className="font-semibold text-slate-900">{vitals.weight} kg</span></div>}
                        {vitals.rbs && <div>RBS: <span className="font-semibold text-slate-900">{vitals.rbs} mmol/L</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Diagnosis (Dx) */}
                  {diagnosis && (
                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1">
                        Diagnosis :
                      </h3>
                      <p className="font-bold text-slate-900 text-xs leading-snug">
                        {diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Investigations Advised (Inv) */}
                  {investigations.length > 0 && (
                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-0.5 mb-1.5">
                        Inv. Advised :
                      </h3>
                      <ul className="space-y-1 text-slate-700">
                        {investigations.map((inv, i) => (
                          <li key={i} className="leading-snug">
                            {i + 1}. {inv}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                /* Page 2 continuation note */
                <div className="text-slate-400 italic text-[10px] space-y-2">
                  <p className="font-semibold text-teal-800">Page {pageNumber} (Continuation)</p>
                  {investigations.length > 0 && (
                    <div>
                      <h4 className="font-bold uppercase text-slate-600 border-b border-slate-200 pb-0.5 mb-1">
                        Inv. (Contd.):
                      </h4>
                      <ul className="space-y-0.5 text-slate-600">
                        {investigations.slice(0, 4).map((inv, i) => (
                          <li key={i}>• {inv}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Rx Medicines */}
            <div className="col-span-8 pl-1">
              
              {/* Classical Medical Rx Symbol */}
              <div className="text-3xl font-black font-serif text-teal-950 mb-3 select-none flex items-center justify-between">
                <span>℞</span>
                <span className="text-[10px] font-sans font-normal text-slate-400">
                  {isMultiPage ? `Page ${pageNumber} of ${settings.pageCount}` : `${medicines.length} Medication(s)`}
                </span>
              </div>

              {/* Medicine List */}
              {pageMeds.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  {pageNumber === 1 ? 'কোনো ঔষধ প্রেসক্রাইব করা হয়নি।' : 'কোনো ঔষধ বাকি নেই।'}
                </div>
              ) : (
                <div className="space-y-4">
                  {pageMeds.map((med, idx) => {
                    const globalIdx = isMultiPage && pageNumber === 2 ? splitIndex + idx : idx;
                    return (
                      <div key={med.id || globalIdx} className="space-y-1">
                        
                        {/* Line 1: Type + Brand + Strength + (Generic) */}
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-700 text-[11px]">
                            {globalIdx + 1}.
                          </span>
                          <span className="font-bold text-teal-800 text-[11px] uppercase tracking-wider">
                            {med.type}.
                          </span>
                          <span className="font-black text-sm text-slate-900">
                            {med.brandName}
                          </span>
                          {med.strength && (
                            <span className="font-semibold text-xs text-slate-700">
                              {med.strength}
                            </span>
                          )}
                          {med.genericName && (
                            <span className="text-[10.5px] text-slate-500 italic">
                              ({med.genericName})
                            </span>
                          )}
                        </div>

                        {/* Line 2: Dosage with Vertical Stacked Fraction, Unit, Instructions, Duration */}
                        <div className="pl-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-800 font-medium">
                          
                          {/* Dosage with vertical fraction like 1 up, 2 down */}
                          <div className="inline-flex items-center font-bold font-mono text-teal-950 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200">
                            {renderWithFractions(med.dosage, 'md')}
                          </div>

                          {/* Unit e.g. 1/2 কাপ / Tablet */}
                          {med.unit && (
                            <span className="text-slate-700 font-semibold">
                              {renderWithFractions(med.unit, 'sm')}
                            </span>
                          )}

                          <span className="text-slate-300">•</span>

                          {/* Timing / Instructions */}
                          <span className="text-slate-800 font-semibold">
                            {renderWithFractions(med.instruction, 'sm')}
                          </span>

                          <span className="text-slate-300">•</span>

                          {/* Duration */}
                          <span className="text-slate-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 text-[11px]">
                            {med.duration}
                          </span>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

          {/* ADVICE & FOLLOW-UP SECTION (Shown on last page, or page 1 if single page) */}
          {isLastPage && (adviceList.length > 0 || nextVisit || specialNote) && (
            <div className="mt-6 pt-4 border-t-2 border-slate-200 grid grid-cols-12 gap-4 text-xs">
              
              {/* Advice */}
              <div className="col-span-8 space-y-1">
                <h4 className="font-bold text-teal-950 uppercase tracking-wider text-[11px]">
                  উপদেশ (Advice) :
                </h4>
                <ul className="space-y-0.5 text-slate-700 text-[11px]">
                  {adviceList.map((adv, i) => (
                    <li key={i} className="leading-snug">
                      • {adv}
                    </li>
                  ))}
                </ul>

                {specialNote && (
                  <p className="text-[10.5px] text-slate-600 italic pt-1">
                    নোট: {specialNote}
                  </p>
                )}
              </div>

              {/* Next Visit & Signature Area */}
              <div className="col-span-4 flex flex-col justify-between text-right">
                
                {nextVisit && (
                  <div className="text-left bg-teal-50/70 p-2 rounded-lg border border-teal-100">
                    <span className="block text-[10px] font-bold text-teal-900 uppercase">
                      পরবর্তী সাক্ষাত (Next Visit) :
                    </span>
                    <span className="font-bold text-xs text-teal-950">
                      {nextVisit}
                    </span>
                  </div>
                )}

                {/* Doctor Signature */}
                <div className="pt-8">
                  <div className="inline-block border-t border-slate-400 pt-1 text-center min-w-[130px]">
                    <span className="block text-[11px] font-bold text-slate-800">
                      {doctor.name || 'Doctor Signature'}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      চিকিৎসকের স্বাক্ষর ও সিল
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* FOOTER: Software Branding & Chamber Emergency Note OR Blank space */}
        {settings.showFooter ? (
          <div className="pt-4 mt-6 border-t border-slate-200 text-center space-y-1 text-[10px] text-slate-500">
            {doctor.emergencyNote && (
              <p className="text-slate-600 font-medium">
                {doctor.emergencyNote}
              </p>
            )}
            {doctor.showAyanTechBranding !== false && (
              <div className="flex items-center justify-center gap-2 font-medium text-slate-500 pt-1">
                <img src="/logo.png" alt="আমার প্রেসক্রিপশন" className="h-4.5 w-auto object-contain inline-block" />
                <span>•</span>
                <span className="font-bold text-teal-800">Developed By Ayan Tech 01780960370</span>
              </div>
            )}
          </div>
        ) : (
          /* Blank Footer Space for hospital/chamber pre-printed footer */
          <div 
            style={{ height: `${settings.footerHeightMm}mm` }} 
            className="w-full border-t border-dashed border-teal-200/60 flex items-center justify-center text-slate-400 text-[10px] no-print bg-slate-50/50 rounded-lg mt-3"
          >
            <span>ফাঁকা ফুটার স্পেস ({settings.footerHeightMm}mm) — প্যাডের নিজস্ব ফুটার প্রিন্ট থাকবে</span>
          </div>
        )}

        {/* Page Number indicator */}
        {isMultiPage && (
          <div className="absolute bottom-2 right-4 text-[9px] text-slate-400 font-mono no-print">
            Page {pageNumber} of {settings.pageCount}
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Floating Action & Customization Toolbar (Screen Only) */}
      <div className="no-print w-full flex flex-col gap-2.5 mb-4 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Top row: Status, Multi-page pills, Print button */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-800">A4 Prescription Preview</span>
            <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
              {settings.pageCount} Page{settings.pageCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showConfig
                  ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Configure Header, Footer and Page Count"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pad Settings</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Dropdown Customizer Bar for Header/Footer & Multi-Page */}
        {showConfig && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl">
            
            {/* 1. Header Toggle & Gap (Faka Header) */}
            <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  {settings.showHeader ? <Eye className="w-3.5 h-3.5 text-teal-600" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                  Header (হেডার)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showHeader}
                    onChange={(e) => onUpdatePrintSettings({ ...settings, showHeader: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500">
                {settings.showHeader ? 'হেডার প্রদর্শিত হবে' : 'হেডার ফাঁকা থাকবে (প্রি-প্রিন্টেড প্যাড)'}
              </p>
              {!settings.showHeader && (
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-500">উচ্চতা:</span>
                  <input
                    type="number"
                    min="15"
                    max="90"
                    value={settings.headerHeightMm}
                    onChange={(e) => onUpdatePrintSettings({ ...settings, headerHeightMm: Number(e.target.value) })}
                    className="w-14 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs font-semibold"
                  />
                  <span className="text-[10px] text-slate-500">mm</span>
                </div>
              )}
            </div>

            {/* 2. Footer Toggle & Gap (Faka Footer) */}
            <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  {settings.showFooter ? <Eye className="w-3.5 h-3.5 text-teal-600" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                  Footer (ফুটার)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showFooter}
                    onChange={(e) => onUpdatePrintSettings({ ...settings, showFooter: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500">
                {settings.showFooter ? 'ফুটার প্রদর্শিত হবে' : 'ফুটার ফাঁকা থাকবে (প্যাডের ফুটার)'}
              </p>
              {!settings.showFooter && (
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-500">উচ্চতা:</span>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={settings.footerHeightMm}
                    onChange={(e) => onUpdatePrintSettings({ ...settings, footerHeightMm: Number(e.target.value) })}
                    className="w-14 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs font-semibold"
                  />
                  <span className="text-[10px] text-slate-500">mm</span>
                </div>
              )}
            </div>

            {/* 3. Multi-Pages Selection Option */}
            <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Page Count (পৃষ্ঠা সংখ্যা)
              </span>
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
                {[1, 2].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onUpdatePrintSettings({ ...settings, pageCount: p })}
                    className={`flex-1 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                      settings.pageCount === p
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p} {p === 1 ? 'Page (১ পাতা)' : 'Pages (২ পাতা)'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                {settings.pageCount === 1 ? '১ পাতায় সম্পূর্ণ প্রেসক্রিপশন' : 'বেশি ওষুধ থাকলে ২ পাতায় বিভক্ত হবে'}
              </p>
            </div>

            {/* 4. Font Typography Quick Switcher in Pad Settings */}
            {fontPresets.length > 0 && (
              <div className="sm:col-span-3 space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">
                    Prescription Typography (প্রেসক্রিপশন ফন্ট):
                  </span>
                  <span className="text-[11px] text-teal-700 font-semibold">
                    {selectedFont?.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                  {fontPresets.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFontId(f.id)}
                      style={{ fontFamily: f.fontFamily }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        selectedFont?.id === f.id
                          ? 'bg-teal-600 text-white border-teal-700 shadow-2xs font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* RENDER PAGES (Single Page OR Multi-Pages with Clean Page Break) */}
      <div className="w-full flex flex-col items-center">
        {renderSinglePage(1, page1Medicines, !isMultiPage)}
        {isMultiPage && renderSinglePage(2, page2Medicines, true)}
      </div>

    </div>
  );
};

export default PrescriptionPreview;
