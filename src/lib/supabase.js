import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvxhqoigwodhfuetjkay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7YSDaB3i3DTb3RzI4xULbQ_983WvEm3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Master Admin Credentials: Default fallback credentials
export const MASTER_ADMIN_CREDENTIALS = {
  phone: '01780960370', // Ayan Tech Official Phone
  password: 'admin'       // Secret admin key (also supports 'admin123' & 'ayan7809')
};

const ADMIN_PASS_STORAGE_KEY = 'amar_rx_custom_admin_pass';

export function getCustomAdminPassword() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_PASS_STORAGE_KEY);
}

export function isMasterAdmin(phone, password) {
  const cleanPhone = (phone || '').trim().replace(/\s+/g, '');
  const pass = (password || '').trim();
  const customPass = getCustomAdminPassword();

  const isPhoneAdmin = (cleanPhone === '01780960370' || cleanPhone === 'admin' || cleanPhone === '01700000000');
  if (!isPhoneAdmin) return false;

  // If a custom password has been set, check against it
  if (customPass && pass === customPass) {
    return true;
  }

  // Fallback defaults for safety / recovery
  return (pass === 'admin' || pass === 'admin123' || pass === 'ayan7809');
}

/**
 * Updates Master Admin password in localStorage and synchronizes with doctor_users if table exists
 */
export async function updateAdminMasterPassword(currentPassword, newPassword) {
  const cleanCurrent = (currentPassword || '').trim();
  const cleanNew = (newPassword || '').trim();

  if (!cleanNew || cleanNew.length < 4) {
    return { success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' };
  }

  // Validate current password
  const customPass = getCustomAdminPassword();
  const isCurrentValid = customPass 
    ? (cleanCurrent === customPass) 
    : (cleanCurrent === 'admin' || cleanCurrent === 'admin123' || cleanCurrent === 'ayan7809');

  if (!isCurrentValid) {
    return { success: false, error: 'বর্তমান এডমিন পাসওয়ার্ডটি সঠিক নয়।' };
  }

  // 1. Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_PASS_STORAGE_KEY, cleanNew);
  }

  // 2. Also attempt to sync to Supabase doctor_users under official admin phone
  try {
    const adminPhone = '01780960370';
    const { data: existingAdmin } = await supabase
      .from('doctor_users')
      .select('id, phone')
      .eq('phone', adminPhone)
      .maybeSingle();

    if (existingAdmin) {
      await supabase
        .from('doctor_users')
        .update({ password_hash: cleanNew })
        .eq('phone', adminPhone);
    } else {
      await supabase
        .from('doctor_users')
        .insert([{
          id: 'admin_master_ayan',
          phone: adminPhone,
          full_name: 'Master Super Admin',
          specialty: 'System Administrator',
          degrees: 'Dev Admin',
          bmdc_reg_no: 'ADMIN-01',
          status: 'approved',
          password_hash: cleanNew,
          has_watermark: false,
          created_at: new Date().toISOString()
        }]);
    }
  } catch (e) {
    console.warn('Admin password supabase sync note:', e);
  }

  return { success: true };
}

/**
 * Search medicines from Supabase 'Medicine_Database'
 * Supports smart multi-word search e.g. "napa drop", "napa syrup", "cef-3 syp", "solbion inj"
 */
