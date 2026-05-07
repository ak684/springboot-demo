import GenericWizardStep from '../components/GenericWizardStep';
import { wizardSteps } from './wizardConfig';

export const getSteps = () => wizardSteps.map(config => ({
  name: config.name,
  component: GenericWizardStep,
  props: { config }
}));
