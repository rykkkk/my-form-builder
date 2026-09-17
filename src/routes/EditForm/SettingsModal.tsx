export type SettingField<T extends Record<string, any>> = {
  [K in keyof T]: {
    label: string;
    field: K;
  } & (
    | { type: "boolean" }
    | { type: "string" }
    | { type: "number"; min?: number; max?: number }
  );
}[keyof T];
export type SettingSchema<T extends Record<string, any>> = SettingField<T>[];

type SettingsModalProps<fields> = {
  open: boolean; // is the modal open?
  schema: SettingSchema<fields> | null; // the schema for the settings
  state: Record<string, any> | null; // the state reference
  onChange: (field: string, newValue: any) => void; // callback hen the user changes a setting
  onClose: () => void; // callback when the settings close
};

export function SettingsModal({
  open,
  schema,
  state,
  onChange,
  onClose,
}: SettingsModalProps<any>) {
  if (!open) return null;
  if (!schema || !state) return null;

  return (
    <dialog open style = {{
        position: "absolute",
        top: "50vh",
        left: "50vw",
        transform: "translate(-50%, -50%)",
    }}>
        <h2>Settings</h2>

        {schema.map((setting, idx) => {

            // string
            if (setting.type === "string") {
                return (
                    <div key={idx}>
                        <label>
                            {setting.label}
                            <input
                                type="text"
                                value={state[setting.field]}
                                onChange={(e) =>
                                    onChange(setting.field, e.target.value)
                                }
                            />
                        </label>
                    </div>
                );
            }

            // boolean
            if (setting.type === "boolean") {
                return (
                    <label key={idx}>
                        {setting.label}
                        <input
                            type="checkbox"
                            checked={state[setting.field]}
                            onChange={(e) =>
                                onChange(setting.field, e.target.checked)
                            }
                        />
                    </label>
                );
            }
        })}

        <button onClick={onClose}>Close</button>
    </dialog>
  );
}