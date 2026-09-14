import type { FormSettings, FormPage } from "../formRendering/Constants";

export interface FormExportPayload {
  schemaVersion: number;
  exportedAt: string;
  form: {
    settings: FormSettings;
    pages: FormPage[];
  };
}

export interface SavedFormRecord extends FormSettings {
  pages?: FormPage[];
}

export const createFormExportPayload = (form: FormSettings, pages: FormPage[] = []): FormExportPayload => ({
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  form: {
    settings: form,
    pages,
  },
});

export const parseSavedFormRecord = (record: Partial<SavedFormRecord> | null | undefined): SavedFormRecord | null => {
  if (!record || !record.formId || !record.formName) return null;
  return {
    ...record,
    pages: Array.isArray(record.pages) ? record.pages : [],
  } as SavedFormRecord;
};

export const downloadFormExport = (payload: FormExportPayload, fileName = `${payload.form.settings.formId || "form"}-export.json`) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};
