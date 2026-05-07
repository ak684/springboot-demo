import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import AuthCheck from './AuthCheck';
import Login from 'views/pages/auth/Login';
import Home from 'views/pages/home/Home';
import Layout from 'views/layouts/Layout';
import ImpactsOverview from 'views/pages/impactsOverview/ImpactsOverview';
import AddImpact from 'views/pages/addImpact/AddImpact';
import ImpactTable from 'views/pages/impactTable/ImpactTable';
import Scoring from 'views/pages/scoring/Scoring';
import VentureContainer from 'views/containers/VentureContainer';
import AddImpactFinish from 'views/pages/addImpact/AddImpactFinish';
import AuthContainer from 'views/containers/AuthContainer';
import Dashboard from 'views/pages/dashboard/Dashboard';
import Ventures from 'views/pages/ventures/Ventures';
import VenturesOverview from 'views/pages/venturesOverview/VenturesOverview';
import ImpactWizard from '../views/pages/addImpact/ImpactWizard';
import ScoringWizard from '../views/pages/scoring/ScoringWizard';
import ScoringFinish from '../views/pages/scoring/ScoringFinish';
import ImpactContainer from '../views/containers/ImpactContainer';
import Activation from '../views/pages/activation/Activation';
import UserProfile from '../views/pages/profile/UserProfile';
import ForgotPassword from '../views/pages/auth/ForgotPassword';
import ResetPassword from '../views/pages/auth/ResetPassword';
import Welcome from '../views/pages/auth/Welcome';
import IndicatorTimeline from '../views/pages/indicators/IndicatorTimeline';
import FiveDimensionsOfImpact from '../views/pages/fiveDimensions/FiveDimensionsOfImpact';
import ScoringQuestionsContainer from '../views/containers/ScoringQuestionsContainer';
import CompanyProfile from '../views/pages/companyProfile/CompanyProfile';
import CompanyProfileFinish from '../views/pages/companyProfile/CompanyProfileFinish';
import TeamManagement from '../views/pages/teamManagement/TeamManagement';
import TeamManagementWizard from '../views/pages/teamManagement/TeamManagementWizard';
import CreateAccount from '../views/pages/createAccount/CreateAccount';
import CreationSteps from '../views/pages/creationSteps/CreationSteps';
import GooglePresentation from '../views/pages/googlePresentation/GooglePresentation';
import QuantificationWizard from "../views/pages/quantification/QuantificationWizard";
import Quantification from "../views/pages/quantification/Quantification";
import QuantificationFinish from "../views/pages/quantification/QuantificationFinish";
import Monitoring from "../views/pages/monitoring/Monitoring";
import MonitoringWizard from "../views/pages/monitoring/MonitoringWizard";
import MonitoringFinish from "../views/pages/monitoring/MonitoringFinish";
import ScoringOverview from "../views/pages/scoringOverview/ScoringOverview";
import Certification from "../views/pages/certification/Certification";
import PitchDeck from "../views/pages/pitchDeck/PitchDeck";
import PitchDeckGenerate from "../views/pages/pitchDeck/PitchDeckGenerate";
import ImpactPotential from "../views/pages/impactPotential/ImpactPotential";
import IndicatorsOverview from "../views/pages/indicatorsOverview/IndicatorsOverview";
import ScrapePortfolioData from "../views/pages/scrapePortfolio/ScrapePortfolioData";
import PortfolioContainer from "../views/containers/PortfolioContainer";
import PortfolioDashboard from "../views/pages/portfolioDashboard/PortfolioDashboard";
import Portfolios from "../views/pages/portfolios/Portfolios";
import PortfolioProfile from "../views/pages/portfolioProfile/PortfolioProfile";
import PortfolioProfileFinish from "../views/pages/portfolioProfile/PortfolioProfileFinish";
import PortfolioLayout from "../views/layouts/PortfolioLayout";
import PortfolioVentures from "views/pages/portfolioVentures/PortfolioVentures";
import Register from "../views/pages/auth/Register";
import SuperAdminStatistics from "../views/pages/superAdmin/SuperAdminStatistics";
import SuperAdminCertification from "../views/pages/superAdmin/SuperAdminCertification";
import SuperAdminCompanyExtractor from "../views/pages/superAdmin/SuperAdminCompanyExtractor";

