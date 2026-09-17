import { SettingsModal, SettingSchema } from "./SettingsModal";
import React from "react";
import { useRef, useState, useEffect } from "react"
import { componentRegistry } from "./componentRegistry";
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

type Node = {
    id: string;
    nodeType: keyof typeof componentRegistry;
    state: any;
}
type NodeState = Record<string, any>
type FormState = Record<string, NodeState>

// renders an element depending on the node
const RenderNode = React.memo(function({ node }: { node: Node }) {
  const entry = componentRegistry[node.nodeType];
  return entry.render(node.state);
})

export function FormEditor() {
    const [layout, setLayout] = useState<Node[]>([])

    /*
        Hooks onto "onDragEnd" of a DndContext.
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

    // DOES NOTHING USEFUL. I only added this in so react rerenders to update json.stringify() later in thecode and to add new values
    const nextId = useRef(1);
    useEffect(() => {
        const interval = setInterval(() => {
            const id = nextId.current++;

            setLayout(prev => [
                ...prev,
                {
                    id: id.toString(),
                    nodeType: "ElementLabel",
                    state: {
                        text: "other text" + id.toString(),
                        useRichText: false,
                    },
                },
            ]);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const [settingsOpen, setSettingsOpen] = useState(false)
    const [currentSelectedNode, setCurrentSelectedNode] = useState<Node | null>()
    function updateNodeState(field: string, newValue: any) {
        setLayout(prev =>
            prev.map(node => {
                if (node.id === currentSelectedNode.id) {

                    /*
                        RenderNode uses React.memo, which shallowly compares its props.
                        Since `node` is passed as a prop, mutating `node.state` directly
                        does not change the `node` reference, so React.memo may skip the
                        render. We therefore create a new node object (and state object)
                        when updating state so the `node` prop has a new reference.
                    */
                    const newNode = {
                        ...node,
                        state: { ...node.state, [field]: newValue },
                    };

                    // After cloning the node, set the current selected node to the new node.
                    setCurrentSelectedNode(newNode)

                    return newNode
                }
                return node
            })
        );
    }

    return (
        <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
        }}>
            <div style = {{
                display: "flex",
                overflow: "visible",
                justifyContent: "center",
                flexDirection: "column",
            }}>
                <div style = {{
                    position: "relative",
                    width: "calc(100vw - 20rem)",
                    maxWidth: "80rem",
                    backgroundColor: "lightgray",
                }}>
                
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
                                <DragContainer key={node.id} id={node.id}>
                                    <button style={{
                                        position: "absolute",
                                        right: "2rem",
                                    }}
                                    onClick={() => {
                                        setCurrentSelectedNode(node)
                                        setSettingsOpen(true)
                                    }}>Settings</button>
                                    <RenderNode key={node.id} node={node} />

                                </DragContainer>
                            ))}
                        </SortableContext>
                    </DndContext>

                </div>
                <p>
                    {/* just displaying the current state of the form; remove later */}
                    {JSON.stringify(layout)}
                </p>
            </div>
            <SettingsModal
                open={settingsOpen}
                schema={currentSelectedNode ? componentRegistry[currentSelectedNode.nodeType].optionsSchema : null}
                state={currentSelectedNode ? currentSelectedNode.state : null}
                onChange={updateNodeState}
                onClose={() => setSettingsOpen(false)}
            />
        </div>
    );
}