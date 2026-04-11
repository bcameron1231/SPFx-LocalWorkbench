declare interface IHelloStorybookWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  DarkTheme: string;
  LightTheme: string;
  SliderValueFieldLabel: string;
  TextValueFieldLabel: string;
  ToggleValueFieldLabel: string;
  ToggleValueOffText: string;
  ToggleValueOnText: string;
  UnknownEnvironment: string;
}

declare module 'HelloStorybookWebPartStrings' {
  const strings: IHelloStorybookWebPartStrings;
  export = strings;
}
