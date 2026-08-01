export interface SmartKitDocument {
  id: string; // The requirement ID
  documentId: string; // The actual document type ID
  name: string;
  isMandatory: boolean;
  status: 'Validated' | 'Missing';
  file?: File; // Original uploaded file (if uploaded in current session)
  url?: string; // URL to fetch the file (if previously uploaded)
}

export interface SmartKitStats {
  required: number;
  uploaded: number;
  validated: number;
  readiness: number;
}

export interface ProgressCallback {
  (taskName: string, progress: number, currentTaskIndex?: number, totalTasks?: number): void;
}
