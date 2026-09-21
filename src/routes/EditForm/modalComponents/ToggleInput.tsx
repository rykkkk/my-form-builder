export type ToggleInputSchema = {
    field: string;
    label: string;
    type: "ToggleInput";
}
type ToggleInputProps = {
  schema: ToggleInputSchema; // the schema for the settings
  state: Record<string, any>; // the state reference
  onChange: (field: string, newValue: any) => void; // callback hen the user changes a setting
};

export function ToggleInput({ schema, state, onChange }: ToggleInputProps) {
    return (<>
        {schema.label}
        <input
            type="checkbox"
            checked={state[schema.field]}
            onChange={(e) =>
                onChange(schema.field, e.target.checked)
            }
        />
    </>)
}