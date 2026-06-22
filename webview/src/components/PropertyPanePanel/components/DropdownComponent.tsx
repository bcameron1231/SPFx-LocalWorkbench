import {
  concatStyleSets,
  Dropdown,
  DropdownMenuItemType,
  type IDropdownOption,
  type IDropdownStyles,
  Icon,
  Stack,
} from '@fluentui/react';
import React, { FC } from 'react';

interface IDropdownComponentProps {
  ariaLabel?: string;
  calloutMaxHeight?: number;
  disabled?: boolean;
  label?: string;
  onChange: (value: string | number | undefined) => void;
  options: IDropdownOption[];
  placeholder?: string;
  selectedKey?: string | number | null;
  styles?: Partial<IDropdownStyles>;
}

export const DropdownComponent: FC<IDropdownComponentProps> = ({
  ariaLabel,
  calloutMaxHeight,
  disabled,
  label,
  onChange,
  options,
  placeholder,
  selectedKey,
  styles,
}) => {
  const mergedStyles = concatStyleSets(
    {
      label: {
        fontWeight: 600,
        paddingLeft: 0,
      },
      root: {
        selectors: {
          '.is-open .ms-Dropdown-title::after': {
            transform: 'scaleX(1)',
            transitionProperty: 'transform',
            transitionDuration: '200ms',
            transitionTimingFunction: 'cubic-bezier(0, 0, 0, 1)',
          },
        },
      },
      dropdown: {
        position: 'relative',
        selectors: {
          '::after': {
            display: 'none',
          },
          ':hover .ms-Dropdown-title': {
            ...(disabled
              ? {
                  borderColor: 'var(--neutralLight)',
                }
              : {
                  borderColor: 'color-mix(in srgb, var(--neutralTertiary) 50%, transparent)',
                  borderBottomColor: 'var(--neutralPrimary)',
                }),
          },
        },
      },
      title: {
        ...(disabled
          ? {
              backgroundColor: 'var(--primaryBody)', // Match disabled style
              border: '1px solid var(--neutralLight)', // Match disabled style
              cursor: 'not-allowed',
            }
          : {
              borderColor: 'color-mix(in srgb, var(--neutralTertiary) 50%, transparent)',
              borderBottomColor: 'var(--neutralPrimary)',
            }),
        borderRadius: 4,
        color: disabled ? 'var(--neutralTertiary)' : 'var(--neutralPrimary)',
        paddingLeft: 12,
        selectors: {
          '::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: 4,
            borderBottom: '2px solid var(--themePrimary)',
            transform: 'scaleX(0)',
            transformOrigin: 'center',
            transition: 'none',
            pointerEvents: 'none',
          },
        },
      },
      dropdownItem: {
        padding: 0,
        paddingLeft: 6,
        lineHeight: 32,
        minHeight: 32,
        borderRadius: 4,
      },
      caretDown: {
        color: disabled ? 'var(--neutralTertiary)' : 'var(--neutralPrimary)',
      },
      dropdownItems: {
        padding: 4,
      },
      dropdownItemHeader: {
        fontWeight: 600,
        paddingLeft: 6,
        fontSize: 12,
        color: 'var(--neutralSecondary)',
        lineHeight: 32,
        height: 32,
      },
      dropdownItemSelected: {
        borderRadius: 4,
        backgroundColor: 'transparent',
        padding: 0,
        paddingLeft: 6,
        minHeight: 32,
        selectors: {
          ':hover': {
            backgroundColor: 'var(--neutralLighter)',
          },
        },
      },
    },
    styles,
  );

  return (
    <Dropdown
      ariaLabel={ariaLabel}
      calloutProps={calloutMaxHeight ? { calloutMaxHeight } : undefined}
      disabled={disabled}
      label={label}
      placeholder={placeholder}
      selectedKey={selectedKey}
      options={options}
      onChange={(_, option) => onChange(option?.key)}
      onRenderOption={(option) => {
        if (!option) {
          return null;
        }

        if (option.itemType === DropdownMenuItemType.Header) {
          return <div>{option.text}</div>;
        }

        if (option.itemType === DropdownMenuItemType.Divider) {
          return null;
        }

        const isSelected = option.key === selectedKey;

        return (
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
            <Icon
              iconName="CheckMark"
              styles={{ root: { opacity: isSelected ? 1 : 0, width: 16 } }}
            />
            <div>{option.text}</div>
          </Stack>
        );
      }}
      styles={mergedStyles}
    />
  );
};
