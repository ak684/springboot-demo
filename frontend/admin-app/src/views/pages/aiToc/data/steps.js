import AiTocTextInput from "../components/AiTocTextInput";
import AiTocAiQuestion from "../components/AiTocAiQuestion";
import AiTocResult from "../components/AiTocResult";

export const getSteps = (refining) => {
  const result = [
    {
      name: 'name',
      component: AiTocTextInput,
      props: {
        name: 'name',
        title: 'Venture name',
        description: 'Please provide your venture\'s name below:',
        required: true,
      }
    },
    {
      name: 'url',
      component: AiTocTextInput,
      props: {
        name: 'url',
        title: 'Website',
        description: 'Choose a page that either describes your products or your impact (our Al does not consider subpages).',
      }
    },
    {
      name: 'activities',
      component: AiTocTextInput,
      props: {
        name: 'activities',
        title: 'Key activities of your Venture?',
        description: 'Describe key innovations, that you believe lead to sustainability impact.',
      }
    },
    {
      name: 'geography',
      component: AiTocTextInput,
      props: {
        name: 'geography',
        title: '5-year outlook geographic range / market presence',
        description: 'Describe briefly in which geographic regions you intend to be active within the next 5 years',
      }
    },
    {
      name: 'questions[0]',
      component: AiTocAiQuestion,
      props: {
        name: 'questions[0]',
        index: 0,
      }
    },
    {
      name: 'questions[1]',
      component: AiTocAiQuestion,
      props: {
        name: 'questions[1]',
        index: 1,
      }
    },
    {
      name: 'questions[2]',
      component: AiTocAiQuestion,
      props: {
        name: 'questions[2]',
        index: 2,
      }
    },
    {
      name: 'result',
      component: AiTocResult,
    },
  ];

  if (refining) {
    const refineStep = {
      name: 'instructions',
      component: AiTocTextInput,
      props: {
        name: 'instructions',
        title: 'Refinement',
        description: 'Provide the refinement prompt for AI',
        required: true,
      }
    };
    result.splice(6, 0, refineStep);
  }

  return result;
};
