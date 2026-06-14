import * as React from 'react';
import styles from './StandardControls.module.scss';
import type { IStandardControlsProps } from './IStandardControlsProps';

export default class StandardControls extends React.Component<IStandardControlsProps> {
  public render(): React.ReactElement<IStandardControlsProps> {
    const { textField, toggle, checkbox, dropdown, slider, choiceGroup } = this.props;

    const groups: { groupName: string; properties: { name: string; value: string }[] }[] = [
      {
        groupName: 'Text & Toggle',
        properties: [
          { name: 'textField',   value: textField },
          { name: 'toggle',      value: String(toggle) },
          { name: 'checkbox',    value: String(checkbox) },
        ]
      },
      {
        groupName: 'Selection',
        properties: [
          { name: 'dropdown',    value: dropdown },
          { name: 'choiceGroup', value: choiceGroup },
          { name: 'slider',      value: String(slider) },
        ]
      },
      {
        groupName: 'Display-only Controls',
        properties: [
          { name: 'label',          value: 'This is a PropertyPaneLabel — read-only text in the pane.' },
          { name: 'horizontalRule', value: '(visual separator — no stored value)' },
          { name: 'link',           value: 'SPFx Documentation → https://aka.ms/spfx' },
          { name: 'button',         value: '(triggers action — no stored value)' },
        ]
      },
    ];

    return (
      <section className={styles.standardControls}>
        <h2>Standard Property Pane Controls</h2>
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
