import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://xllyqmzcqgwbstduevm.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_w0oIenK-GWtiC3XJcVQ_lG0Y-fPk";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("ZELVIQO Supabase connected");
