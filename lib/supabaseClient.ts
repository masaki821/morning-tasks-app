import { createClient } from "@supabase/supabase-js";

// 本来は .env.local から読むべきだけど、
// 環境変数まわりでハマっているので、
// まずは「確実に動く」ように直書きでセットする。
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://dyfoomxcqwuzutqhuxym.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Zm9vbXhjcXd1enV0cWh1eHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzQ0NDksImV4cCI6MjA3ODY1MDQ0OX0.1EtPuGCE2J-Hrm3OAiBm59CBlcqKit2Ghq4Oj-I6yuc";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or anon key is missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
