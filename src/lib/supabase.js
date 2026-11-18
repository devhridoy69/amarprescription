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
