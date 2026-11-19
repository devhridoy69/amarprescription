import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Printer, FileText, CheckCircle2, AlertCircle, 
  ArrowLeft, ShieldCheck, Share2, Loader2, Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { fetchSinglePrescriptionForPublic } from '../lib/supabase';
import { PrescriptionPreview } from './PrescriptionPreview';

export const PublicPrescriptionView = ({ rxId, onBackToApp = null }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState(null);
  const prescriptionContainerRef = useRef(null);

  useEffect(() => {
    async function loadRx() {
      if (!rxId) {
        setError('প্রেসক্রিপশন আইডি পাওয়া যায়নি।');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchSinglePrescriptionForPublic(rxId);
        if (data) {
          setPrescription(data);
        } else {
          setError(`প্রেসক্রিপশনটি পাওয়া যায়নি (${rxId})। ডাক্তার প্রেসক্রিপশনটি প্রিন্ট বা সেভ করলে ক্লাউড ডেটাবেজে সংরক্ষিত হয়ে এখানে পাওয়া যাবে।`);
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

  // Direct High-Resolution PDF Download to Phone/PC Storage
  const handleDownloadDirectPDF = async () => {
    if (isGeneratingPdf) return;

    const paperElement = prescriptionContainerRef.current?.querySelector('.prescription-paper');
    if (!paperElement) {
      window.print();
      return;
    }

    setIsGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      // 1. Capture clean screenshot of prescription paper in high resolution
      const canvas = await html2canvas(paperElement, {
        scale: 2.5, // 2.5x crisp print quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: paperElement.scrollWidth,
        windowHeight: paperElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // 2. Build standard A4 PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Fit or paginate neatly
      if (pdfHeight <= 297) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, 297);
      }

      const patientName = (prescription?.patient?.name || 'Patient').replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
      const safeRxId = (prescription?.patient?.rxId || rxId || 'Rx').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `Prescription_${patientName}_${safeRxId}.pdf`;

      // 3. Save directly to phone / browser download folder
      pdf.save(filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('PDF generation error, falling back to browser print:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
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
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          
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
      {/* Clean Mobile Patient Header: Direct Download Button Only (No Pad Settings) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-3 sm:px-4 py-2.5 sm:py-3 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="আমার প্রেসক্রিপশন" className="h-7 sm:h-8 w-auto object-contain shrink-0" />
            <div className="leading-tight truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {patient.name || 'ডিজিটাল প্রেসক্রিপশন'}
                </span>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full shrink-0">
                  {patient.rxId || rxId}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                {patient.age ? `${patient.age} ${patient.ageUnit || 'Y'} • ` : ''}{prescription.date || 'আজকের প্রেসক্রিপশন'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="শেয়ার করুন"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">শেয়ার</span>
            </button>

            {/* Direct Device Save / Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadDirectPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 sm:px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs hover:shadow-md cursor-pointer transition-all"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF তৈরি হচ্ছে...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>ডাউনলোড সম্পন্ন!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Prescription Presentation Area - Pad Settings Strictly Hidden (hideToolbar=true) */}
      <main className="flex-1 py-3 sm:py-6 px-2 sm:px-4 max-w-4xl mx-auto w-full">
        <div ref={prescriptionContainerRef} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden print:shadow-none print:border-none">
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
            onPrint={handleDownloadDirectPDF}
            hideToolbar={true} // Strictly hide Pad Settings and toolbar for patients
          />
        </div>

        {/* Footer info for patient */}
        <div className="text-center py-5 text-xs text-slate-500 no-print space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-teal-800 font-bold">
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
