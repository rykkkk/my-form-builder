import { ElementLabel, ElementLabelSchema, ElementLabelDefaultSchema, ElementLabelSettingSchema } from "./renderComponents/ElementLabel";

export type registryItem<T extends Record<string, any>> = {
  render: (props: T) => React.ReactNode;
  displaySchema: T;
  optionsSchema: any[];
};

function createRegistryItem<T extends Record<string, any>>(item: registryItem<T>): registryItem<T> {
  return item;
}

export const componentRegistry = {
  ElementLabel: createRegistryItem<ElementLabelSchema>({
    render: (props) => <ElementLabel state={props} />,
    displaySchema: ElementLabelDefaultSchema,
    optionsSchema: ElementLabelSettingSchema,
  }),
};