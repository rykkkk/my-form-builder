import { useEffect, useState } from "react"

export type LabelSchema = {
    useRichText?: boolean,
    text?: string,
}

type ElementLabelProps = LabelSchema & {
  state: Record<string, any>;
};

export default function ElementLabel({
  useRichText: initialUseRichText,
  text: initialText,
  state,
}: ElementLabelProps) {
    const [useRichText, setUseRichText] = useState(initialUseRichText ?? false)
    const [text, setText] = useState(initialText ?? "Lorem Ipsum")

    useEffect(() => {
        state.useRichText = useRichText
        state.text = useRichText
    }, [useRichText, text, state])

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