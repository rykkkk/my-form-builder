import type { FormSettings, FormPage } from "../formRendering/Constants";

export interface FormExportSchema {
  schemaVersion: number;
  exportedAt: string;
  form: {
    settings: FormSettings;
    pages: FormPage[];
  };
}

export const blankFormExportSchema: FormExportSchema = {
  schemaVersion: 1,
  exportedAt: "",
  form: {
    settings: {} as FormSettings,
    pages: [],
  },
};
