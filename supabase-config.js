// ============================================
// Configuration Supabase — CMD.
// ============================================

const SUPABASE_URL = "https://tzzjsorxpmfmoklmvgre.supabase.co";
const SUPABASE_KEY = "sb_publishable_d0OOxgtzghAfkJXpPE6URw_BduJourm";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Récupère le "slug" du vendeur depuis l'URL
// Exemple : moncmd.github.io/index.html?v=victoryfood
// Si aucun paramètre, on utilise "demo"
function getVendeurSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('v') || 'demo';
}
