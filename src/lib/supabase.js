import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvxhqoigwodhfuetjkay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7YSDaB3i3DTb3RzI4xULbQ_983WvEm3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Search medicines from Supabase 'Medicine_Database'
 * Returns matches prioritizing prefix matching on brand_name, then generic_name
 */
export async function searchMedicinesOnline(query, limit = 20) {
  if (!query || query.trim().length < 1) return [];

  const cleanQuery = query.trim();

  try {
    // 1. Try prefix search on brand_name first for ultra-fast, relevant results
    const { data: brandMatches, error: brandError } = await supabase
      .from('Medicine_Database')
      .select('id, Type, brand_name, strength, generic_name, company')
      .ilike('brand_name', `${cleanQuery}%`)
      .limit(limit);

    if (brandError) {
      console.warn('Supabase brand search error:', brandError);
    }

    let results = brandMatches || [];

    // 2. If results are few, also search generic name or contains in brand name
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

    // Map database fields to application shape
    return results.map(item => ({
      id: item.id,
      brandName: item.brand_name || '',
      genericName: item.generic_name || '',
      strength: item.strength || '',
      type: item.Type || 'Tab',
      company: item.company || '',
      source: 'supabase'
    }));
  } catch (err) {
    console.error('Failed to query medicines from Supabase:', err);
    return [];
  }
}

/**
 * Fetch all prescriptions from Supabase cloud
 */
export async function fetchPrescriptionsFromCloud(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase fetch prescriptions error:', error);
      return null;
    }

    return (data || []).map(row => ({
      ...row.full_data,
      id: row.id,
      date: row.date,
      diagnosis: row.diagnosis,
      nextVisit: row.next_visit,
      syncedWithCloud: true
    }));
  } catch (err) {
    console.error('Failed to fetch prescriptions from Supabase:', err);
    return null;
  }
}

/**
 * Save / Upsert a single prescription to Supabase cloud
 */
export async function savePrescriptionToCloud(record) {
  if (!record || !record.id) return false;

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
      full_data: record
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
