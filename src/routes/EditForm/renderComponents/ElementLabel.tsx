export type LabelSchema = {
    useRichText?: boolean,
    text?: string,
}

export default function ElementLabel({
    useRichText = false,
    text = "Lorem ipsum"
}: LabelSchema) {
    return (
        <div style = {{
            width: "100%",
            backgroundColor: "gray",
            marginBottom: "1rem",
        }}>
            {text}
        </div>
    )
}