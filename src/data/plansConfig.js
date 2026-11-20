// Default dynamic plans configuration
export const DEFAULT_PLANS_CONFIG = {
  freePlan: {
    id: 'free',
    name: 'Free Plan',
    prescriptionLimit: 100,
    canRemoveWatermark: false,
    canUseQrCode: false,
    canSwitchChambers: false
  },
  plans: [
    {
      id: 'standard',
      name: 'Standard Pro',
      tagline: 'জনপ্রিয় ক্লিনিক্যাল প্যাক',
      badgeText: 'Watermark Remove + 30 Days Cloud Backup',
      price: '৪৯৯',
      period: 'মাসিক',
      badge: 'Pro',
      popular: false,
      color: 'teal',
      features: [
        'Watermark Remove (ব্র্যান্ডিং মুক্ত সম্পূর্ণ ক্লিন প্যাড)',
        'Daily Cloud Backup (বিগত ৩০ দিনের ব্যাকআপ সংরক্ষণ)',
        'প্রেসক্রিপশন সেভ ও প্রিন্ট (Rx Limit)',
        'অফলাইন মেডিসিন ও ইনভেস্টিগেশন সার্চ',
        'ব্যবহার সীমা ড্যাশবোর্ডে দৃশ্যমান (Usage Limit)'
      ],
      permissions: {
        removeWatermark: true,
        qrCode: false,
        multipleChambers: false,
        prescriptionLimit: 500,
        backupDays: 30
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise VIP',
      tagline: 'সম্পূর্ণ ডিজিটাল চেম্বার সল্যুশন',
      badgeText: 'Smart QR + Multiple Chambers + 3 Mo Backup',
      price: '৯৯৯',
      period: 'মাসিক / বাৎসরিক অফার',
      badge: 'VIP Gold',
      popular: true,
      color: 'amber',
      features: [
        'Smart Header QR Code (রোগীর অনলাইনে ভেরিফিকেশন ও ডাউনলোড)',
        'Watermark Remove (ব্র্যান্ডিং মুক্ত নিজস্ব প্যাড প্রিন্টিং)',
        'Multiple Chamber Switch (পপুলার, ইবনে সিনা ও চেম্বার সুইচিং)',
        'Daily Cloud Backup (বিগত ৩ মাসের ডাটা ব্যাকআপ সংরক্ষণ)',
        '24/7 Priority Customer Service via WhatsApp',
        'আনলিমিটেড পেশেন্ট হিস্ট্রি ও প্রেসক্রিপশন ডাউনলোড'
      ],
      permissions: {
        removeWatermark: true,
        qrCode: true,
        multipleChambers: true,
        prescriptionLimit: Infinity
      }
    }
  ],
  contact: {
    whatsapp: '01780960370',
    bkash: '01780960370 (Personal / Send Money)',
    nagad: '01780960370 (Personal)'
  }
};

export const PLANS_STORAGE_KEY = 'amar_rx_plans_config';

export function getPlansConfig() {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old structure if it has standard/enterprise as object keys
      if (parsed.standard && parsed.enterprise && !parsed.plans) {
        return {
          ...DEFAULT_PLANS_CONFIG,
          plans: [
            { ...parsed.standard, badgeText: parsed.standard.badgeText || 'Watermark Remove + 30 Days Cloud Backup' },
            { ...parsed.enterprise, badgeText: parsed.enterprise.badgeText || 'Smart QR + Multiple Chambers + 3 Mo Backup' }
          ],
          contact: parsed.contact || DEFAULT_PLANS_CONFIG.contact
        };
      }
      return { 
        ...DEFAULT_PLANS_CONFIG, 
        ...parsed, 
        freePlan: { ...DEFAULT_PLANS_CONFIG.freePlan, ...(parsed.freePlan || {}) } 
      };
    }
  } catch (e) {}
  return DEFAULT_PLANS_CONFIG;
}

export function savePlansConfig(config) {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {}
}

export function normalizePlanId(planId) {
  if (!planId) return 'free';
  const lower = String(planId).toLowerCase().trim();
  if (lower === 'standard_pro' || lower === 'pro') return 'standard';
  if (lower === 'enterprise_vip' || lower === 'vip') return 'enterprise';
  return lower;
}

export function getPlanPermissions(planId) {
  const cfg = getPlansConfig();
  const id = normalizePlanId(planId);

  // 1. Free plan check
  if (id === 'free') {
    const freeCfg = cfg.freePlan || DEFAULT_PLANS_CONFIG.freePlan;
    const limit = Number(freeCfg.prescriptionLimit) || 100;
    return {
      id: 'free',
      name: freeCfg.name || 'Free Plan',
      prescriptionLimit: limit,
      canRemoveWatermark: Boolean(freeCfg.canRemoveWatermark),
      canUseQrCode: Boolean(freeCfg.canUseQrCode),
      canSwitchChambers: Boolean(freeCfg.canSwitchChambers),
      badge: 'Free Plan',
      color: 'slate'
    };
  }

  // 2. Dynamic plans lookup
  const matchedPlan = (cfg.plans || []).find(p => 
    p.id.toLowerCase() === id || 
    (id === 'enterprise_vip' && p.id === 'enterprise') ||
    (id === 'standard_pro' && p.id === 'standard')
  );

  if (matchedPlan) {
    const pms = matchedPlan.permissions || {};
    let limit = pms.prescriptionLimit;
    if (limit === undefined || limit === null || limit === '' || limit === 'unlimited' || limit === 'Infinity') {
      limit = Infinity;
    } else {
      const num = Number(limit);
      limit = (!isNaN(num) && num > 0) ? num : Infinity;
    }

    return {
      id: matchedPlan.id,
      name: matchedPlan.name,
      prescriptionLimit: limit,
      canRemoveWatermark: pms.removeWatermark !== undefined ? Boolean(pms.removeWatermark) : true,
      canUseQrCode: pms.qrCode !== undefined ? Boolean(pms.qrCode) : false,
      canSwitchChambers: pms.multipleChambers !== undefined ? Boolean(pms.multipleChambers) : false,
      badge: matchedPlan.badge || matchedPlan.name,
      color: matchedPlan.color || 'teal'
    };
  }

  // 3. Fallback to free plan
  const freeCfg = cfg.freePlan || DEFAULT_PLANS_CONFIG.freePlan;
  return {
    id: 'free',
    name: 'Free Plan',
    prescriptionLimit: Number(freeCfg.prescriptionLimit) || 100,
    canRemoveWatermark: false,
    canUseQrCode: false,
    canSwitchChambers: false,
    badge: 'Free Plan',
    color: 'slate'
  };
}
