/**
 * Safe API client utilities to guard against HTML error pages,
 * server warm-up responses, and unparseable JSON.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    // Always read as text first to safely inspect content
    const text = await res.text();

    // Check if the response is actually JSON
    if (!contentType.includes('application/json')) {
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      const snippet = cleanText.length > 80 ? cleanText.slice(0, 80) + '...' : cleanText;
      return {
        ok: false,
        status: res.status,
        error: !res.ok
          ? (snippet || `Server error (${res.status})`)
          : 'Service is temporarily initializing. Please try again in a moment.',
      };
    }

    try {
      const parsed = JSON.parse(text) as T;
      if (!res.ok) {
        const errorMsg =
          (parsed as any)?.error ||
          (parsed as any)?.message ||
          `Request failed with status ${res.status}`;
        return {
          ok: false,
          status: res.status,
          data: parsed,
          error: errorMsg,
        };
      }
      return {
        ok: true,
        status: res.status,
        data: parsed,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        error: 'Invalid response format received from server.',
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Unable to connect to service. Please check your network connection.',
    };
  }
}
