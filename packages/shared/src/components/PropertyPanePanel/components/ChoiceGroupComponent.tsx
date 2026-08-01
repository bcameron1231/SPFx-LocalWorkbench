import {
  ChoiceGroup,
  IChoiceGroupOption,
  IChoiceGroupOptionStyleProps,
  IChoiceGroupOptionStyles,
} from '@fluentui/react';
import React, { FC } from 'react';

interface IChoiceGroupComponentProps {
  disabled?: boolean;
  label?: string;
  onChange: (value: string | undefined) => void;
  options: IChoiceGroupOption[];
  selectedKey?: string;
}

export const ChoiceGroupComponent: FC<IChoiceGroupComponentProps> = ({
  disabled,
  label,
  onChange,
  options,
  selectedKey,
}) => {
  const usesImages = options.some((option) => !!option.imageSrc);
  const usesIcons = options.some((option) => !!option.iconProps);
  const usesVisualOptions = usesImages || usesIcons;

  return (
    <ChoiceGroup
      disabled={disabled}
      label={label}
      selectedKey={selectedKey}
      options={options.map((option) => ({
        ...option,
        styles: (styleProps: IChoiceGroupOptionStyleProps): Partial<IChoiceGroupOptionStyles> => {
          const resolvedStyles =
            typeof option.styles === 'function' ? option.styles(styleProps) : option.styles;

          return {
            ...resolvedStyles,
            root: [
              {
                ...(usesVisualOptions
                  ? {
                      margin: '4px 4px 0 0',
                    }
                  : {
                      margin: '2px 0',
                    }),
              },
              resolvedStyles?.root,
            ],
            field: [
              {
                ...(usesVisualOptions
                  ? {
                      paddingTop: 22,
                    }
                  : {
                      padding: '6px 8px 6px 10px',
                      margin: '-2px 0',
                    }),
                lineHeight: 20,
                selectors: {
                  '::before': {
                    // The radio outer circle
                    width: 16,
                    height: 16,
                    margin: 8,
                    top: 0,
                    right: 0,
                    borderColor: 'var(--neutralPrimary, #323130)', //even disabled are this color
                  },
                  '::after': {
                    // The radio inner circle
                    opacity: styleProps.checked ? 1 : 0,
                    ...(usesVisualOptions
                      ? {
                          top: 11,
                          right: 11,
                        }
                      : {
                          top: 11,
                          left: 11,
                        }),
                  },
                },
              },
              resolvedStyles?.field,
            ],
            innerField: [
              {
                ...(usesImages
                  ? {
                      padding: 0,
                    }
                  : {
                      padding: '0 28px',
                    }),
                width: 89,
              },
              resolvedStyles?.innerField,
            ],
            labelWrapper: [
              // Only applies to visual options
              {
                color: 'var(--neutralSecondary, #605E5C)',
                margin: '4px 0 2px',
                maxWidth: 89,
              },
              resolvedStyles?.labelWrapper,
            ],
          };
        },
      }))}
      onChange={(_, option) => onChange(option?.key)}
      styles={{
        label: {
          padding: 0,
        },
      }}
    />
  );
};
