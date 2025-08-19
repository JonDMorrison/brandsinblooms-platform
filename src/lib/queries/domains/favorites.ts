import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert } from '@/src/lib/database/types';

export async function getUserFavorites(
  supabase: SupabaseClient<Database>,
  siteId: string
) {
  const { data, error } = await supabase
    .from('product_favorites')
    .select('*, product:products(*)')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function checkIsFavorite(
  supabase: SupabaseClient<Database>,
  productId: string,
  profileId: string,
  siteId: string
) {
  const { data, error } = await supabase
    .from('product_favorites')
    .select('id')
    .eq('product_id', productId)
    .eq('profile_id', profileId)
    .eq('site_id', siteId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return !!data;
}

export async function toggleFavorite(
  supabase: SupabaseClient<Database>,
  productId: string,
  siteId: string,
  profileId: string,
  isFavorite: boolean
) {
  if (isFavorite) {
    const { error } = await supabase
      .from('product_favorites')
      .delete()
      .eq('product_id', productId)
      .eq('profile_id', profileId)
      .eq('site_id', siteId);
    if (error) throw error;
    return false; // Now not a favorite
  } else {
    const { error } = await supabase
      .from('product_favorites')
      .insert({
        product_id: productId,
        site_id: siteId,
        profile_id: profileId
      });
    if (error) throw error;
    return true; // Now is a favorite
  }
}

export async function addFavorite(
  supabase: SupabaseClient<Database>,
  productId: string,
  siteId: string,
  profileId: string
) {
  const { data, error } = await supabase
    .from('product_favorites')
    .insert({
      product_id: productId,
      site_id: siteId,
      profile_id: profileId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFavorite(
  supabase: SupabaseClient<Database>,
  productId: string,
  siteId: string,
  profileId: string
) {
  const { error } = await supabase
    .from('product_favorites')
    .delete()
    .eq('product_id', productId)
    .eq('profile_id', profileId)
    .eq('site_id', siteId);

  if (error) throw error;
}