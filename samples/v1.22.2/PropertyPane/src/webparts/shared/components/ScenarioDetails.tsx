import * as React from 'react';
import styles from './ScenarioDetails.module.scss';

export interface IScenarioDetailEntry {
  label: string;
  value: string;
}

export interface IScenarioDetailSection {
  title: string;
  entries: IScenarioDetailEntry[];
}

export interface IScenarioDetailsProps {
  title: string;
  description: string;
  sections: IScenarioDetailSection[];
}

export default function ScenarioDetails(props: IScenarioDetailsProps): React.ReactElement<IScenarioDetailsProps> {
  const { title, description, sections } = props;

  return (
    <section className={styles.scenarioDetails}>
      <h2>{title}</h2>
      <p>{description}</p>
      <table className={styles.propertyTable}>
        <colgroup>
          <col className={styles.labelColumn} />
          <col className={styles.valueColumn} />
        </colgroup>
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <React.Fragment key={section.title}>
              <tr>
                <td colSpan={2} className={styles.groupHeader}>
                  {section.title}
                </td>
              </tr>
              {section.entries.map((entry) => (
                <tr key={entry.label}>
                  <td>
                    <strong>{entry.label}</strong>
                  </td>
                  <td>{entry.value}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}
