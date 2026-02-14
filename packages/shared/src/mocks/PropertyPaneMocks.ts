// Property Pane Mocks
// for SPFx web parts to use property pane controls
export const PropertyPaneFieldType = {
    Custom: 1,
    CheckBox: 2,
    TextField: 3,
    Toggle: 5,
    Dropdown: 6,
    Label: 7,
    Slider: 8,
    Heading: 9,
    ChoiceGroup: 10,
    Button: 11,
    HorizontalRule: 12,
    Link: 13,
    DynamicField: 14,
    DynamicFieldSet: 16
};

export const PropertyPaneButtonType = {
    Normal: 0,
    Primary: 1,
    Hero: 2,
    Compound: 3,
    Command: 4,
    Icon: 5
};

export const PropertyPaneDropdownOptionType = {
    Normal: 0,
    Divider: 1,
    Header: 2
};

// Property pane field factory functions
export function PropertyPaneTextField(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.TextField,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneCheckbox(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.CheckBox,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneToggle(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.Toggle,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneDropdown(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.Dropdown,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneChoiceGroup(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.ChoiceGroup,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneSlider(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.Slider,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneButton(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.Button,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneLabel(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.Label,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneHeading(properties?: any) {
    return {
        type: PropertyPaneFieldType.Heading,
        targetProperty: '',
        properties: properties || {}
    };
}

export function PropertyPaneLink(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.Link,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneHorizontalRule() {
    return {
        type: PropertyPaneFieldType.HorizontalRule,
        targetProperty: '',
        properties: {}
    };
}

export function PropertyPaneCustomField(properties?: any) {
    return {
        type: PropertyPaneFieldType.Custom,
        targetProperty: properties?.key || '',
        properties: properties || {}
    };
}

export function PropertyPaneDynamicField(targetProperty: string, properties?: any) {
    return {
        type: PropertyPaneFieldType.DynamicField,
        targetProperty: targetProperty,
        properties: properties || {}
    };
}

export function PropertyPaneDynamicFieldSet(properties?: any) {
    return {
        type: PropertyPaneFieldType.DynamicFieldSet,
        targetProperty: '',
        properties: properties || {}
    };
}

// Module exports for AMD registration
export const spPropertyPaneModule = {
    PropertyPaneFieldType,
    PropertyPaneButtonType,
    PropertyPaneDropdownOptionType,
    PropertyPaneTextField,
    PropertyPaneCheckbox,
    PropertyPaneToggle,
    PropertyPaneDropdown,
    PropertyPaneChoiceGroup,
    PropertyPaneSlider,
    PropertyPaneButton,
    PropertyPaneLabel,
    PropertyPaneHeading,
    PropertyPaneLink,
    PropertyPaneHorizontalRule,
    PropertyPaneCustomField,
    PropertyPaneDynamicField,
    PropertyPaneDynamicFieldSet
};
