import * as React from 'react';
import styles from './HelloStorybook.module.scss';
import type { IHelloStorybookProps } from './IHelloStorybookProps';
import { ThemePreview } from './ThemePreview/ThemePreview';
import { DisplayModeIndicator } from './DisplayModeIndicator/DisplayModeIndicator';
import * as strings from 'HelloStorybookWebPartStrings';
import { css } from '@fluentui/react';

export default class HelloStorybook extends React.Component<IHelloStorybookProps> {
  public render(): React.ReactElement<IHelloStorybookProps> {
    const {
      isDarkTheme,
      environmentMessage,
      hasTeamsContext,
      theme,
      displayMode,
    } = this.props;

    return (
      <section className={`${styles.helloStorybook} ${hasTeamsContext ? styles.teams : ''}`}>
        <div className={`${styles.context}`}>
          <div className={styles.welcome}>
            <img
              title={isDarkTheme ? strings.DarkTheme : strings.LightTheme}
              src={isDarkTheme ? require('../assets/welcome-dark.png') : require('../assets/welcome-light.png')}
              className={styles.welcomeImage}
            />
            <div className={styles.environmentMessage}>{environmentMessage}</div>
          </div>
          <div className={styles.properties}>
            <p><b>{strings.TextValueFieldLabel}</b>: {this.props.textValue}</p>
            <p><b>{strings.SliderValueFieldLabel}</b>: {this.props.sliderValue}</p>
            <p><b>{strings.ToggleValueFieldLabel}</b>: {this.props.toggleValue ? strings.ToggleValueOnText : strings.ToggleValueOffText}</p>
            <p><b>Internal Value</b>: <pre>{JSON.stringify(this.props.internalValue, null, 2)}</pre></p>
          </div>
        </div>
        <div className={css(styles.section, styles.horizontal)}>
          <div className={styles.sectionTitle}>Display Mode:</div>
          <DisplayModeIndicator displayMode={displayMode} />
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Theme:</div>
          <ThemePreview theme={theme} />
        </div>
      </section>
    );
  }
}
