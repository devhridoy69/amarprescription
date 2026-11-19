import React, { useState, useEffect } from 'react';
import { 
  Download, Printer, FileText, CheckCircle2, AlertCircle, 
  ArrowLeft, ShieldCheck, Phone, Stethoscope, Share2, Loader2
} from 'lucide-react';
import { fetchSinglePrescriptionForPublic } from '../lib/supabase';
import { PrescriptionPreview } from './PrescriptionPreview';

export const PublicPrescriptionView = ({ rxId, onBackToApp = null }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRx() {
      if (!rxId) {
        setError('প্রেসক্রিপশন আইডি পাওয়া যায়নি।');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching public rx for:', rxId);
        const data = await fetchSinglePrescriptionForPublic(rxId);
        if (data) {
          setPrescription(data);
        } else {
          setError(`প্রেসক্রিপশনটি পাওয়া যায়নি (${rxId})। ডাক্তার প্রেসক্রিপশনটি প্রিন্ট বা সেভ করলে ক্লাউড ডেটাবেজে সংরক্ষিত হয়ে এখানে দেখা যাবে।`);
        }
      } catch (err) {
        console.error(err);
        setError('প্রেসক্রিপশন লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
      } finally {
        setLoading(false);
      }
    }

    loadRx();
  }, [rxId]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Prescription - ${prescription?.patient?.name || rxId}`,
        text: `ডিজিটাল প্রেসক্রিপশন: ${prescription?.patient?.name || ''} (${rxId})`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('প্রেসক্রিপশন লিংক কপি করা হয়েছে!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-200">প্রেসক্রিপশন লোড হচ্ছে...</h2>
        <p className="text-xs text-slate-400 mt-1">দয়া করে অপেক্ষা করুন (RX ID: {rxId})</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">প্রেসক্রিপশন পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'প্রেসক্রিপশনটি ক্লাউড ডেটাবেজে সংরক্ষিত নাও থাকতে পারে।'}</p>
          
          <div className="flex gap-2 justify-center">
            {onBackToApp ? (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                মূল অ্যাপে ফিরে যান
              </button>
            ) : (
              <a
                href="/"
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                হোম পেইজে যান
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const patient = prescription.patient || {};
  const doctor = prescription.doctor || prescription.doctorProfile || {
    name: 'Doctor Chamber',
    degrees: 'MBBS',
    specialty: 'Physician & Surgeon',
    hospital: 'Digital Chamber'
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top Patient Bar with 1-Click Download PDF */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3 no-print">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="আমার প্রেসক্রিপশন" className="h-8 w-auto object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">ডিজিটাল প্রেসক্রিপশন</span>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.2 rounded-full">
                  {patient.rxId || rxId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                {patient.name ? `${patient.name} (${patient.age || ''} ${patient.ageUnit || 'Y'})` : 'Patient Record'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="শেয়ার করুন"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">শেয়ার</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer transition-all animate-pulse hover:animate-none"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF / Print</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Prescription Presentation Area */}
      <main className="flex-1 py-4 sm:py-8 px-2 sm:px-4 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          <PrescriptionPreview
            doctor={doctor}
            patient={patient}
            complaints={prescription.complaints || []}
            vitals={prescription.vitals || {}}
            diagnosis={prescription.diagnosis || ''}
            investigations={prescription.investigations || []}
            medicines={prescription.medicines || []}
            adviceList={prescription.adviceList || prescription.advice || []}
            nextVisit={prescription.nextVisit || ''}
            specialNote={prescription.specialNote || ''}
            printSettings={{
              showHeader: true,
              headerHeightMm: 45,
              showFooter: true,
              footerHeightMm: 25,
              pageCount: 1,
              paperSize: 'A4',
              scale: 100
            }}
            onPrint={handleDownloadPDF}
          />
        </div>

        {/* Footer info for patient */}
        <div className="text-center py-6 text-xs text-slate-500 no-print space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-teal-700 font-bold">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Digital Verified & Authenticated Prescription</span>
          </div>
          <p className="text-[11px] text-slate-400">
            এই প্রেসক্রিপশনটি কিউআর কোড স্ক্যান করে ক্লাউড সার্ভার থেকে সরাসরি জেনারেট করা হয়েছে।
          </p>
        </div>
      </main>
    </div>
  );
};

export default PublicPrescriptionView;
