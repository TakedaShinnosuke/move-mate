import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase の環境変数が設定されていません。\n" +
      ".env.example を参考に .env を作成し、EXPO_PUBLIC_SUPABASE_URL と " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください。"
  );
}

// Database 型は Supabase CLI で自動生成（src/lib/database.types.ts）。
// 再生成コマンド: npx supabase gen types typescript --linked > src/lib/database.types.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
