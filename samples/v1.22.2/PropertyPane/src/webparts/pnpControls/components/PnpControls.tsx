import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';
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

    const sections: IScenarioDetailSection[] = [
      {
        title: 'Text Inputs',
        entries: [
          { label: 'password', value: password ? '•'.repeat(password.length) : '' },
          { label: 'searchValue', value: searchValue || '(empty)' },
          { label: 'htmlCode', value: htmlCode || '(empty)' },
          { label: 'monacoCode', value: monacoCode || '(empty)' },
          { label: 'guid', value: guid || '(empty)' },
        ]
      },
      {
        title: 'Numbers & Ordering',
        entries: [
          { label: 'numberValue', value: String(numberValue ?? '') },
          { label: 'spinValue', value: `${spinValue ?? ''} units` },
          { label: 'multiSelect', value: (multiSelect ?? []).join(', ') || 'None' },
          { label: 'orderedItems', value: fmtArr(orderedItems, i => i.title ?? JSON.stringify(i)) },
          { label: 'collectionData', value: fmtJson(collectionData) },
        ]
      },
      {
        title: 'Colors, Fonts & Icons',
        entries: [
          { label: 'color', value: color ? <span className={styles.colorValue}><span className={styles.colorSwatch} style={{ backgroundColor: color }} />{color}</span> : '(empty)' },
          { label: 'swatchColor', value: swatchColor ? <span className={styles.colorValue}><span className={styles.colorSwatch} style={{ backgroundColor: swatchColor }} />{swatchColor}</span> : '(empty)' },
          { label: 'iconName', value: iconName ? <span className={styles.iconValue}><Icon iconName={iconName} className={styles.iconDisplay} />{iconName}</span> : '(empty)' },
          { label: 'brandFont', value: brandFont || '(empty)' },
        ]
      },
      {
        title: 'Date, Actions & Grid',
        entries: [
          { label: 'dateTime', value: dateTime?.displayValue ?? 'Not set' },
          { label: 'gridItems', value: fmtArr(gridItems, i => i.title ?? i.key) },
        ]
      },
      {
        title: 'List Pickers',
        entries: [
          { label: 'lists', value: lists || '(empty)' },
          { label: 'column', value: column || '(empty)' },
          { label: 'view', value: view || '(empty)' },
        ]
      },
      {
        title: 'People & Teams',
        entries: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'people', value: fmtArr(people, (p: any) => p.text ?? p.fullName ?? p.id) },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'teams', value: fmtArr(teams, (t: any) => t.title ?? t.id) },
        ]
      },
      {
        title: 'Files & Folders',
        entries: [
          { label: 'filePickerResult', value: filePickerResult?.fileAbsoluteUrl ?? 'Not set' },
          { label: 'folderPicker', value: folderPicker?.ServerRelativeUrl ?? 'Not set' },
        ]
      },
      {
        title: 'Term Store',
        entries: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'terms', value: fmtArr(Array.isArray(terms) ? terms : [], (t: any) => t.name ?? t.key) },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'enterpriseTerms', value: fmtArr(Array.isArray(enterpriseTerms) ? enterpriseTerms : [], (t: any) => t.name ?? t.key) },
        ]
      },
      {
        title: 'Sites & Roles',
        entries: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'sites', value: fmtArr(sites, (s: any) => s.title ?? s.url) },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'roleDefinitions', value: fmtArr(roleDefinitions, (r: any) => r.Name ?? r.Id) },
        ]
      },
    ];

    return (
      <ScenarioDetails
        manifestInfo={this.props.manifestInfo}
        title="PnP SPFx Property Controls"
        description="Broad regression surface for PnP property controls across text, pickers, collections, files, terms, and roles."
        sections={sections}
      />
    );
  }
}
