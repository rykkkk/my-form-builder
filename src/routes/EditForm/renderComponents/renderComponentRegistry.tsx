import { ElementLabel, ElementLabelSchema, ElementLabelDefaultSchema, ElementLabelSettingSchema } from "./ElementLabel";
import { DateValue, DateValueSchema, DateValueDefaultSchema, DateValueSettingSchema } from "./DateValue";

export type registryItem<T extends Record<string, any>> = {
  render: (props: T) => React.ReactNode;
  displaySchema: T;
  optionsSchema: any[];
};

function createRegistryItem<T extends Record<string, any>>(item: registryItem<T>): registryItem<T> {
  return item;
}

export const renderComponentRegistry = {
  ElementLabel: createRegistryItem<ElementLabelSchema>({
    render: (props) => <ElementLabel state={props} />,
    displaySchema: ElementLabelDefaultSchema,
    optionsSchema: ElementLabelSettingSchema,
  }),
  DateValue: createRegistryItem<DateValueSchema>({
    render: (props) => <DateValue state={props} />,
    displaySchema: DateValueDefaultSchema,
    optionsSchema: DateValueSettingSchema,
  }),
};