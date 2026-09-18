import { SettingSchema } from "../SettingsModal"

export type ElementLabelSchema = {
    useRichText: boolean,
    text: string,
}
export const ElementLabelDefaultSchema: ElementLabelSchema = {
    useRichText: true,
    text: "LoremIpsum",
}
export const ElementLabelSettingSchema: SettingSchema<ElementLabelSchema> = [
    {
        label: "Rich Text",
        field: "useRichText",
        type: "boolean",
    },
    {
        label: "Text",
        field: "text",
        type: "string",
    },
]

export function ElementLabel({ state }: { state: ElementLabelSchema }) {
    return (
        <div
            style={{
                width: "100%",
                backgroundColor: "gray",
                marginBottom: "1rem",
            }}
        >
            {state.useRichText ? (
                <div dangerouslySetInnerHTML={{ __html: state.text }} />
            ) : (
                state.text
            )}
        </div>
    )
}