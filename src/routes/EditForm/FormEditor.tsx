import { useState, useEffect } from "react"
import ElementLabel from "./renderComponents/ElementLabel"
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import DragContainer from "./DragContainer"

const componentRegistry = {
    "ElementLabel": ElementLabel
}

type Node = {
    id: string;
    nodeType: keyof typeof componentRegistry;
    props: any;
}

// renders an element depending on the node
function RenderNode({ node }: { node: Node }) {
  const Component = componentRegistry[node.nodeType];

  return <Component {...node.props} />;
}

export function FormEditor() {
    // TODO: once the layout is complete, loading data shouldn't be too difficult if the schemas are right
    // data will be retrieved here. the link will specify where the data comes from (e.g., formbuilder.ca/someform)
    // will load the form "someform"
    // reloading the page will prompt the user to save or discard changes (or it can just autosave)

    const [layout, setLayout] = useState<Node[]>([])

    useEffect(() => {
        setLayout([
            {
                id: "0",
                nodeType: "ElementLabel",
                props: {},
            },
            {
                id: "1",
                nodeType: "ElementLabel",
                props: {
                    text: "other text",
                },
            },
            {
                id: "2",
                nodeType: "ElementLabel",
                props: {
                    text: "other text",
                },
            },
        ])
    }, [])

    /*
        Hooks onto "onDragEnd" of a DndContext.
        Essentially
    */
    function handleDragEnd(event: DragEndEvent) {
        const {
            active, // is it currently being dragged?
            over // the element that the dragged item is currently hovering over
        } = event;

        // if the item isn't hovering over anything, or the active dragging element is
        // hovering over it's own location, ignore
        if (!over || active.id === over.id) {
            return;
        }

        // rearrange the layout by removing the dragged element from the layout, then
        // adding it to the new correct index
        setLayout((nodes) => {
            const oldIndex = nodes.findIndex(
                (node) => node.id === active.id
            );

            const newIndex = nodes.findIndex(
                (node) => node.id === over.id
            );

            return arrayMove(nodes, oldIndex, newIndex);
        });
    }

    return (
        <div style = {{
            display: "flex",
            overflow: "hidden",
            justifyContent: "center",
        }}>
            <div style = {{
                position: "relative",
                width: "calc(100vw - 20rem)",
                maxWidth: "80rem",
                backgroundColor: "lightgray",
            }}>
                {/* DndContext is the context provider */}
                <DndContext
                    collisionDetection = {closestCenter}
                    onDragEnd = {handleDragEnd}
                >

                    {/* SortableContext defines an independent sortable collection */}
                    <SortableContext
                        items = {layout.map((node) => node.id)}
                        strategy = {verticalListSortingStrategy}
                    >
                        {layout.map((node) => (
                            <DragContainer key = {node.id} id = {node.id}>
                                <RenderNode node = {node} />
                            </DragContainer>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}