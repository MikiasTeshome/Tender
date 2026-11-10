'use client';

import { useCallback } from 'react';

export function useApi(accessToken) {
  return useCallback(async (path, options = {}) => {
    const {data, binary, ...init} = options;
    const headers = new Headers(init.headers);
    if (accessToken) headers.set('Authorization', 'Bearer ' + accessToken);
    if (data && !(data instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch('/api/' + path, {
      ...init,
      headers,
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error((await response.json().catch(() => ({}))).error ?? 'Request failed.');
    }
    return binary ? response.blob() : response.json();
  }, [accessToken]);
}
