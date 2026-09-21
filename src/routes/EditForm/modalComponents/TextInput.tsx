export type TextInputSchema = {
    field: string;
    label: string;
    type: "TextInput";
}
type TextInputProps = {
  schema: TextInputSchema; // the schema for the settings
  state: Record<string, any>; // the state reference
  onChange: (field: string, newValue: any) => void; // callback hen the user changes a setting
};

export function TextInput({ schema, state, onChange }: TextInputProps) {
    return (
        <label>
            {schema.label}
            <input
                type="text"
                value={state[schema.field]}
                onChange={(e) =>
                    onChange(schema.field, e.target.value)
                }
            />
        </label>
    )
}