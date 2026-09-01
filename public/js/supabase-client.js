// ==========================================================================
// GiraBrasil — Cliente Supabase (usado nas telas de login/cadastro por enquanto)
// ==========================================================================

const SUPABASE_URL = 'https://tybkeihuwpelsmfdmzhj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LpIRhyUfQIl14Ud8vHcoSw_nfTLveAZ';

// `supabase` global vem do script do CDN carregado antes deste arquivo
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
