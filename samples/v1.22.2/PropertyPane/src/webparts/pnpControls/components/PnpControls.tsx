import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './PnpControls.module.scss';
import type { IPnpControlsProps } from './IPnpControlsProps';

export default class PnpControls extends React.Component<IPnpControlsProps> {
  public render(): React.ReactElement<IPnpControlsProps> {
    const {
      color, swatchColor, brandFont, iconName,
      password, searchValue, htmlCode, monacoCode, guid,
      dateTime, numberValue, spinValue, multiSelect,
      orderedItems, collectionData, gridItems,
      lists, column, view,
      people, teams, filePickerResult, folderPicker,
      terms, enterpriseTerms, sites, roleDefinitions
    } = this.props;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fmtArr = (arr: any[] | undefined | null, getLabel: (item: any) => string): string => {
      if (!arr || arr.length === 0) return 'None';
      return arr.map(getLabel).join(', ');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fmtJson = (val: any): string => {
      if (val === null || val === undefined) return 'Not set';
      if (Array.isArray(val)) return val.length === 0 ? '[]' : JSON.stringify(val);
      return JSON.stringify(val);
    };

    const groups: { groupName: string; properties: { name: string; value: React.ReactNode }[] }[] = [
      {
        groupName: 'Text Inputs',
        properties: [
          { name: 'password',         value: password ? '•'.repeat(password.length) : '' },
          { name: 'searchValue',      value: searchValue || '(empty)' },
          { name: 'htmlCode',         value: htmlCode || '(empty)' },
          { name: 'monacoCode',       value: monacoCode || '(empty)' },
          { name: 'guid',             value: guid || '(empty)' },
        ]
      },
      {
        groupName: 'Numbers & Ordering',
        properties: [
          { name: 'numberValue',      value: String(numberValue ?? '') },
          { name: 'spinValue',        value: `${spinValue ?? ''} units` },
          { name: 'multiSelect',      value: (multiSelect ?? []).join(', ') || 'None' },
          { name: 'orderedItems',     value: fmtArr(orderedItems, i => i.title ?? JSON.stringify(i)) },
          { name: 'collectionData',   value: fmtJson(collectionData) },
        ]
      },
      {
        groupName: 'Colors, Fonts & Icons',
        properties: [
          { name: 'color',       value: color ? <span className={styles.colorValue}><span className={styles.colorSwatch} style={{ backgroundColor: color }} />{color}</span> : '(empty)' },
          { name: 'swatchColor', value: swatchColor ? <span className={styles.colorValue}><span className={styles.colorSwatch} style={{ backgroundColor: swatchColor }} />{swatchColor}</span> : '(empty)' },
          { name: 'iconName',    value: iconName ? <span className={styles.iconValue}><Icon iconName={iconName} className={styles.iconDisplay} />{iconName}</span> : '(empty)' },
          { name: 'brandFont',   value: brandFont || '(empty)' },
        ]
      },
      {
        groupName: 'Date, Actions & Grid',
        properties: [
          { name: 'dateTime',         value: dateTime?.displayValue ?? 'Not set' },
          { name: 'gridItems',        value: fmtArr(gridItems, i => i.title ?? i.key) },
        ]
      },
      {
        groupName: 'List Pickers',
        properties: [
          { name: 'lists',            value: lists || '(empty)' },
          { name: 'column',           value: column || '(empty)' },
          { name: 'view',             value: view || '(empty)' },
        ]
      },
      {
        groupName: 'People & Teams',
        properties: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { name: 'people',           value: fmtArr(people, (p: any) => p.text ?? p.fullName ?? p.id) },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { name: 'teams',            value: fmtArr(teams, (t: any) => t.title ?? t.id) },
        ]
      },
      {
        groupName: 'Files & Folders',
        properties: [
          { name: 'filePickerResult', value: filePickerResult?.fileAbsoluteUrl ?? 'Not set' },
          { name: 'folderPicker',     value: folderPicker?.ServerRelativeUrl ?? 'Not set' },
        ]
      },
      {
        groupName: 'Term Store',
        properties: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { name: 'terms',            value: fmtArr(Array.isArray(terms) ? terms : [], (t: any) => t.name ?? t.key) },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { name: 'enterpriseTerms',  value: fmtArr(Array.isArray(enterpriseTerms) ? enterpriseTerms : [], (t: any) => t.name ?? t.key) },
        ]
      },
      {
        groupName: 'Sites & Roles',
        properties: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { name: 'sites',            value: fmtArr(sites, (s: any) => s.title ?? s.url) },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { name: 'roleDefinitions',  value: fmtArr(roleDefinitions, (r: any) => r.Name ?? r.Id) },
        ]
      },
    ];

    return (
      <section className={styles.pnpControls}>
        <h2>PnP SPFx Property Controls</h2>
        <table className={styles.propertyTable}>
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <React.Fragment key={group.groupName}>
                <tr>
                  <td colSpan={2} className={styles.groupHeader}>{group.groupName}</td>
                </tr>
                {group.properties.map(p => (
                  <tr key={p.name}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.value}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </section>
    );
  }
}
