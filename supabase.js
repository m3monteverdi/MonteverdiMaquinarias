// =============================================
//  MONTEVERDI MAQUINARIAS — Supabase Client Init
// =============================================

const SB_URL = 'https://zuygdarjqyolybqocvkb.supabase.co';
const SB_KEY = 'sb_publishable_iOZBV1N4NwObXbf3AJfwSg_tdLX1FQL';

// Inicializar cliente de Supabase
const sb = supabase.createClient(SB_URL, SB_KEY);
console.log('Supabase configurado correctamente para Monteverdi Maquinarias.');