export async function searchMedicinesOnline(query, limit = 25) {
  if (!query || query.trim().length < 1) return [];

  const cleanQuery = query.trim();
  const parts = cleanQuery.split(/\s+/).filter(Boolean);

  // Dosage type synonyms / keywords
  const typeKeywords = [
    'drop', 'drops', 'syp', 'syrup', 'susp', 'suspension',
    'tab', 'tablet', 'cap', 'capsule', 'inj', 'injection',
    'inhaler', 'gel', 'ointment', 'oint', 'suppository', 'cream', 'sachet'
  ];

  let targetTypeFilter = null;
  let textTokens = [];

  for (const part of parts) {
    const pLower = part.toLowerCase();
    if (!targetTypeFilter && typeKeywords.includes(pLower)) {
      targetTypeFilter = pLower;
    } else {
      textTokens.push(part);
    }
  }

  // The actual brand / generic query string
  const brandQuery = textTokens.length > 0 ? textTokens.join(' ') : cleanQuery;

  try {
    const fetchLimit = targetTypeFilter ? limit * 3 : limit;
    const { data: brandMatches, error: brandError } = await supabase
      .from('Medicine_Database')
      .select('id, Type, brand_name, strength, generic_name, company')
      .ilike('brand_name', `${brandQuery}%`)
      .limit(fetchLimit);

    if (brandError) {
      console.warn('Supabase brand search error:', brandError);
    }

    let results = brandMatches || [];

    if (results.length < fetchLimit) {
      const remainingLimit = fetchLimit - results.length;
      const existingIds = new Set(results.map(r => r.id));

      const { data: genericMatches } = await supabase
        .from('Medicine_Database')
        .select('id, Type, brand_name, strength, generic_name, company')
        .or(`generic_name.ilike.%${brandQuery}%,brand_name.ilike.%${brandQuery}%`)
        .limit(remainingLimit * 2);

      if (genericMatches) {
        for (const item of genericMatches) {
          if (!existingIds.has(item.id)) {
            existingIds.add(item.id);
            results.push(item);
            if (results.length >= fetchLimit) break;
          }
        }
      }
    }

    // If user specified a dosage type in their query (e.g. "napa drop"), filter by type!
    if (targetTypeFilter) {
      results = results.filter(item => {
        const t = (item.Type || '').toLowerCase();
        if (targetTypeFilter.startsWith('drop')) return t.includes('drop');
        if (targetTypeFilter.startsWith('syp') || targetTypeFilter.startsWith('syrup') || targetTypeFilter.startsWith('susp')) {
          return t.includes('syrup') || t.includes('susp') || t.includes('solution') || t.includes('elixir');
        }
        if (targetTypeFilter.startsWith('tab')) return t.includes('tab');
        if (targetTypeFilter.startsWith('cap')) return t.includes('cap');
        if (targetTypeFilter.startsWith('inj')) return t.includes('inj') || t.includes('infusion');
        if (targetTypeFilter.startsWith('inhal')) return t.includes('inhal') || t.includes('nebuli');
        if (targetTypeFilter.startsWith('oint') || targetTypeFilter.startsWith('gel') || targetTypeFilter.startsWith('cream')) {
          return t.includes('oint') || t.includes('gel') || t.includes('cream');
        }
        return t.includes(targetTypeFilter);
      });
    }

    // Map database fields to unified application shape
    return results.slice(0, limit).map(item => ({
      id: item.id,
      brandName: item.brand_name || item.brandName || '',
      genericName: item.generic_name || item.genericName || '',
      strength: item.strength || '',
      type: item.Type || item.type || 'Tab',
      company: item.company || '',
      source: 'supabase'
    }));
  } catch (err) {
    console.error('Supabase medicine search exception:', err);
    return [];
  }
}

/**
 * Fetch a single prescription by ID or rxId for public patient download / QR viewing
 */
export async function fetchSinglePrescriptionForPublic(prescriptionIdOrRxId) {
  if (!prescriptionIdOrRxId) return null;
  const cleanId = String(prescriptionIdOrRxId).trim();

  try {
    // 1. Try finding by id
    const { data: byId, error: err1 } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', cleanId)
      .maybeSingle();

    if (byId && byId.full_data) {
      return {
        ...byId.full_data,
        id: byId.id,
        date: byId.date,
        diagnosis: byId.diagnosis,
        nextVisit: byId.next_visit,
        patientName: byId.patient_name
      };
    }

    // 2. Try finding by rx_id
    const { data: byRx, error: err2 } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('rx_id', cleanId)
      .maybeSingle();

    if (byRx && byRx.full_data) {
      return {
        ...byRx.full_data,
        id: byRx.id,
        date: byRx.date,
        diagnosis: byRx.diagnosis,
        nextVisit: byRx.next_visit,
        patientName: byRx.patient_name
      };
    }

    // 3. Fallback check local storage if offline or running in same chamber
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('amar_rx_records')) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const found = list.find(r => 
              String(r.id) === cleanId || 
              String(r.patient?.rxId) === cleanId ||
              String(r.rxId) === cleanId
            );
            if (found) return found;
          }
        }
      } catch (e) {}
    }

    return null;
  } catch (err) {
    console.error('Fetch single prescription public error:', err);
    return null;
  }
}

/**
 * Fetch all prescriptions for the logged-in doctor from Supabase cloud
 * Separate account data by doctorPhone / doctorId
 */
