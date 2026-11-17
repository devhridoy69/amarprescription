# Amar Prescription (আমার প্রেসক্রিপশন) By Ayan Tech

> **Minimalist, Ultra-Fast & Responsive Doctor Prescription Software for Laptops, Tablets, and Smartphones.**

---

## 🌟 Key Highlights & Features

### 1. ⚡ Zero Manual Typing (১ ক্লিকে প্রেসক্রিপশন তৈরি)
- **120+ Top Bangladeshi Brand & Generic Medicines Database**: Instant autocomplete suggestions as you type 1-2 letters (e.g., Napa, Seclo, Maxpro, Pantonix, Cef-3, Fexo, Beklo, Bizoran, etc.).
- **Click-to-Add Chief Complaints (C/C)**: Over 20 common symptoms (জ্বর, সর্দি, কাশি, গলা ব্যথা, পেট ব্যথা, বুক জ্বালাপোড়া, ইত্যাদি) with duration presets.
- **Physical Examination (O/E)**: 1-click "Normal Vitals" button (BP 120/80, Pulse 76, Temp 98.4°F, SpO2 99%) plus custom fields.
- **Click-to-Add Investigations (Inv)**: Over 35 lab tests (CBC, Urine R/M/E, RBS, Serum Creatinine, SGPT, ECG, USG, Chest X-Ray, etc.).
- **1-Click Clinical Protocol Templates**: Instant pre-built complete prescriptions for:
  - Viral Fever / Common Cold (সাধারণ সর্দি ও জ্বর)
  - Gastritis & Acid Reflux (গ্যাস্ট্রিক ও বুক জ্বালা)
  - Essential Hypertension (উচ্চ রক্তচাপ)
  - Acute Pharyngitis / Tonsillitis (গলা ব্যথা)
  - Low Back Pain & Muscle Spasm (কোমরে ব্যথা)
  - ...and more!

---

### 2. 🥛 Medicine Half Cup & Vertical Stacked Fraction Feature
- **True Stacked Vertical Fraction (1 Up, 2 Down)**:
  - Renders $\frac{1}{2}$ with 1 on top, horizontal dividing line, and 2 on the bottom — formatted to medical industry standards.
  - Quick fraction presets: $\frac{1}{2}$, $\frac{1}{4}$, $1$, $1\frac{1}{2}$, $2$, $2\frac{1}{2}$, $3$.
- **Special Half Cup (১/২ কাপ) Option**:
  - 1-click `১/২ কাপ (Half Cup)` button for syrups, oral solutions, and suspensions.
  - Dedicated instructions: `১/২ কাপ কুসুম গরম পানিতে মিশিয়ে খাবেন`, `১/২ কাপ পানিতে ২ চামচ করে`, etc.

---

### 3. 📱 100% Responsive Across All Devices
- **Laptops & Desktops**: Side-by-side **Split View** with real-time WYSIWYG A4 paper live preview on the right.
- **Tablets & iPads**: Touch-optimized large tap buttons (min 44px) and smooth toggle between Editor and Live Preview.
- **Smartphones & Mobiles**: Quick top/bottom segmented navigation tabs (`Patient`, `Symptoms & Dx`, `Medicines (Rx)`, `Advice`, `Preview`) to jump effortlessly between sections without endless scrolling.

---

### 4. 🖨️ A4 Print & PDF Ready (আন্তর্জাতিক ও বিএমডিসি প্রেসক্রিপশন ফরম্যাট)
- Optimized `@media print` CSS for standard A4 portrait paper.
- Automatic removal of all web UI buttons, sidebars, and input boxes during printing.
- Clean 2-column layout:
  - **Left column**: C/C, O/E Vitals, Investigations Advised, Diagnosis.
  - **Right column**: $\mathcal{R}_x$ symbol, numbered medicines with visual stacked fractions, instructions, and duration.
  - **Footer**: Advice list, Next visit / follow-up date, Doctor signature & stamp area, and `Amar Prescription By Ayan Tech` branding.

---

### 5. 👨‍⚕️ Customizable Doctor & Chamber Profile
- Doctor Name, Qualifications (MBBS, FCPS, MD), BMDC Reg No.
- Chamber Name, Address, Visiting Hours, Serial/Appointment Phone numbers.
- Automatically saved to `localStorage` — once configured, never lost!

---

## 🚀 How to Run the Software

### Prerequisites
- Node.js (v18+)
- npm

### Development Mode
```bash
npm install
npm run dev
```
Open **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)** in your browser.

### Production Build
```bash
npm run build
```
The optimized production files will be generated in the `dist/` folder ready for static hosting (Vercel, Netlify, Cloudflare Pages, etc.).

---

## 🩺 Developed By
**Amar Prescription (আমার প্রেসক্রিপশন)**  
Powered by **Ayan Tech**
