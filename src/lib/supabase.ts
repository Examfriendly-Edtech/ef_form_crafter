import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE = 'formcraft_supabase_config';

export interface SupabaseSettings {
  url: string;
  anonKey: string;
  schema: string;
  isConnected: boolean;
}

export function getStoredSupabaseConfig(): SupabaseSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        schema: parsed.schema || 'registrations',
        isConnected: Boolean(parsed.isConnected),
      };
    }
  } catch (e) {
    console.error('Failed to parse Supabase config from storage', e);
  }
  return {
    url: '',
    anonKey: '',
    schema: 'registrations',
    isConnected: false,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Supabase config', e);
  }
}

export function getSupabaseClient(customSchema?: string): SupabaseClient<any, any, any> | null {
  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      const targetSchema = customSchema || config.schema || 'registrations';
      return createClient(config.url, config.anonKey, {
        db: {
          schema: targetSchema,
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }) as any;
    } catch (e) {
      console.warn('Could not initialize custom Supabase client', e);
    }
  }
  return null;
}