export async function fetchPrescriptionsFromCloud(doctorPhone = null) {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch prescriptions error:', error);
      return null;
    }

    const allRecords = (data || []).map(row => ({
      ...row.full_data,
      id: row.id,
      date: row.date,
      diagnosis: row.diagnosis,
      nextVisit: row.next_visit,
      syncedWithCloud: true
    }));

    // If doctorPhone is specified, filter only this doctor's prescriptions
    if (doctorPhone) {
      const cleanDoctorPhone = String(doctorPhone).trim().replace(/\s+/g, '');
      return allRecords.filter(r => {
        const recPhone = r.doctorPhone || r.doctor_phone || r.doctor?.phone;
        return recPhone ? String(recPhone).trim().replace(/\s+/g, '') === cleanDoctorPhone : true;
      });
    }

    return allRecords;
  } catch (err) {
    console.error('Failed to fetch prescriptions from Supabase:', err);
    return null;
  }
}

/**
 * Save / Upsert a single prescription to Supabase cloud
 * Tags record with doctor's phone/id to keep doctor data separate
 */
export async function savePrescriptionToCloud(record, doctorPhone = null) {
  if (!record || !record.id) return false;

  const recordWithDoctor = {
    ...record,
    doctorPhone: doctorPhone || record.doctorPhone || record.doctor?.phone || null
  };

  try {
    const payload = {
      id: String(record.id),
      date: record.date || new Date().toISOString().split('T')[0],
      rx_id: record.patient?.rxId || record.rxId || null,
      patient_name: record.patient?.name || null,
      patient_age: record.patient?.age ? `${record.patient.age} ${record.patient.ageUnit || 'Y'}` : null,
      patient_gender: record.patient?.gender || null,
      diagnosis: record.diagnosis || null,
      next_visit: record.nextVisit || null,
      full_data: recordWithDoctor
    };

    const { error } = await supabase
      .from('prescriptions')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save prescription error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save prescription to Supabase:', err);
    return false;
  }
}

/**
 * Delete a prescription from Supabase cloud
 */