import PatentCounter from "../views/pages/superAdmin/PatentCounter";
import CounterCreator from "../views/pages/superAdmin/CounterCreator";
import AiToc from "../views/pages/aiToc/AiToc";
import AiTocLanding from "../views/pages/aiToc/AiTocLanding";
import Page404 from "shared-components/views/pages/error/Page404";
import PublicDatabase from "shared-components/views/pages/publicDatabase/PublicDatabase";
import VenturePublicProfile from "shared-components/views/pages/venturePublicProfile/VenturePublicProfile";
import PortfolioPublicProfile from "shared-components/views/pages/portfolioPublicProfile/PortfolioPublicProfile";
import CompanyOverviewV2 from "shared-components/views/pages/companyOverviewV2/CompanyOverviewV2";
import ManagePublicProfile from "../views/pages/managePublicProfile/ManagePublicProfile";
// import PortfolioAggregatedView from "../views/pages/portfolioAggregated/PortfolioAggregatedView"; // Hidden for now
import AggregatedIndicatorWizard from "../views/pages/portfolioAggregated/AggregatedIndicatorWizard";
import AggregatedIndicator from "../views/pages/portfolioAggregated/AggregatedIndicator";
import AggregatedIndicatorsTableView from "../views/pages/portfolioAggregated/AggregatedIndicatorsTableView";
import OwnerCheck from "../views/containers/OwnerCheck";

