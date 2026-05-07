export const getHelpSteps = () => {
  return [
    {
      element: 'ai-toc-title-cell',
      name: 'aiTocHelp1',
      position: (position) => ({ ...position, top: position.top - 55 }),
      subtitle: 'This metrics system measures your most important positive sustainability outcomes...',
    },
    {
      element: 'ai-toc-first-negative',
      name: 'aiTocHelp2',
      position: (position) => ({ ...position, top: position.top - 55 }),
      subtitle: '...and your most important negative sustainability outcomes',
    },
    {
      element: 'ai-toc-status-quo-cell',
      name: 'aiTocHelp3',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'This is what people would use, if your innovation did not exist',
    },
    {
      element: 'ai-toc-innovation-cell',
      name: 'aiTocHelp4',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'This is what you do differently compared to the status quo',
    },
    {
      element: 'ai-toc-stakeholders-cell',
      name: 'aiTocHelp5',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'These are the stakeholders benefiting from your innovation',
    },
    {
      element: 'ai-toc-change-cell',
      name: 'aiTocHelp6',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'This is the change experienced by stakeholders',
    },
    {
      element: 'ai-toc-output-units-cell',
      name: 'aiTocHelp7',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'These are suggested products/services/activities that you can forecast',
    },
    {
      element: 'ai-toc-indicators-cell',
      name: 'aiTocHelp8',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'These indicators should measure the change you create pre vs. post of your innovation',
    },
    {
      element: 'ai-toc-sdgs-cell',
      name: 'aiTocHelp9',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'Hover over the Sustainable Development Goals to see to which of the 169 SDG targets and corresponding 247 indicators we attribute your impact. As the SDGs measure country level performance, we suggest you should use specific indicators tailored to your venture\'s activities',
    },
    {
      element: 'feedback-button',
      name: 'aiTocHelp10',
      position: (position) => ({ ...position, top: position.top - 75 }),
      subtitle: 'You can contact us through this form if you have any questions',
    },
  ];
};