export async function deletePrescriptionFromCloud(recordId) {
  if (!recordId) return false;
  try {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', String(recordId));

    if (error) {
      console.warn('Supabase delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete prescription from Supabase:', err);
    return false;
  }
}

// Local storage fallback key for doctor accounts
const LOCAL_USERS_KEY = 'amar_rx_registered_doctors';

export function getLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

// Valid columns in Supabase 'doctor_users' table
const DB_USER_COLUMNS = new Set([
  'id',
  'phone',
  'full_name',
  'degrees',
  'specialty',
  'bmdc_reg',
  'password_hash',
  'status',
  'valid_until',
  'created_at'
]);

function filterDbUserFields(dataObj) {
  const clean = {};
  for (const [key, val] of Object.entries(dataObj || {})) {
    if (DB_USER_COLUMNS.has(key) && val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Register Doctor (Supabase + Local fallback)
 */
export async function registerDoctorOnline({ fullName, phone, password, degrees = '', specialty = '', bmdcReg = '' }) {
  if (!phone || !password) {
    return { success: false, error: 'ফোন নম্বর এবং পাসওয়ার্ড আবশ্যক।' };
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const userId = 'doc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  // Default validity: 30 days from creation
  const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const payload = {
    id: userId,
    phone: cleanPhone,
    full_name: fullName ? fullName.trim() : 'Dr. User',
    degrees: degrees.trim(),
    specialty: specialty.trim(),
    bmdc_reg: bmdcReg.trim(),
    password_hash: password,
    status: 'pending', // 'pending' | 'approved' | 'rejected' | 'suspended'
    valid_until: defaultValidUntil,
    created_at: new Date().toISOString()
  };

  // 1. Try Supabase cloud insert first
  let supabaseSuccess = false;
  try {
    const dbPayload = filterDbUserFields(payload);
    const { data, error } = await supabase
      .from('doctor_users')
      .insert([dbPayload])
      .select();

    if (!error && data && data.length > 0) {
      supabaseSuccess = true;
    } else if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return { success: false, error: 'এই ফোন নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' };
      }
      console.error('Supabase registration insert error:', error);
    }
  } catch (e) {
    console.error('Supabase registration exception:', e);
  }

  // 2. Always persist to localStorage mirror (for offline and fast UI sync)
  const localList = getLocalUsers();
  const existingLocal = localList.find(u => u.phone === cleanPhone);
  if (existingLocal) {
    return { success: false, error: 'এই ফোন নম্বর দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে।' };
  }
  localList.unshift(payload);
  saveLocalUsers(localList);

  return { 
    success: true, 
    data: payload,
    syncedCloud: supabaseSuccess
  };
}

/**
 * Login Doctor (Checks Supabase, fallback to localStorage)
 */
export async function loginDoctorOnline(phone, password) {
  if (!phone || !password) {
    return { success: false, error: 'ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন।' };
  }

  // 0. Check Master Admin Credentials
  if (isMasterAdmin(phone, password)) {
    return {
      success: true,
      isAdmin: true,
      doctor: {
        id: 'admin_master',
        full_name: 'System Super Admin',
        phone: phone.trim(),
        role: 'admin',
        specialty: 'System Administrator'
      }
    };
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');

  // 1. Try Supabase cloud first
  try {
    const { data, error } = await supabase
      .from('doctor_users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (!error && data) {
      if (data.password_hash !== password) {
        return { success: false, error: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।' };
      }

      if (data.status === 'pending') {
        return { 
          success: false, 
          isPending: true, 
          doctor: data,
          error: 'আপনার অ্যাকাউন্টটি এডমিন অনুমোদনের অপেক্ষায় রয়েছে (Pending for Admin Approval)। অনুমোদন পাওয়ার পর প্রবেশ করতে পারবেন।' 
        };
      }

      if (data.status === 'rejected') {
        return { 
          success: false, 
          isRejected: true,
          error: 'আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন।' 
        };
      }

      if (data.status === 'suspended') {
        return { 
          success: false, 
          error: 'আপনার অ্যাকাউন্টের কার্যকারিতা সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।' 
        };
      }

      // Check validity date
      if (data.valid_until) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (data.valid_until < todayStr) {
          return {
            success: false,
            error: `আপনার অ্যাকাউন্টের মেয়াদের তারিখ (${data.valid_until}) শেষ হয়েছে। মেয়াদ নবায়ন করতে এডমিনের সাথে যোগাযোগ করুন।`
          };
        }
      }

      return { success: true, doctor: data };
    }
  } catch (err) {}

  // 2. Fallback to LocalStorage users
  const localList = getLocalUsers();
  const user = localList.find(u => u.phone === cleanPhone);

  if (!user) {
    return { success: false, error: 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে রেজিস্টার করুন।' };
  }

  if (user.password_hash !== password) {
    return { success: false, error: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }

  if (user.status === 'pending') {
    return { 
      success: false, 
      isPending: true, 
      doctor: user,
      error: 'আপনার অ্যাকাউন্টটি এডমিন অনুমোদনের অপেক্ষায় রয়েছে (Pending for Admin Approval)। অনুমোদন পাওয়ার পর প্রবেশ করতে পারবেন।' 
    };
  }

  if (user.status === 'rejected') {
    return { 
      success: false, 
      isRejected: true,
      error: 'আপনার আবেদনটি বাতিল করা হয়েছে।' 
    };
  }

  if (user.status === 'suspended') {
    return { 
      success: false, 
      error: 'আপনার অ্যাকাউন্টের কার্যকারিতা সাময়িকভাবে স্থগিত করা হয়েছে।' 
    };
  }

  // Check validity date
  if (user.valid_until) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (user.valid_until < todayStr) {
      return {
        success: false,
        error: `আপনার অ্যাকাউন্টের মেয়াদের তারিখ (${user.valid_until}) শেষ হয়েছে। মেয়াদ নবায়ন করতে এডমিনের সাথে যোগাযোগ করুন।`
      };
    }
  }

  return { success: true, doctor: user };
}

/**
 * Admin Panel Functions:
 * Fetch all doctors, Update doctor information (name, degree, specialty, bmdc, password, etc),
 * Watermark control, Validity time setting, Status changes, and Delete
 */
export async function adminFetchAllUsers() {
  let cloudUsers = [];
  try {
    const { data, error } = await supabase
      .from('doctor_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      cloudUsers = data;
    }
  } catch (e) {}

  const localUsers = getLocalUsers();

  const map = new Map();
  cloudUsers.forEach(u => map.set(u.phone, u));
  localUsers.forEach(u => {
    if (!map.has(u.phone)) {
      map.set(u.phone, u);
    }
  });

  return Array.from(map.values());
}

export async function adminUpdateUserFullDetails(userId, phone, updatedFields) {
  // Update in localStorage
  const localList = getLocalUsers();
  const idx = localList.findIndex(u => u.id === userId || u.phone === phone);
  if (idx >= 0) {
    localList[idx] = { ...localList[idx], ...updatedFields };
    saveLocalUsers(localList);
  }

  // Update in Supabase cloud (only passing columns that exist in the database schema)
  try {
    const dbFields = filterDbUserFields(updatedFields);
    if (Object.keys(dbFields).length > 0) {
      const { error } = await supabase
        .from('doctor_users')
        .update(dbFields)
        .eq('phone', phone);
      
      if (error) {
        console.error('Supabase admin update error:', error);
      }
    }
  } catch (e) {
    console.error('Supabase admin update exception:', e);
  }

  return true;
}

export async function adminUpdateUserStatus(userId, phone, newStatus, newValidUntil = null, hasWatermark = null) {
  const updateData = { status: newStatus };
  if (newValidUntil) updateData.valid_until = newValidUntil;
  if (hasWatermark !== null) updateData.has_watermark = hasWatermark;

  return adminUpdateUserFullDetails(userId, phone, updateData);
}

export async function updateUserPassword(phone, currentPassword, newPassword) {
  if (!phone || !currentPassword || !newPassword) {
    return { success: false, error: 'সবগুলো ঘর পূরণ করুন।' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');

  // 1. Verify in Supabase or local
  try {
    const { data, error } = await supabase
      .from('doctor_users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (!error && data) {
      if (data.password_hash !== currentPassword) {
        return { success: false, error: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।' };
      }

      const { error: updateErr } = await supabase
        .from('doctor_users')
        .update({ password_hash: newPassword })
        .eq('phone', cleanPhone);

      if (updateErr) {
        return { success: false, error: updateErr.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
      }
    }
  } catch (e) {}

  // 2. Also update local storage users mirror
  const localList = getLocalUsers();
  const idx = localList.findIndex(u => u.phone === cleanPhone);
  if (idx >= 0) {
    if (localList[idx].password_hash !== currentPassword) {
      return { success: false, error: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।' };
    }
    localList[idx].password_hash = newPassword;
    saveLocalUsers(localList);
  }

  return { success: true };
}

export async function adminDeleteUser(userId, phone) {
  // Delete from localStorage
  const localList = getLocalUsers().filter(u => u.id !== userId && u.phone !== phone);
  saveLocalUsers(localList);

  // Delete from Supabase cloud
  try {
    await supabase
      .from('doctor_users')
      .delete()
      .eq('phone', phone);
  } catch (e) {}

  return true;
}

/**
 * Admin: Directly create a new doctor user from Admin Panel
 */
export async function adminCreateUser({ fullName, phone, password, degrees = '', specialty = '', bmdcReg = '', status = 'approved', validityDays = 30 }) {
  if (!phone || !password) {
    return { success: false, error: 'ফোন নম্বর এবং পাসওয়ার্ড আবশ্যক।' };
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const userId = 'doc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const validUntil = new Date(Date.now() + (Number(validityDays) || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const payload = {
    id: userId,
    phone: cleanPhone,
    full_name: (fullName || 'Dr. User').trim(),
    degrees: (degrees || '').trim(),
    specialty: (specialty || '').trim(),
    bmdc_reg: (bmdcReg || '').trim(),
    password_hash: password.trim(),
    status: status || 'approved',
    valid_until: validUntil,
    created_at: new Date().toISOString()
  };

  // 1. Try Supabase cloud insert
  try {
    const dbPayload = filterDbUserFields(payload);
    const { data, error } = await supabase
      .from('doctor_users')
      .insert([dbPayload])
      .select();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return { success: false, error: 'এই ফোন নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' };
      }
      console.error('Supabase admin create error:', error);
    }
  } catch (e) {
    console.error('Supabase admin create exception:', e);
  }

  // 2. Persist in LocalStorage
  const localList = getLocalUsers();
  const existingIdx = localList.findIndex(u => u.phone === cleanPhone);
  if (existingIdx >= 0) {
    localList[existingIdx] = { ...localList[existingIdx], ...payload };
  } else {
    localList.unshift(payload);
  }
  saveLocalUsers(localList);

  return { success: true, data: payload };
}
