// Import/Export types

export interface ExportFormat {
  format: 'json' | 'csv';
}

export interface ExportResponse {
  data: string;
  format: string;
  count: number;
}

export interface ImportData {
  data: string;
  format: 'json' | 'csv';
  master_password?: string;
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  errors: string[];
}
