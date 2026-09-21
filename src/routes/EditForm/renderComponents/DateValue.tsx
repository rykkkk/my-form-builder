import { SettingSchema } from "../modalComponents/modalComponentRegistry"

export type DateValueSchema = {
    date: string,
}
export const DateValueDefaultSchema: DateValueSchema = {
    date: "",
}

export const DateValueSettingSchema: SettingSchema = [
    {
        label: "Date",
        field: "date",
        type: "DateInput",
    },
]

export function DateValue({ state }: { state: DateValueSchema }) {
    return (
        <div
            style={{
                width: "120px",
                height: "40px",
                backgroundColor: "gray",
                border: "1px solid #7c7c7c",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
            }}
        >
            {state.date == "" ? "yyyy-mm-dd" : state.date}
        </div>
    )
}