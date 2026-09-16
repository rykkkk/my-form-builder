import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type DragContainerProps = {
    id: string;
    children: ReactNode;
};

export default function DragContainer({
    id,
    children,
}: DragContainerProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                position: "relative",
            }}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                type = "button"
                style = {{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    cursor: "grab",
                }}
            >
                ⋮⋮
            </button>

            {/* Actual component */}
            {children}
        </div>
    );
}