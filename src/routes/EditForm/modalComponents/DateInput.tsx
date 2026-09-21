export type DateInputSchema = {
    field: string;
    label: string;
    type: "DateInput";
}
type DateInputProps = {
  schema: DateInputSchema; // the schema for the settings
  state: Record<string, any>; // the state reference
  onChange: (field: string, newValue: any) => void; // callback hen the user changes a setting
};

export function DateInput({ schema, state, onChange }: DateInputProps) {
    return (
        <label>
            {schema.label}
            <input
                type="date"
                value={state[schema.field] || ""}
                onChange={(e) =>
                    onChange(schema.field, e.target.value)
                }
            />
        </label>
    )
}