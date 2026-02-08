import React, { useState, useEffect, useRef, FC } from 'react';
import {
    TextField,
    Checkbox,
    Toggle,
    Dropdown,
    Slider,
    ChoiceGroup,
    PrimaryButton,
    Label,
    Link,
    IDropdownOption,
    IChoiceGroupOption,
    Text,
    Separator,
    Stack,
    IconButton
} from '@fluentui/react';
import type { IActiveWebPart } from '../../types';
import { PropertyPaneFieldType } from '../../mocks/PropertyPaneMocks';
import styles from './PropertyPanePanel.module.css';

interface IPropertyPanePanelProps {
    webPart?: IActiveWebPart;
    onClose: () => void;
    onPropertyChange: (targetProperty: string, newValue: any) => void;
}

export const PropertyPanePanel: FC<IPropertyPanePanelProps> = ({
    webPart,
    onClose,
    onPropertyChange
}) => {
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        if (webPart?.instance && typeof webPart.instance.getPropertyPaneConfiguration === 'function') {
            try {
                const paneConfig = webPart.instance.getPropertyPaneConfiguration();
                setConfig(paneConfig);
            } catch (e: any) {
                console.error('PropertyPane - Error getting configuration:', e);
                setConfig(null);
            }
        } else {
            setConfig(null);
        }
    }, [webPart]);

    return (
        <div id="property-pane" className={`${styles.panel} ${webPart ? styles.open : ''}`}>
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { padding: '12px 16px', borderBottom: '1px solid #edebe9' } }}>
                <Text variant="large" styles={{ root: { fontWeight: 600 } }}>Properties</Text>
                <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    title="Close"
                    ariaLabel="Close"
                    onClick={onClose}
                />
            </Stack>
            <div id="property-pane-content">
                {config && config.pages && config.pages.length > 0 && webPart ? (
                    <PropertyPaneContent
                        config={config}
                        webPart={webPart}
                        onPropertyChange={onPropertyChange}
                    />
                ) : (
                    <Stack horizontalAlign="center" styles={{ root: { padding: '16px' } }}>
                        <Text styles={{ root: { color: '#605e5c' } }}>
                            No property pane configuration available for this web part.
                        </Text>
                    </Stack>
                )}
            </div>
        </div>
    );
};

interface IPropertyPaneContentProps {
    config: any;
    webPart: IActiveWebPart;
    onPropertyChange: (targetProperty: string, newValue: any) => void;
}

const PropertyPaneContent: FC<IPropertyPaneContentProps> = ({
    config,
    webPart,
    onPropertyChange
}) => {
    const page = config.pages[0];

    return (
        <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: '16px' } }}>
            {page.header?.description && (
                <Text variant="medium">{page.header.description}</Text>
            )}
            {(page.groups || []).map((group: any, groupIndex: number) => (
                <Stack key={groupIndex} tokens={{ childrenGap: 12 }}>
                    {!group.isGroupNameHidden && group.groupName && (
                        <>
                            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                                {group.groupName}
                            </Text>
                            <Separator />
                        </>
                    )}
                    <Stack tokens={{ childrenGap: 8 }}>
                        {(group.groupFields || []).map((field: any, fieldIndex: number) => (
                            <PropertyPaneField
                                key={fieldIndex}
                                field={field}
                                webPart={webPart}
                                onPropertyChange={onPropertyChange}
                            />
                        ))}
                    </Stack>
                </Stack>
            ))}
        </Stack>
    );
};

interface IPropertyPaneFieldProps {
    field: any;
    webPart: IActiveWebPart;
    onPropertyChange: (targetProperty: string, newValue: any) => void;
}

const PropertyPaneField: FC<IPropertyPaneFieldProps> = ({
    field,
    webPart,
    onPropertyChange
}) => {
    // Guard against null webPart
    if (!webPart) {
        return null;
    }

    const currentValue = field.targetProperty ? webPart.properties[field.targetProperty] : undefined;

    const handleChange = (newValue: any) => {
        if (field.targetProperty) {
            onPropertyChange(field.targetProperty, newValue);
        }
    };

    switch (field.type) {
        case PropertyPaneFieldType.TextField:
            return <TextFieldComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.CheckBox:
            return <CheckboxComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.Toggle:
            return <ToggleComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.Dropdown:
            return <DropdownComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.Slider:
            return <SliderComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.ChoiceGroup:
            return <ChoiceGroupComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.Button:
            return <ButtonComponent field={field} />;
        case PropertyPaneFieldType.Label:
            return <LabelComponent field={field} />;
        case PropertyPaneFieldType.Heading:
            return <HeadingComponent field={field} />;
        case PropertyPaneFieldType.Link:
            return <LinkComponent field={field} />;
        case PropertyPaneFieldType.HorizontalRule:
            return <Separator />;
        case PropertyPaneFieldType.Custom:
            return <CustomFieldComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.DynamicField:
            return <TextFieldComponent field={field} value={currentValue} onChange={handleChange} />;
        case PropertyPaneFieldType.DynamicFieldSet:
            return <Text styles={{ root: { color: '#605e5c', fontStyle: 'italic' } }}>Dynamic Field Set (Not fully supported)</Text>;
        default:
            return (
                <Text styles={{ root: { color: '#a80000' } }}>
                    Unsupported field type: {field.type}
                </Text>
            );
    }
};

// Individual field components using Fluent UI

// Helper to extract string value (handles localization objects)
const getString = (prop: any): string | undefined => {
    if (!prop) return undefined;
    if (typeof prop === 'string') return prop;
    // Handle localized string objects like { default: "Label", ... }
    if (typeof prop === 'object' && prop.default) return prop.default;
    return String(prop);
};