const router = createBrowserRouter(
  createRoutesFromElements([
    <Route path='/' element={<AuthCheck><AuthContainer /></AuthCheck>}>
      <Route path='/' element={<Layout showSidebar><Home /></Layout>} exact />
      <Route path='/ventures' element={<Layout><Ventures /></Layout>} exact handle={{ breadcrumb: 'Ventures' }} />
      <Route path='/profile/scrape' element={<Layout><ScrapePortfolioData /></Layout>} exact />
      <Route
        path='/indicators-overview'
        element={<Layout><IndicatorsOverview /></Layout>}
        exact
      />
      <Route
        path='/ventures/:ventureId/scoring-wizard'
        element={<Layout showSidebar><VentureContainer reload><ImpactsOverview /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Scoring wizard' }}
      />
      <Route
        path='/ventures/:ventureId/quantification-overview'
        element={<Layout showSidebar><VentureContainer reload><ImpactsOverview /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Quantification overview' }}
      />
      <Route
        path='/ventures/:ventureId/monitoring-overview'
        element={<Layout showSidebar><VentureContainer reload><ImpactsOverview /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Monitoring overview' }}
      />
      <Route
        path='/ventures/:ventureId'
        element={<Layout showSidebar><VentureContainer><Dashboard /></VentureContainer></Layout>}
        exact
      />
      <Route
        path='/ventures/:ventureId/impacts/add'
        element={<Layout><VentureContainer><AddImpact /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'New impact' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId'
        element={<Layout><VentureContainer><ImpactContainer><AddImpact /></ImpactContainer></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Edit impact' }}
      />
      <Route
        path='/ventures/:ventureId/ai-toc'
        element={<Layout disablePadding><VentureContainer><AiToc /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'AI Theory of Change generation' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/add/wizard'
        element={<Layout disablePadding><ImpactWizard /></Layout>}
        exact
        handle={{ breadcrumb: 'New impact' }}
      />
      <Route
        path='/ventures/:ventureId/table'
        element={<Layout><VentureContainer reload><ImpactTable /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Impact logic overview' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/potential'
        element={<Layout><VentureContainer><ImpactPotential /></VentureContainer></Layout>}
        exact
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/scoring'
        element={
          <Layout>
            <VentureContainer reload forceRefresh>
              <ImpactContainer>
                <ScoringQuestionsContainer>
                  <Scoring />
                </ScoringQuestionsContainer>
              </ImpactContainer>
            </VentureContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Score impact logic' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/scoring/wizard'
        element={<Layout disablePadding><ScoringWizard /></Layout>}
        exact
        handle={{ breadcrumb: 'Score impact logic' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/finish'
        element={<Layout disablePadding><AddImpactFinish /></Layout>}
        exact
        handle={{ breadcrumb: 'New impact' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/scoring/finish'
        element={<Layout disablePadding><ScoringFinish /></Layout>}
        exact
        handle={{ breadcrumb: 'Score impact logic' }}
      />
      <Route
        path='/ventures/:ventureId/indicators'
        element={<Layout><VentureContainer reload><IndicatorTimeline /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Indicator planning' }}
      />
      <Route
        path='/ventures/:ventureId/scoring-overview'
        element={
          <Layout>
            <VentureContainer reload>
              <ScoringQuestionsContainer>
                <ScoringOverview />
              </ScoringQuestionsContainer>
            </VentureContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Scoring overview' }}
      />
      <Route
        path='/ventures/:ventureId/dimensions'
        element={
          <Layout>
            <VentureContainer reload>
              <ScoringQuestionsContainer>
                <FiveDimensionsOfImpact />
              </ScoringQuestionsContainer>
            </VentureContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Five dimensions of impact' }}
      />
      <Route
        path='/ventures/:ventureId/profile-wizard'
        element={<Layout><VentureContainer><CompanyProfile /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Edit company profile' }}
      />
      <Route
        path='/ventures/profile-wizard'
        element={<Layout><CompanyProfile /></Layout>}
        exact
        handle={{ breadcrumb: 'Create company profile' }}
      />
      <Route
        path='/ventures/:ventureId/profile-wizard/finish'
        element={<Layout disablePadding><VentureContainer reload><CompanyProfileFinish /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Company profile' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/quantification/wizard'
        element={<Layout disablePadding><QuantificationWizard /></Layout>}
        exact
        handle={{ breadcrumb: 'Quantifying your impact' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/quantification'
        element={
          <Layout>
            <VentureContainer>
              <ImpactContainer>
                <Quantification />
              </ImpactContainer>
            </VentureContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Quantifying your impact' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/quantification/finish'
        element={
          <Layout>
            <VentureContainer reload>
              <ImpactContainer>
                <QuantificationFinish />
              </ImpactContainer>
            </VentureContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Quantifying your impact' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/monitoring/wizard'
        element={<Layout disablePadding><MonitoringWizard /></Layout>}
        exact
        handle={{ breadcrumb: 'Impact monitoring' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/monitoring'
        element={
          <Layout>
            <VentureContainer>
              <ImpactContainer>
                <Monitoring />
              </ImpactContainer>
            </VentureContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Impact monitoring' }}
      />
      <Route
        path='/ventures/:ventureId/impacts/:impactId/monitoring/finish'
        element={
          <Layout>
            <VentureContainer reload>
              <ImpactContainer>
                <MonitoringFinish />
              </ImpactContainer>
            </VentureContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Impact monitoring' }}
      />
      <Route
        path='/ventures/:ventureId/google-presentation'
        element={<Layout showSidebar><VentureContainer><GooglePresentation /></VentureContainer></Layout>}
        exact
      />
      <Route
        path='/ventures/:ventureId/pitch-deck'
        element={<Layout disablePadding><VentureContainer reload><PitchDeck /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Pitch deck' }}
      />
      <Route
        path='/ventures/:ventureId/pitch-deck/generate'
        element={<Layout disablePadding><VentureContainer><PitchDeckGenerate /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Pitch deck' }}
      />
      <Route path='/profile' element={<Layout><UserProfile /></Layout>} exact handle={{ breadcrumb: 'My profile' }} />
      <Route path='/team' element={<Layout><TeamManagement /></Layout>} exact handle={{ breadcrumb: 'Your team' }} />
      <Route
        path='/team/wizard'
        element={<Layout disablePadding><TeamManagementWizard /></Layout>}
        exact
        handle={{ breadcrumb: 'Your team' }}
      />
      <Route
        path='/ventures/:ventureId/certification'
        element={<Layout><VentureContainer reload><Certification /></VentureContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Certification' }}
      />
      <Route path='/portfolios' element={<Layout><Portfolios /></Layout>} exact handle={{ breadcrumb: 'Portfolios' }} />
      <Route
        path='/portfolios/:portfolioId'
        element={
          <PortfolioLayout showSidebar><PortfolioContainer><PortfolioDashboard /></PortfolioContainer></PortfolioLayout>
        }
        exact
      />
      <Route
        path='/portfolios/:portfolioId/profile-wizard'
        element={<Layout><PortfolioContainer><PortfolioProfile /></PortfolioContainer></Layout>}
        exact
        handle={{ breadcrumb: 'Edit portfolio profile' }}
      />
      <Route
        path='/portfolios/profile-wizard'
        element={<Layout><PortfolioProfile /></Layout>}
        exact
        handle={{ breadcrumb: 'Create portfolio profile' }}
      />
      <Route
        path='/portfolios/:portfolioId/profile-wizard/finish'
        element={
          <Layout disablePadding><PortfolioContainer reload><PortfolioProfileFinish /></PortfolioContainer></Layout>
        }
        exact
        handle={{ breadcrumb: 'Company profile' }}
      />
      <Route
        path='/portfolios/:portfolioId/ventures-overview'
        element={<Layout><VenturesOverview /></Layout>}
        exact
        handle={{ breadcrumb: 'Ventures overview' }}
      />
      <Route
        path='/portfolios/:portfolioId/ventures'
        element={
          <PortfolioLayout showSidebar><PortfolioContainer><PortfolioVentures /></PortfolioContainer></PortfolioLayout>}
        exact
        handle={{ breadcrumb: 'Portfolio ventures' }}
      />
      {/* Hidden aggregated portfolio page for now */}
      {/* <Route
        path='/portfolios/:portfolioId/aggregated-view'
        element={
          <Layout disablePadding>
            <PortfolioContainer>
              <PortfolioAggregatedView />
            </PortfolioContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Aggregated Portfolio View' }}
      /> */}
      <Route
        path='/portfolios/:portfolioId/aggregated-indicators/create'
        element={
          <Layout disablePadding>
            <AggregatedIndicatorWizard />
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Create Aggregated Indicator' }}
      />
      <Route
        path='/portfolios/:portfolioId/aggregated-indicator/create'
        element={
          <Layout disablePadding>
            <AggregatedIndicator />
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Create Aggregated Indicator' }}
      />
      <Route
        path='/portfolios/:portfolioId/aggregated-indicator/:indicatorId/edit'
        element={
          <Layout disablePadding>
            <AggregatedIndicator editMode={true} />
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Edit Aggregated Indicator' }}
      />
      <Route
        path='/portfolios/:portfolioId/aggregated-indicators'
        element={
          <Layout disablePadding>
            <PortfolioContainer>
              <AggregatedIndicatorsTableView />
            </PortfolioContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Aggregated Indicators' }}
      />
      <Route
        path='/portfolios/:portfolioId/company-url-extractor'
        element={
          <Layout disablePadding>
            <PortfolioContainer>
              <SuperAdminCompanyExtractor />
            </PortfolioContainer>
          </Layout>
        }
        exact
        handle={{ breadcrumb: 'Company URL Data Extractor', breadcrumbKey: 'portfolio' }}
      />
      <Route
        path='/portfolios/:portfolioId/counters'
        element={<CounterCreator />}
        exact
        handle={{ breadcrumb: 'Continuous Counters' }}
      />
      <Route
        path='/portfolios/:portfolioId/patents'
        element={<PatentCounter />}
        exact
        handle={{ breadcrumb: 'Patent Counter' }}
      />

      {/* Superadmin-only routes (system-wide features) */}
      <Route path='/superadmin' element={<OwnerCheck><SuperAdminStatistics /></OwnerCheck>} exact />
      <Route path='/superadmin/certification' element={<OwnerCheck><SuperAdminCertification /></OwnerCheck>} exact />
      <Route path='/superadmin/company-url-extractor' element={<OwnerCheck><SuperAdminCompanyExtractor /></OwnerCheck>} exact />
    </Route>,

    // Endpoints for unauthenticated users:
    <Route path='/login' element={<Login />} exact />,
    <Route path='/register' element={<Register />} exact />,
    <Route path='/forgot' element={<ForgotPassword />} exact />,
    <Route path='/reset/:token' element={<ResetPassword />} exact />,
    <Route path='/welcome' element={<Welcome />} exact />,
    <Route path='/activate/:sessionId' element={<Activation />} exact />,
    <Route
      path='/create-account'
      element={<Layout disablePadding><CreateAccount /></Layout>}
      exact
      handle={{ breadcrumb: 'Create your account' }}
    />,
    <Route
      path='/create-account/:token'
      element={<Layout disablePadding><CreateAccount /></Layout>}
      exact
      handle={{ breadcrumb: 'Create your account' }}
    />,
    <Route path='/creation-steps' element={<CreationSteps />} exact />,
    <Route path='/pitch/:uuid' element={<PitchDeck />} exact />,
    <Route
      path='/ai-toc'
      element={<Layout disablePadding><AiToc /></Layout>}
      exact
      handle={{ breadcrumb: 'AI Theory of Change generation', beta: true }}
    />,
    <Route
      path='/ai-toc/start'
      element={<Layout disablePadding><AiTocLanding /></Layout>}
      exact
      handle={{ breadcrumb: 'AI Theory of Change generation', beta: true }}
    />,
    
    // Public profile routes (no authentication required)
    <Route
      path='/public-profile'
      element={<Layout><PublicDatabase /></Layout>}
      exact
      handle={{ breadcrumb: 'Portfolio' }}
    />,
    <Route
      path='/public-profile/ventures/:ventureId'
      element={<Layout disablePadding><VentureContainer><VenturePublicProfile /></VentureContainer></Layout>}
      exact
      handle={{ breadcrumb: 'Venture profile' }}
    />,
    <Route
      path='/public-profile/portfolios/:portfolioId'
      element={<Layout disablePadding><PortfolioContainer><PortfolioPublicProfile /></PortfolioContainer></Layout>}
      exact
      handle={{ breadcrumb: 'Portfolio profile' }}
    />,

    // Company Public Profile Editor (authenticated, portfolio access required)
    <Route
      path='/company/:companyId/edit-public-profile'
      element={<CompanyOverviewV2 initialEditMode />}
      exact
      handle={{ breadcrumb: 'Manage public profile' }}
    />,

    // Landing page for users whose only access is PUBLIC_PROFILE_ONLY
    <Route
      path='/manage-public-profile'
      element={<Layout><ManagePublicProfile /></Layout>}
      exact
      handle={{ breadcrumb: 'My profile' }}
    />,

    // Company Overview V2 routes (new design, public, no authentication required)
    <Route
      path='/company-overview'
      element={<CompanyOverviewV2 />}
      exact
      handle={{ breadcrumb: 'Company overview' }}
    />,
    <Route
      path='/company-overview/:companyId'
      element={<CompanyOverviewV2 />}
      exact
      handle={{ breadcrumb: 'Company overview' }}
    />,

    <Route path='/404' element={<Page404 />} />,
    <Route path='*' element={<Page404 />} />
  ])
);

export default router;
