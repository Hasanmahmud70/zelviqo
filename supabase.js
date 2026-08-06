// ================================================================
// ZELVIQO - SUPABASE CONFIGURATION
// ================================================================

const SUPABASE_URL = "https://xllyqmzcqgwbstduevm.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_w0oIenK-GWtiTvuC3XJcVQ_lG0Y-fPk";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("ZELVIQO Supabase connected");