const TextFieldComponent: FC<{ field: any; value: any; onChange: (value: string) => void }> = ({
    field,
    value,
    onChange
}) => {
    const label = getString(field.properties?.label || field.properties?.Label);
    const description = getString(field.properties?.description || field.properties?.Description);
    const placeholder = getString(field.properties?.placeholder || field.properties?.Placeholder);
    
    // Fallback: use targetProperty as label if no label provided
    const displayLabel = label || (field.targetProperty ? 
        field.targetProperty.charAt(0).toUpperCase() + field.targetProperty.slice(1) : 
        undefined);
    
    return (
        <TextField
            label={displayLabel}
            description={description}
            placeholder={placeholder}
            value={value || ''}
            onChange={(_, newValue) => onChange(newValue || '')}
            multiline={field.properties?.multiline}
            rows={field.properties?.rows || 3}
        />
    );
};

const CheckboxComponent: FC<{ field: any; value: any; onChange: (value: boolean) => void }> = ({
    field,
    value,
    onChange
}) => {
    const text = getString(field.properties?.text || field.properties?.Text);
    
    return (
        <Checkbox
            label={text}
            checked={!!value}
            onChange={(_, checked) => onChange(!!checked)}
        />
    );
};

const ToggleComponent: FC<{ field: any; value: any; onChange: (value: boolean) => void }> = ({
    field,
    value,
    onChange
}) => {
    const label = getString(field.properties?.label || field.properties?.Label);
    const onText = getString(field.properties?.onText || field.properties?.OnText) || 'On';
    const offText = getString(field.properties?.offText || field.properties?.OffText) || 'Off';
    
    return (
        <Toggle
            label={label}
            checked={!!value}
            onText={onText}
            offText={offText}
            onChange={(_, checked) => onChange(!!checked)}
        />
    );
};

const DropdownComponent: FC<{ field: any; value: any; onChange: (value: any) => void }> = ({
    field,
    value,
    onChange
}) => {
    const label = getString(field.properties?.label || field.properties?.Label);
    const options = (field.properties?.options || field.properties?.Options || []).map((opt: any) => ({
        key: opt.key,
        text: getString(opt.text) || opt.text
    })) as IDropdownOption[];
    
    return (
        <Dropdown
            label={label}
            selectedKey={value}
            options={options}
            onChange={(_, option) => onChange(option?.key)}
        />
    );
};

const SliderComponent: FC<{ field: any; value: any; onChange: (value: number) => void }> = ({
    field,
    value,
    onChange
}) => {
    const label = getString(field.properties?.label || field.properties?.Label);
    const min = field.properties?.min ?? field.properties?.Min ?? 0;
    const max = field.properties?.max ?? field.properties?.Max ?? 100;
    const step = field.properties?.step ?? field.properties?.Step ?? 1;
    
    return (
        <Slider
            label={label}
            min={min}
            max={max}
            step={step}
            value={value !== undefined ? value : min}
            showValue
            onChange={(newValue) => onChange(newValue)}
        />
    );
};

const ChoiceGroupComponent: FC<{ field: any; value: any; onChange: (value: any) => void }> = ({
    field,
    value,
    onChange
}) => {
    const label = getString(field.properties?.label || field.properties?.Label);
    const options = (field.properties?.options || field.properties?.Options || []).map((opt: any) => ({
        key: opt.key,
        text: getString(opt.text) || opt.text
    })) as IChoiceGroupOption[];
    
    return (
        <ChoiceGroup
            label={label}
            selectedKey={value}
            options={options}
            onChange={(_, option) => onChange(option?.key)}
        />
    );
};

const ButtonComponent: FC<{ field: any }> = ({ field }) => {
    const text = getString(field.properties?.text || field.properties?.Text);
    return (
        <PrimaryButton
            text={text}
            onClick={() => {
                if (field.properties?.onClick) {
                    field.properties.onClick();
                }
            }}
        />
    );
};

const LabelComponent: FC<{ field: any }> = ({ field }) => {
    const text = getString(field.properties?.text || field.properties?.Text);
    return <Label>{text}</Label>;
};

const LinkComponent: FC<{ field: any }> = ({ field }) => {
    const text = getString(field.properties?.text || field.properties?.Text);
    const href = field.properties?.href || field.properties?.Href;
    return (
        <Link
            href={href}
            target={field.properties?.target || '_blank'}
            rel="noopener noreferrer"
        >
            {text}
        </Link>
    );
};

const HeadingComponent: FC<{ field: any }> = ({ field }) => {
    const text = getString(field.properties?.text || field.properties?.Text);
    return <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>{text}</Text>;
};

const CustomFieldComponent: FC<{ field: any; value: any; onChange: (value: any) => void }> = ({
    field,
    value,
    onChange
}) => {
    // Custom fields can render their own content
    if (field.properties.onRender && typeof field.properties.onRender === 'function') {
        const containerRef = useRef<HTMLDivElement>(null);
        
        useEffect(() => {
            if (containerRef.current) {
                try {
                    field.properties.onRender(containerRef.current, value, onChange);
                } catch (e: any) {
                    console.error('PropertyPane - Custom field render error:', e);
                }
            }
        }, [field, value, onChange]);

        return <div className="pp-field" ref={containerRef}></div>;
    }

    // Fallback for custom fields without onRender
    return (
        <div className="pp-field">
            <div style={{ color: '#605e5c', fontStyle: 'italic' }}>
                Custom Field {field.properties.key || ''}
            </div>
        </div>
    );
};
