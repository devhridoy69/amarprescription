import { openDB } from 'idb';
import { supabase } from './supabase';

const DB_NAME = 'amar_rx_offline_db';
const DB_VERSION = 1;
const STORE_MEDICINES = 'cached_medicines';
const STORE_METADATA = 'metadata';
const STORE_PENDING_RX = 'pending_prescriptions';

/**
 * Initialize / open IndexedDB database
 */
export async function getOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_MEDICINES)) {
        const store = db.createObjectStore(STORE_MEDICINES, { keyPath: 'id' });
        store.createIndex('brandName', 'brandName', { unique: false });
        store.createIndex('genericName', 'genericName', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA);
      }
      if (!db.objectStoreNames.contains(STORE_PENDING_RX)) {
        db.createObjectStore(STORE_PENDING_RX, { keyPath: 'id' });
      }
    }
  });
}

/**
 * Downloads all 21k medicines from Supabase in background chunks and saves to IndexedDB
 */
export async function downloadMedicinesForOffline(onProgress = null) {
  if (typeof window === 'undefined') return;

  try {
    const db = await getOfflineDB();
    const lastSync = await db.get(STORE_METADATA, 'medicines_last_sync');
    const existingCount = await db.count(STORE_MEDICINES);

    // If already downloaded and recent (< 7 days), skip re-download
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (existingCount > 15000 && lastSync && (Date.now() - lastSync < sevenDaysMs)) {
      if (onProgress) onProgress({ status: 'ready', count: existingCount });
      return;
    }

    if (onProgress) onProgress({ status: 'downloading', count: existingCount });

    // Download in chunks of 1000
    const chunkSize = 1000;
    let offset = 0;
    let totalFetched = 0;

    while (true) {
      const { data, error } = await supabase
        .from('Medicine_Database')
        .select('id, Type, brand_name, strength, generic_name, company')
        .range(offset, offset + chunkSize - 1);

      if (error || !data || data.length === 0) {
        break;
      }

      const tx = db.transaction(STORE_MEDICINES, 'readwrite');
      for (const item of data) {
        await tx.store.put({
          id: item.id,
          brandName: item.brand_name || '',
          genericName: item.generic_name || '',
          strength: item.strength || '',
          type: item.Type || 'Tab',
          company: item.company || '',
          source: 'indexeddb'
        });
      }
      await tx.done;

      totalFetched += data.length;
      offset += chunkSize;

      if (onProgress) {
        onProgress({ status: 'downloading', count: totalFetched, offset });
      }

      if (data.length < chunkSize) break;
    }

    await db.put(STORE_METADATA, Date.now(), 'medicines_last_sync');
    if (onProgress) onProgress({ status: 'completed', count: totalFetched });
  } catch (err) {
    console.warn('Offline medicine cache notice:', err);
    if (onProgress) onProgress({ status: 'error', error: err });
  }
}

/**
 * Instant local search from IndexedDB (Works 100% Offline with 0ms latency)
 */
export async function searchMedicinesOffline(query, limit = 25) {
  if (!query || query.trim().length < 1) return [];

  try {
    const db = await getOfflineDB();
    const clean = query.trim().toLowerCase();
    const parts = clean.split(/\s+/).filter(Boolean);

    // Dosage type synonyms
    const typeKeywords = [
      'drop', 'drops', 'syp', 'syrup', 'susp', 'suspension',
      'tab', 'tablet', 'cap', 'capsule', 'inj', 'injection',
      'inhaler', 'gel', 'ointment', 'oint', 'suppository', 'cream', 'sachet'
    ];

    let targetTypeFilter = null;
    let textTokens = [];

    for (const part of parts) {
      if (!targetTypeFilter && typeKeywords.includes(part)) {
        targetTypeFilter = part;
      } else {
        textTokens.push(part);
      }
    }

    const brandQuery = textTokens.length > 0 ? textTokens.join(' ') : clean;

    let matches = [];
    const lowerQuery = brandQuery.toLowerCase();

    // Use fast index lookup or cursor if available, otherwise filter memory cache
    try {
      const all = await db.getAll(STORE_MEDICINES);
      if (all && all.length > 0) {
        matches = all.filter(m => {
          const b = (m.brandName || '').toLowerCase();
          const g = (m.genericName || '').toLowerCase();
          return b.includes(lowerQuery) || g.includes(lowerQuery);
        });
      }
    } catch (dbErr) {
      console.warn('IndexedDB read warning:', dbErr);
    }

    // Always fallback to embedded COMMON_MEDICINES if matches are few or DB is empty
    if (matches.length < limit) {
      const existingNames = new Set(matches.map(m => (m.brandName || '').toLowerCase() + (m.strength || '')));
      try {
        const { COMMON_MEDICINES } = await import('../data/medicinesData');
        const fallbackMatches = (COMMON_MEDICINES || []).filter(item => {
          if (!item) return false;
          const b = (item.brandName || '').toLowerCase();
          const g = (item.genericName || '').toLowerCase();
          const matchesTerm = b.includes(lowerQuery) || g.includes(lowerQuery);
          return matchesTerm && !existingNames.has(b + (item.strength || ''));
        });
        matches = [...matches, ...fallbackMatches];
      } catch (e) {}
    }

    if (matches.length === 0) return [];

    if (targetTypeFilter) {
      matches = matches.filter(item => {
        const t = (item.type || '').toLowerCase();
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

    // Sort: items starting with brandQuery first
    matches.sort((a, b) => {
      const aStarts = (a.brandName || '').toLowerCase().startsWith(brandQuery);
      const bStarts = (b.brandName || '').toLowerCase().startsWith(brandQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    return matches.slice(0, limit);
  } catch (e) {
    console.error('searchMedicinesOffline error:', e);
    return [];
  }
}

/**
 * Add prescription to pending offline queue
 */
export async function queuePendingPrescription(record, doctorPhone = null) {
  try {
    const db = await getOfflineDB();
    await db.put(STORE_PENDING_RX, {
      ...record,
      doctorPhone,
      queuedAt: Date.now()
    });
  } catch (e) {
    console.error('Queue pending prescription error:', e);
  }
}

/**
 * Get count of pending unsynced prescriptions
 */
export async function getPendingPrescriptionsCount() {
  try {
    const db = await getOfflineDB();
    return await db.count(STORE_PENDING_RX);
  } catch (e) {
    return 0;
  }
}

/**
 * Synchronize all pending offline prescriptions with Supabase cloud when back online
 */
export async function syncPendingPrescriptionsToCloud() {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;

  try {
    const db = await getOfflineDB();
    const pendingList = await db.getAll(STORE_PENDING_RX);
    if (!pendingList || pendingList.length === 0) return 0;

    let syncedCount = 0;
    for (const record of pendingList) {
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

      if (!error) {
        await db.delete(STORE_PENDING_RX, record.id);
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      window.dispatchEvent(new CustomEvent('rx_offline_synced', { detail: { count: syncedCount } }));
    }

    return syncedCount;
  } catch (err) {
    console.warn('Sync pending prescriptions error:', err);
    return 0;
  }
}
