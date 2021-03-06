import { WebComponentDefinition } from "@microsoft/fast-tooling/dist/esm/data-utilities/web-component";
import { DataType } from "@microsoft/fast-tooling";

export const fastAccordionDefinition: WebComponentDefinition = {
    version: 1,
    tags: [
        {
            name: "fast-accordion",
            description: "The FAST accordion element",
            attributes: [
                {
                    name: "expand-mode",
                    description: "The expand mode attribute",
                    type: DataType.string,
                    values: [
                        {
                            name: "single",
                        },
                        {
                            name: "multi",
                        },
                    ],
                    default: "multi",
                    required: false,
                },
            ],
            slots: [
                {
                    name: "",
                    description: "The default slot",
                },
                {
                    name: "item",
                    description: "The item slot",
                },
            ],
        },
    ],
};
