export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic';
  token?: string;
  username?: string;
  password?: string;
}

export interface BodyConfig {
  type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded';
  raw?: string;
  formData?: KeyValueItem[]; // For multipart
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueItem[];
  headers: KeyValueItem[];
  auth: AuthConfig;
  body: BodyConfig;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  size: number; // bytes
  time: number; // ms
  timestamp: number;
  error?: string;
}

export interface Collection {
  id: string;
  name: string;
  requests: ApiRequest[];
  folders?: Collection[]; // Nested folders not fully implemented in this MVP, but structure allows it
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValueItem[];
}

// Helper types for UI
export type Tab = 'params' | 'headers' | 'auth' | 'body';
export type ResponseTab = 'body' | 'headers' | 'preview';