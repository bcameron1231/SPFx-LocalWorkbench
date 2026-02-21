import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  PropertyPaneTextField,
  PropertyPaneSlider,
  PropertyPaneToggle,
  type IPropertyPaneConfiguration,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'HelloStorybookWebPartStrings';
import HelloStorybook from './components/HelloStorybook';
import { IHelloStorybookProps } from './components/IHelloStorybookProps';
import { IThemeColors, defaultThemeColors } from './components/IThemeColors';

export interface IHelloStorybookWebPartProps {
  textValue: string;
  sliderValue: number;
  toggleValue: boolean;
  internalValue: object;
}

export default class HelloStorybookWebPart extends BaseClientSideWebPart<IHelloStorybookWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private _themeColors: IThemeColors = { ...defaultThemeColors };

  public render(): void {
    const element: React.ReactElement<IHelloStorybookProps> = React.createElement(
      HelloStorybook,
      {
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        themeColors: this._themeColors,
        displayMode: this.displayMode,
        textValue: this.properties.textValue,
        sliderValue: this.properties.sliderValue,
        toggleValue: this.properties.toggleValue,
        internalValue: this.properties.internalValue,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;

    const { palette, semanticColors } = currentTheme;

    if (palette) {
      this._themeColors = {
        primary: palette.themePrimary || defaultThemeColors.primary,
        secondary: palette.themeSecondary || defaultThemeColors.secondary,
        tertiary: palette.themeTertiary || defaultThemeColors.tertiary,
        light: palette.themeLight || defaultThemeColors.light,
        dark: palette.themeDark || defaultThemeColors.dark,
        bodyText: (semanticColors && semanticColors.bodyText) || defaultThemeColors.bodyText,
        bodyBackground: (semanticColors && semanticColors.bodyBackground) || defaultThemeColors.bodyBackground,
      };
    }

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [{
            groupName: strings.BasicGroupName,
            groupFields: [
              PropertyPaneTextField('textValue', {
                label: strings.TextValueFieldLabel,
              }),
              PropertyPaneSlider('sliderValue', {
                label: strings.SliderValueFieldLabel,
                min: 0,
                max: 100,
                step: 1,
              }),
              PropertyPaneToggle('toggleValue', {
                label: strings.ToggleValueFieldLabel,
                onText: strings.ToggleValueOnText,
                offText: strings.ToggleValueOffText,
              }),
            ]
          }],
        }
      ]
    };
  }
}
