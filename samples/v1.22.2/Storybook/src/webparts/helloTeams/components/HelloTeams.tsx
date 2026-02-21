import * as React from 'react';
import styles from './HelloTeams.module.scss';
import type { IHelloTeamsProps } from './IHelloTeamsProps';

export default class HelloTeams extends React.Component<IHelloTeamsProps> {
  public render(): React.ReactElement<IHelloTeamsProps> {
    const {
      environmentMessage,
      hasTeamsContext,
    } = this.props;

    return (
      <section className={`${styles.helloTeams} ${hasTeamsContext ? styles.teams : ''}`}>
        <h2>Hello Teams</h2>
        <div>{environmentMessage}</div>
      </section>
    );
  }
}
