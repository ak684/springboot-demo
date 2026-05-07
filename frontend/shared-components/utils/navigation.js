import store from 'store';
import router from 'routes/router';
import { configSelectors } from "store/ducks/config";
import { ventureSelectors } from "store/ducks/venture";
import { pitchGenerated } from "./pitch";

const goToImpactCreation = (ventureId) => {
  const { hideImpactWizard } = configSelectors.getUserConfig()(store.getState());

  if (hideImpactWizard) {
    router.navigate(`/ventures/${ventureId}/impacts/add?step=0`);
  } else {
    router.navigate(`/ventures/${ventureId}/impacts/add/wizard`);
  }
}

const goToScoring = (ventureId, impactId) => {
  const { hideScoringWizard } = configSelectors.getUserConfig()(store.getState());

  if (hideScoringWizard) {
    router.navigate(`/ventures/${ventureId}/impacts/${impactId}/scoring?step=0`);
  } else {
    router.navigate(`/ventures/${ventureId}/impacts/${impactId}/scoring/wizard`);
  }
}

const goToTeamManagement = () => {
  const { hideTeamManagementWizard } = configSelectors.getUserConfig()(store.getState());

  if (hideTeamManagementWizard) {
    router.navigate(`/team`);
  } else {
    router.navigate(`/team/wizard`);
  }
}

const goToQuantification = (ventureId, impactId) => {
  const { hideQuantificationWizard } = configSelectors.getUserConfig()(store.getState());

  if (hideQuantificationWizard) {
    router.navigate(`/ventures/${ventureId}/impacts/${impactId}/quantification?step=0`);
  } else {
    router.navigate(`/ventures/${ventureId}/impacts/${impactId}/quantification/wizard`);
  }
}

const goToMonitoring = (ventureId, impactId) => {
  const { hideMonitoringWizard } = configSelectors.getUserConfig()(store.getState());

  if (hideMonitoringWizard) {
    router.navigate(`/ventures/${ventureId}/impacts/${impactId}/monitoring?step=0`);
  } else {
    router.navigate(`/ventures/${ventureId}/impacts/${impactId}/monitoring/wizard`);
  }
}

const goToPitch = (ventureId) => {
  const venture = ventureSelectors.getCurrentVenture(ventureId)(store.getState());

  if (pitchGenerated(venture)) {
    router.navigate(`/ventures/${ventureId}/pitch-deck?step=0`);
  } else {
    router.navigate(`/ventures/${ventureId}/pitch-deck/generate`);
  }
}

export default {
  goToImpactCreation,
  goToTeamManagement,
  goToScoring,
  goToQuantification,
  goToMonitoring,
  goToPitch
};
