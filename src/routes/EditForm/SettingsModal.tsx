import { modalComponentRegistry, SettingSchema, SettingField } from "./modalComponents/modalComponentRegistry";

type SettingsModalProps = {
  open: boolean; // is the modal open?
  schema: SettingSchema; // the schema for the settings
  state: Record<string, any>; // the state reference
  onChange: (field: string, newValue: any) => void; // callback hen the user changes a setting
  onClose: () => void; // callback when the settings close
};

function SettingElement({
  schema,
  state,
  onChange,
}: {
  schema: SettingField & any;
  state: Record<string, any>;
  onChange: (field: string, newValue: any) => void;
}) {
  const Component = modalComponentRegistry[schema.type];

  return (
    <Component
      schema={schema}
      state={state}
      onChange={onChange}
    />
  );
}

export function SettingsModal({
  open,
  schema,
  state,
  onChange,
  onClose,
}: SettingsModalProps) {
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

        {schema.map((elementSchema, idx) => {
            console.log(elementSchema)
            return (
                <div key={idx}>
                    <SettingElement schema={elementSchema} onChange={onChange} state={state} />
                </div>
            )
        })}

        <button onClick={onClose}>Close</button>
    </dialog>
  );
}