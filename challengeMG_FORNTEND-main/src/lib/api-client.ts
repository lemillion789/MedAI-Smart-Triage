// API Client - Cliente HTTP configurado para el backend

import type { ApiError } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    let errors: Record<string, string[]> | undefined;

    try {
      const errorData: ApiError = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
      errors = errorData.errors;
    } catch {
      // Si no se puede parsear el error, usar el mensaje por defecto
    }

    throw new ApiClientError(errorMessage, response.status, errors);
  }

  // Si es 204 No Content, retornar objeto vacío
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

export const apiClient = {
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  },

  async postFormData<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "POST",
      // NO incluir Content-Type para FormData, el navegador lo configura automáticamente
      body: formData,
      ...options,
    });

    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  },

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    return handleResponse<T>(response);
  },
};
