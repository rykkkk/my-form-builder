import React from "react";

import { TextInput, TextInputSchema } from "./TextInput";
import { ToggleInput, ToggleInputSchema } from "./ToggleInput";
import { DateInput, DateInputSchema } from "./DateInput";

export type SettingField =
  | TextInputSchema
  | ToggleInputSchema
  | DateInputSchema;

export type SettingSchema = SettingField[];

type ElementProps<S extends SettingField> = {
  schema: S;
  state: Record<string, any>;
  onChange: (field: string, newValue: any) => void;
};

type SettingComponent<S extends SettingField> = (
  props: ElementProps<S>
) => React.ReactNode;

type ModalComponentRegistry = {
  [K in SettingField["type"]]: SettingComponent<
    Extract<SettingField, { type: K }>
  >;
};

export const modalComponentRegistry: ModalComponentRegistry = {
  TextInput,
  ToggleInput,
  DateInput,
};

