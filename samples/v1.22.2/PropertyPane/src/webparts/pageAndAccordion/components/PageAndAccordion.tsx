import * as React from 'react';
import ScenarioDetails, { type IScenarioDetailSection } from '../../shared/components/ScenarioDetails';

export interface IPageAndAccordionProps {
  accordionName: string;
  collapsedNotes: string;
  pageTwoAudience: string;
  pageTwoHighlight: boolean;
  pageTwoNotes: string;
  pageThreeSummary: string;
  pageThreeStatus: string;
  pageThreeHiddenNameValue: string;
}

export default function PageAndAccordion(props: IPageAndAccordionProps): React.ReactElement<IPageAndAccordionProps> {
  const sections: IScenarioDetailSection[] = [
    {
      title: 'Accordion Page',
      entries: [
        { label: 'accordionName', value: props.accordionName },
        { label: 'collapsedNotes', value: props.collapsedNotes },
      ],
    },
    {
      title: 'Page Two',
      entries: [
        { label: 'pageTwoAudience', value: props.pageTwoAudience },
        { label: 'pageTwoHighlight', value: String(props.pageTwoHighlight) },
        { label: 'pageTwoNotes', value: props.pageTwoNotes },
      ],
    },
    {
      title: 'Page Three',
      entries: [
        { label: 'pageThreeSummary', value: props.pageThreeSummary },
        { label: 'pageThreeStatus', value: props.pageThreeStatus },
        { label: 'pageThreeHiddenNameValue', value: props.pageThreeHiddenNameValue },
      ],
    },
  ];

  return (
    <ScenarioDetails
      title="Page And Accordion Behavior"
      description="Multiple pages, accordion groups, collapsed defaults, and persisted values across three pages."
      sections={sections}
    />
  );
}
