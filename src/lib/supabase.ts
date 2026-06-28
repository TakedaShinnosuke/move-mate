import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase の環境変数が設定されていません。\n" +
      ".env.example を参考に .env を作成し、EXPO_PUBLIC_SUPABASE_URL と " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください。"
  );
}

// TODO: DB スキーマ確定後に `npx supabase gen types typescript` で型を生成し、
//       createClient<Database> の型引数として渡す。
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
