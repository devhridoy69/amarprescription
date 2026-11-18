import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvxhqoigwodhfuetjkay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7YSDaB3i3DTb3RzI4xULbQ_983WvEm3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Master Admin Credentials: Entering these into regular login directly opens Admin Panel
export const MASTER_ADMIN_CREDENTIALS = {
  phone: '01780960370', // Ayan Tech Official Phone
  password: 'admin'       // Secret admin key (also supports 'admin123' & 'ayan7809')
};

export function isMasterAdmin(phone, password) {
  const cleanPhone = (phone || '').trim().replace(/\s+/g, '');
  const pass = (password || '').trim();
  return (
    (cleanPhone === '01780960370' || cleanPhone === 'admin' || cleanPhone === '01700000000') &&
    (pass === 'admin' || pass === 'admin123' || pass === 'ayan7809')
  );
}

/**
 * Search medicines from Supabase 'Medicine_Database'
 */
export async function searchMedicinesOnline(query, limit = 20) {
  if (!query || query.trim().length < 1) return [];

  const cleanQuery = query.trim();

  try {
    const { data: brandMatches, error: brandError } = await supabase
      .from('Medicine_Database')
      .select('id, Type, brand_name, strength, generic_name, company')
      .ilike('brand_name', `${cleanQuery}%`)
      .limit(limit);

    if (brandError) {
      console.warn('Supabase brand search error:', brandError);
    }

    let results = brandMatches || [];

    if (results.length < limit) {
      const remainingLimit = limit - results.length;
      const existingIds = new Set(results.map(r => r.id));

      const { data: genericMatches } = await supabase
        .from('Medicine_Database')
        .select('id, Type, brand_name, strength, generic_name, company')
        .or(`generic_name.ilike.%${cleanQuery}%,brand_name.ilike.%${cleanQuery}%`)
        .limit(remainingLimit * 2);

      if (genericMatches) {
        for (const item of genericMatches) {
          if (!existingIds.has(item.id)) {
            existingIds.add(item.id);
            results.push(item);
            if (results.length >= limit) break;
          }
        }
      }
    }

    return results;
  } catch (err) {
    console.error('Supabase medicine search exception:', err);
    return [];
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
    workplace: '',
    chamber_name: '',
    chamber_address: '',
    visiting_hours: '',
    appointment_phone: '',
    password_hash: password,
    status: 'pending', // 'pending' | 'approved' | 'rejected' | 'suspended'
    valid_until: defaultValidUntil,
    has_watermark: true, // Controlled exclusively by Admin: true = watermark shown, false = removed
    created_at: new Date().toISOString()
  };

  // 1. Try Supabase
  let supabaseSuccess = false;
  try {
    const { data, error } = await supabase
      .from('doctor_users')
      .insert([payload])
      .select();

    if (!error) {
      supabaseSuccess = true;
    } else if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return { success: false, error: 'এই ফোন নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' };
    }
  } catch (e) {}

  // 2. Always persist to localStorage mirror
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

  // Update in Supabase cloud
  try {
    await supabase
      .from('doctor_users')
      .update(updatedFields)
      .eq('phone', phone);
  } catch (e) {}

  return true;
}

export async function adminUpdateUserStatus(userId, phone, newStatus, newValidUntil = null, hasWatermark = null) {
  const updateData = { status: newStatus };
  if (newValidUntil) updateData.valid_until = newValidUntil;
  if (hasWatermark !== null) updateData.has_watermark = hasWatermark;

  return adminUpdateUserFullDetails(userId, phone, updateData);
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
