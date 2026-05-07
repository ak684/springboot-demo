import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Link,
  IconButton,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useParams, useNavigate } from 'react-router-dom';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { styled } from '@mui/material/styles';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedIcon from '@mui/icons-material/Verified';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import LinkIcon from '@mui/icons-material/Link';
import { toast } from 'react-toastify';
import { v1 } from 'services/api';
import Loader from '../../components/Loader';
import Logo from '../../components/Logo';
import { GoogleMap, LoadScriptNext, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAP_API_KEY || '';

const PageContainer = styled(Box)(() => ({
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
}));

const HeaderNav = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  padding: '16px 48px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

const NavItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  padding: '8px 12px',
  '&:hover': {
    color: '#111827',
  },
}));

const MainContent = styled(Box)(() => ({
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '32px 48px',
}));

const Breadcrumb = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '24px',
  fontSize: '13px',
  color: '#6b7280',
}));

const BreadcrumbLink = styled(Typography)(() => ({
  fontSize: '13px',
  color: '#6b7280',
  cursor: 'pointer',
  '&:hover': {
    color: '#111827',
  },
}));

const BreadcrumbCurrent = styled(Typography)(() => ({
  fontSize: '13px',
  color: '#111827',
  fontWeight: 500,
}));

const UnverifiedBadge = styled(Box)(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%)',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '24px',
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
  },
}));

const IndustryTag = styled(Typography)(() => ({
  fontSize: '12px',
  fontWeight: 500,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const TagSeparator = styled(Typography)(() => ({
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0 8px',
}));

const WhiteCard = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
}));

const ProfileActivityCard = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '20px 24px',
  minWidth: '280px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
}));

const TrendingBar = styled(Box)(() => ({
  height: '16px',
  borderRadius: '8px',
  background: 'linear-gradient(90deg, #22c55e 0%, #14b8a6 50%, #06b6d4 100%)',
  marginTop: '12px',
  marginBottom: '8px',
}));

const InfoIcon = styled(Box)(() => ({
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 700,
  flexShrink: 0,
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.15)',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
  },
}));

const AI_GENERATED_TOOLTIP = (
  <Typography
    sx={{
      fontSize: '12px',
      fontWeight: 600,
      background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}
  >
    AI GENERATED, NOT VERIFIED BY COMPANY
  </Typography>
);

const UNVERIFIED_BADGE_TOOLTIP = (
  <Box>
    <Typography
      sx={{
        fontSize: '13px',
        fontWeight: 600,
        background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 1,
      }}
    >
      This company profile is AI generated
    </Typography>
    <Typography sx={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
      AI content may be incorrect or misleading. If you find any errors or have concerns, you can claim and edit your profile, if you work for the company, or provide feedback and requests for edit, using the top right ellipse buttons.
    </Typography>
  </Box>
);

const LogoContainer = styled(Box)(() => ({
  width: '160px',
  height: '160px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
}));

const IconBox = styled(Box)(() => ({
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  backgroundColor: '#f6f8ec',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    color: '#10b981',
    fontSize: '24px',
  },
}));

const MetricItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
}));

const MetricLabel = styled(Typography)(() => ({
  fontSize: '11px',
  fontWeight: 500,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
}));

const MetricValue = styled(Typography)(() => ({
  fontSize: '18px',
  fontWeight: 600,
  color: '#111827',
}));

const SectionTitle = styled(Typography)(() => ({
  fontSize: '18px',
  fontWeight: 600,
  color: '#111827',
  textAlign: 'center',
  marginBottom: '24px',
}));

const ProductRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  padding: '20px 24px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  marginBottom: '12px',
  position: 'relative',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '12px',
    padding: '2px',
    background: 'linear-gradient(90deg, #22c55e 0%, #14b8a6 50%, #06b6d4 100%)',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out',
    pointerEvents: 'none',
  },
  '&:hover::before': {
    opacity: 1,
  },
  '&:hover': {
    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)',
  },
  '&:last-child': {
    marginBottom: 0,
  },
}));

const ProductTitle = styled(Typography)(() => ({
  fontSize: '15px',
  fontWeight: 600,
  color: '#111827',
  width: '130px',
  flexShrink: 0,
  marginRight: '24px',
}));

const ProductDescription = styled(Typography)(() => ({
  fontSize: '15px',
  color: '#374151',
  lineHeight: 1.7,
  flex: 1,
}));

const NewsCard = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
}));

const NewsHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
}));

const NewsSource = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}));

const SourceLogo = styled(Box)(() => ({
  width: '40px',
  height: '40px',
  borderRadius: '4px',
  backgroundColor: '#111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 700,
}));

const CTASection = styled(Box)(() => ({
  backgroundColor: '#f0f9ff',
  borderRadius: '16px',
  padding: '48px',
  textAlign: 'center',
  marginTop: '32px',
}));

const SocialButton = styled(IconButton)(({ bgcolor }) => ({
  width: '48px',
  height: '48px',
  backgroundColor: bgcolor,
  color: '#ffffff',
  '&:hover': {
    backgroundColor: bgcolor,
    opacity: 0.9,
  },
}));

const PaginationDots = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '16px',
}));

const Dot = styled(Box)(({ active }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: active ? '#3b82f6' : '#d1d5db',
  cursor: 'pointer',
}));

const BlogCard = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  transition: 'filter 0.2s ease-in-out',
  '&:hover': {
    filter: 'saturate(1.2) brightness(1.02)',
  },
}));

const SDGBar = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '16px',
}));

const SDGIcon = styled(Box)(({ bgcolor }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  backgroundColor: bgcolor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '14px',
}));

const CertificationCard = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '48px 24px',
  textAlign: 'center',
  minHeight: '220px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
}));

const Footer = styled(Box)(() => ({
  background: 'linear-gradient(90deg, #5FA494 0%, #7CB174 50%, #ACC369 100%)',
  color: '#ffffff',
  padding: '32px 48px 96px 48px',
  marginTop: '48px',
  textAlign: 'center',
}));

const EditHeaderBar = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  padding: '14px 48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const BackLink = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  cursor: 'pointer',
  '&:hover': { color: '#111827' },
}));

const InlineControlButton = styled(IconButton)(() => ({
  width: 32,
  height: 32,
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#374151',
  padding: 0,
  '&:hover': { backgroundColor: '#f3f4f6' },
  '& svg': { fontSize: 16 },
}));

const InlineControlsStack = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  alignSelf: 'flex-start',
  flexShrink: 0,
}));

const FORM_FIELDS = [
  'companyName', 'companyDescription', 'companyLogo', 'companyUrl',
  'headquarterAddress', 'industrySectors', 'ceoName', 'legalForm',
  'legalEntityFormationDate', 'numberOfEmployees', 'contactEmail',
  'certificationName', 'certificationLink', 'prizeAwardName1',
  'prizeAwardLink1', 'prizeAwardName2', 'prizeAwardLink2',
  'esgImpactReport', 'esgReportYear', 'esgReportLink',
];

const generateProductId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}`
    + `_${Math.random().toString(36).slice(2, 10)}`;
};

const mapApiToForm = (data) => {
  const products = data.core_products_services?.items || [];
  const social = data.social_media_links || {};
  const translations = data.company_description_translations || {};
  return {
    companyName: data.company_name || '',
    companyDescription: data.company_description || '',
    companyDescriptionEn: translations.en || '',
    companyDescriptionDe: translations.de || '',
    companyDescriptionEnAuto: !!translations.en_auto_translated,
    companyDescriptionDeAuto: !!translations.de_auto_translated,
    companyLogo: data.company_logo || '',
    companyUrl: data.company_url || '',
    headquarterAddress: data.headquarter_address || '',
    industrySectors: data.industry_sectors
      ? (Array.isArray(data.industry_sectors)
        ? data.industry_sectors.join(', ')
        : data.industry_sectors)
      : '',
    ceoName: data.ceo_name || '',
    legalForm: data.legal_form || '',
    legalEntityFormationDate: data.legal_entity_formation_date || '',
    numberOfEmployees: data.number_of_employees || '',
    contactEmail: data.contact_email || '',
    certificationName: data.certification_name || '',
    certificationLink: data.certification_link || '',
    prizeAwardName1: data.prize_award_name_1 || '',
    prizeAwardLink1: data.prize_award_link_1 || '',
    prizeAwardName2: data.prize_award_name_2 || '',
    prizeAwardLink2: data.prize_award_link_2 || '',
    esgImpactReport: data.esg_impact_report || false,
    esgReportYear: data.esg_report_year || '',
    esgReportLink: data.esg_report_link || '',
    products: products.map((p) => ({
      id: p.id || generateProductId(),
      // Bilingual storage with legacy-flat fallback so frontend
      // sample data and not-yet-backfilled rows still render.
      // The backend's editor-mode read resolves these values
      // verbatim per language; the fallback keeps SAMPLE_DATA
      // (flat title/description) and the public viewer's
      // resolved single-language items both usable.
      titleEn: p.title_en || (p.title || ''),
      titleDe: p.title_de || '',
      descriptionEn: p.description_en || (p.description || ''),
      descriptionDe: p.description_de || '',
      titleEnAuto: !!p.title_en_auto_translated,
      titleDeAuto: !!p.title_de_auto_translated,
      descriptionEnAuto: !!p.description_en_auto_translated,
      descriptionDeAuto: !!p.description_de_auto_translated,
    })),
    socialMediaLinks: {
      facebook: social.facebook || '',
      linkedin: social.linkedin || '',
      twitter: social.twitter || '',
      instagram: social.instagram || '',
      youtube: social.youtube || '',
    },
  };
};

const mapFormToApi = (form, language = 'en') => {
  const payload = {};
  FORM_FIELDS.forEach((key) => {
    if (key === 'companyDescription') return;
    if (form[key] !== '' && form[key] !== null && form[key] !== undefined) {
      payload[key] = form[key];
    }
  });
  // companyDescription is bilingual (#517): the active-tab
  // value goes on the request and the backend routes it to
  // the language column based on the `language` field. Send
  // even when blank so an intentional clear is preserved.
  const activeDescription = language === 'de'
    ? form.companyDescriptionDe
    : form.companyDescriptionEn;
  if (activeDescription !== null && activeDescription !== undefined) {
    payload.companyDescription = activeDescription;
  }
  payload.language = language;
  if (form.products.length > 0) {
    // Bilingual products (#524): the editor stores both
    // languages per item; the save flattens the active-language
    // values onto title/description for the backend, which
    // routes them onto the language column for this save.
    const activeTitleKey = language === 'de' ? 'titleDe' : 'titleEn';
    const activeDescKey = language === 'de'
      ? 'descriptionDe' : 'descriptionEn';
    const items = form.products
      .map((p) => ({
        id: p.id,
        title: p[activeTitleKey] || '',
        description: p[activeDescKey] || '',
      }))
      .filter((p) => p.title || p.description);
    if (items.length > 0) {
      payload.coreProductsServices = {
        category_title: '',
        items,
      };
    }
  }
  const socialHasValues = Object.values(form.socialMediaLinks).some((v) => v);
  if (socialHasValues) {
    payload.socialMediaLinks = form.socialMediaLinks;
  }
  return payload;
};

const SECTION_KEYS = {
  OVERVIEW: 'overview',
  METRICS: 'metrics',
  WHAT_WE_DO: 'whatWeDo',
  RECENT_NEWS: 'recentNews',
  SOCIAL_MEDIA: 'socialMedia',
  REPORTS: 'reports',
  SDG: 'sdg',
  CERTIFICATIONS: 'certifications',
  CONTACT: 'contact',
};

const DEFAULT_SECTION_VISIBILITY = {
  [SECTION_KEYS.OVERVIEW]: true,
  [SECTION_KEYS.METRICS]: true,
  [SECTION_KEYS.WHAT_WE_DO]: true,
  [SECTION_KEYS.RECENT_NEWS]: true,
  [SECTION_KEYS.SOCIAL_MEDIA]: true,
  [SECTION_KEYS.REPORTS]: true,
  [SECTION_KEYS.SDG]: true,
  [SECTION_KEYS.CERTIFICATIONS]: true,
  [SECTION_KEYS.CONTACT]: true,
};

const EditableSectionWrapper = ({
  children,
  sectionKey,
  sectionVisibility,
  editMode,
}) => {
  if (!editMode || !sectionKey || !sectionVisibility) {
    return <>{children}</>;
  }
  const hidden = !sectionVisibility[sectionKey];
  return (
    <Box sx={{ opacity: hidden ? 0.4 : 1 }}>
      {children}
    </Box>
  );
};

const SectionTitleRow = ({
  children,
  sectionKey,
  sectionVisibility,
  onToggleSection,
  editMode,
}) => {
  const showToggle = !!(editMode && sectionKey && sectionVisibility && onToggleSection);
  const hidden = showToggle && !sectionVisibility[sectionKey];
  return (
    <Box sx={{ position: 'relative', mb: '24px' }}>
      <SectionTitle sx={{ mb: 0 }}>{children}</SectionTitle>
      {showToggle && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <FormControlLabel
            control={(
              <Switch
                checked={!hidden}
                onChange={() => onToggleSection(sectionKey)}
                inputProps={{ 'aria-label': 'toggle-section-visibility' }}
                size='small'
              />
            )}
            label={hidden ? 'Section hidden' : 'Section visible'}
            labelPlacement='start'
            sx={{
              ml: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: hidden ? '#6b7280' : '#374151',
                mr: 1,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

const InlineControls = ({ onHide, onDelete, hidden }) => (
  <InlineControlsStack>
    {onHide && (
      <Tooltip title={hidden ? 'Show' : 'Hide'} placement='left' arrow>
        <InlineControlButton onClick={onHide} aria-label='hide'>
          <VisibilityOffOutlinedIcon
            sx={{ color: hidden ? '#0ea5e9' : '#374151' }}
          />
        </InlineControlButton>
      </Tooltip>
    )}
    {onDelete && (
      <Tooltip title='Delete' placement='left' arrow>
        <InlineControlButton onClick={onDelete} aria-label='delete'>
          <DeleteOutlineIcon />
        </InlineControlButton>
      </Tooltip>
    )}
  </InlineControlsStack>
);

const SAMPLE_DATA = {
  company_name: 'Nosh Biofoods GmbH',
  company_logo: '/images/nosh-logo.png',
  company_description: 'Nosh.bio produces clean-label, highly functional protein ingredients from non-GMO fungal (koji/mycelium) biomass through a proprietary fermentation platform, enabling food manufacturers to improve taste, texture and nutrition in meat, seafood, dairy and other applications while reducing environmental impact...',
  headquarter_address: 'Johann-Hittorf-Straße 8, 12489 Berlin',
  company_url: 'www.nosh.bio',
  industry_sectors: ['BIOTECHNOLOGY & ENVIRONMENT', 'ALTERNATIVE PROTEIN', 'FERMENTATION BIOTECHNOLOGY', 'FOODTECH'],
  ceo_name: 'Tim Fronzek, Raf S',
  ceo_photo: '/images/ceo-photo.jpg',
  legal_form: 'GmbH',
  legal_entity_formation_date: '2022',
  number_of_employees: '51-100',
  core_products_services: {
    category_title: 'What we do',
    items: [
      {
        title: 'Koji Protein (Mycoprotein)',
        description: 'This is our core: a nutritious, non-GMO protein from fungi. A versatile, clean-label ingredient for food makers, it offers great taste and texture.'
      },
      {
        title: 'Koji Chunks (Finished Product)',
        description: 'An example of our ingredients in action, Koji Chunks are single-ingredient, clean-label meat analogues made from our fermented fungi.'
      },
      {
        title: 'Meat & Seafood Analogues',
        description: 'Our Koji Protein excels in plant-based meat and seafood, creating realistic textures and juiciness without off-tastes or extra stabilizers.'
      },
      {
        title: 'Bakery & Dairy Applications',
        description: 'Our Koji Protein is a functional ingredient for sweet and dairy products, replacing eggs and acting as a natural thickener/stabilizer for cleaner labels.'
      },
      {
        title: 'Diverse Food Applications',
        description: "Our Koji Protein's versatility extends widely. Its texturizing, stabilizing, and foaming properties make it ideal for sauces, beverages, pet food etc."
      }
    ]
  },
  recent_news: [
    {
      title: 'Nosh won the Gründerszene Awards 2024 "Impact Edition"',
      date: '24 Feb 2025',
      source: 'Nosh.bio',
      platform: 'facebook',
      image: '/images/news-1.jpg',
      tags: ['#Impact Edition', '#Gründerszene Awards']
    },
    {
      title: 'As you might remember, we\'ve been working closely with Barilla Group since announcing our collaboration...',
      date: 'June 2025',
      source: 'Nosh.bio',
      platform: 'linkedin',
      image: '/images/news-2.jpg',
      tags: ['#TheJoyOfFood', '#Noshbio']
    },
    {
      title: 'Nosh won the Gründerszene Awards 2024 "Impact Edition"',
      date: '24 Feb 2025',
      source: 'Nosh.bio',
      platform: 'twitter',
      image: '/images/news-3.jpg',
      tags: ['#ImpactEdition', '#GründerszeneAwards']
    }
  ],
  blog_posts: [
    {
      title: 'Top 10 high Impact WISTA companies',
      description: 'Discover how we are advancing our commitment to environmental, social impact and strong governance.',
      link: 'View details',
      image: '/images/icons/report-icon-1.svg',
      tag: 'June 2024'
    },
    {
      title: 'Latest ESG report available!',
      description: 'Discover how we are advancing our commitment to environmental, responsibility, social impact, and strong governance.',
      link: 'New ESG report',
      image: '/images/icons/report-icon-2.svg',
      tag: 'Report 2024'
    }
  ],
  sdg_contributions: [
    { sdg: 4, label: 'Quality education', percentage: 25, color: '#C5192D' },
    { sdg: 13, label: 'Climate action', percentage: 42, color: '#3F7E44' },
    { sdg: 15, label: 'Life on land', percentage: 18, color: '#56C02B' },
    { sdg: 12, label: 'Responsible consumption', percentage: 11, color: '#BF8B2E' },
    { sdg: 7, label: 'Affordable and clean energy', percentage: 5, color: '#FCC30B' }
  ],
  certifications: [
    {
      name: 'Ecotrophelia Awards 2024 - Impact Edition',
      description: 'Ultimate Recognition for Industry Leadership, Food Excellence for Clean Labels.',
      link: 'View certificate'
    },
    {
      name: 'Best Nutritional Solution for Clean Labels - Germany 2024',
      organization: 'RealEstate Insider',
      description: 'Ultimate Recognition for Industry Leadership.',
      link: 'View certificate'
    }
  ],
  social_media_links: {
    facebook: 'https://facebook.com/noshbio',
    twitter: 'https://twitter.com/noshbio',
    linkedin: 'https://linkedin.com/company/noshbio',
  },
  contact_email: 'Contact@nosh.bio',
};

const buildCertifications = (apiData) => {
  const certs = [];
  if (apiData.certification_name) {
    certs.push({
      slotKey: 'primary',
      name: apiData.certification_name,
      description: 'Certified company with verified credentials.',
      url: apiData.certification_link || '',
      linkLabel: 'View certificate',
    });
  }
  if (apiData.prize_award_name_1) {
    certs.push({
      slotKey: 'award1',
      name: apiData.prize_award_name_1,
      description: 'Industry recognition for excellence.',
      url: apiData.prize_award_link_1 || '',
      linkLabel: 'View award',
    });
  }
  if (apiData.prize_award_name_2) {
    certs.push({
      slotKey: 'award2',
      name: apiData.prize_award_name_2,
      description: 'Industry recognition for excellence.',
      url: apiData.prize_award_link_2 || '',
      linkLabel: 'View award',
    });
  }
  if (certs.length === 0) {
    return (SAMPLE_DATA.certifications || []).map((c, i) => ({
      ...c,
      slotKey: `sample${i}`,
      url: '',
      linkLabel: c.link || 'View certificate',
    }));
  }
  return certs;
};

const HIDDEN_ITEM_KEYS = ['products', 'reports', 'sdg',
  'certifications'];

const hiddenPayloadToState = (payload) => {
  const safe = payload && typeof payload === 'object'
    ? payload : {};
  const sectionsList = Array.isArray(safe.sections)
    ? safe.sections : [];
  const itemsState = {
    products: {}, reports: {}, sdg: {}, certifications: {},
  };
  HIDDEN_ITEM_KEYS.forEach((listKey) => {
    const arr = Array.isArray(safe[listKey]) ? safe[listKey] : [];
    arr.forEach((key) => {
      if (key !== null && key !== undefined) {
        itemsState[listKey][key] = true;
      }
    });
  });
  return { sectionsList, itemsState };
};

const applyHiddenSectionsToVisibility = (sectionsList) => {
  const visibility = { ...DEFAULT_SECTION_VISIBILITY };
  (sectionsList || []).forEach((key) => {
    if (key in visibility) visibility[key] = false;
  });
  return visibility;
};

const normalizePayloadKey = (key) => {
  const asNum = Number(key);
  return Number.isInteger(asNum)
    && String(asNum) === key ? asNum : key;
};

const CLEARED_FIELD_FORM_KEYS = {
  esgReport: ['esgImpactReport', 'esgReportYear', 'esgReportLink'],
  certPrimary: ['certificationName', 'certificationLink'],
  certAward1: ['prizeAwardName1', 'prizeAwardLink1'],
  certAward2: ['prizeAwardName2', 'prizeAwardLink2'],
};

const CLEARED_FIELD_API_KEYS = {
  esgReport: ['esg_impact_report', 'esg_report_year', 'esg_report_link'],
  certPrimary: ['certification_name', 'certification_link'],
  certAward1: ['prize_award_name_1', 'prize_award_link_1'],
  certAward2: ['prize_award_name_2', 'prize_award_link_2'],
};

const applyLocalClears = (formValue, clearedKeys) => {
  if (!formValue || !clearedKeys || clearedKeys.length === 0) {
    return formValue;
  }
  const next = { ...formValue };
  clearedKeys.forEach((k) => {
    const fields = CLEARED_FIELD_FORM_KEYS[k] || [];
    fields.forEach((f) => { next[f] = ''; });
  });
  return next;
};

const applyLocalClearsToData = (dataValue, clearedKeys) => {
  if (!dataValue || !clearedKeys || clearedKeys.length === 0) {
    return dataValue;
  }
  const next = { ...dataValue };
  clearedKeys.forEach((k) => {
    const fields = CLEARED_FIELD_API_KEYS[k] || [];
    fields.forEach((f) => { next[f] = ''; });
  });
  if (next.certifications) {
    next.certifications = next.certifications.filter(
      (c) => c.name,
    );
  }
  return next;
};

const buildHiddenPayload = (sectionVisibility, hiddenItems) => {
  const sections = Object.entries(sectionVisibility)
    .filter(([, visible]) => visible === false)
    .map(([key]) => key);
  const payload = { sections };
  HIDDEN_ITEM_KEYS.forEach((listKey) => {
    const map = hiddenItems[listKey] || {};
    payload[listKey] = Object.entries(map)
      .filter(([, hidden]) => !!hidden)
      .map(([k]) => normalizePayloadKey(k));
  });
  return payload;
};

const CompanyOverviewV2 = ({ initialEditMode = false }) => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsPage, setNewsPage] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const editMode = initialEditMode;
  const [form, setForm] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sectionVisibility, setSectionVisibility] = useState(
    DEFAULT_SECTION_VISIBILITY,
  );
  const [hiddenItems, setHiddenItems] = useState({
    products: {}, reports: {}, sdg: {}, certifications: {},
  });
  const [pendingClears, setPendingClears] = useState({});
  const [originalHiddenPayload, setOriginalHiddenPayload] =
    useState(null);
  const [logoMenuAnchor, setLogoMenuAnchor] = useState(null);
  const [logoUrlInput, setLogoUrlInput] = useState(false);
  const logoFileInputRef = useRef(null);
  const sectorInputRef = useRef(null);
  const [language, setLanguage] = useState('en');
  const [translatingTarget, setTranslatingTarget] = useState(null);
  const [manualTranslating, setManualTranslating] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  const isEditing = editMode;
  const currentHiddenPayload = buildHiddenPayload(
    sectionVisibility, hiddenItems);
  const hasPendingClears = Object.values(pendingClears)
    .some(Boolean);
  const isDirty = (!!form && !!originalForm
      && JSON.stringify(form) !== JSON.stringify(originalForm))
    || (originalHiddenPayload !== null
      && JSON.stringify(currentHiddenPayload)
        !== JSON.stringify(originalHiddenPayload))
    || hasPendingClears;

  useEffect(() => {
    if (!editMode) return undefined;
    const handler = (e) => {
      if (!isDirty) return undefined;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editMode, isDirty]);

  useEffect(() => {
    if (!companyId) {
      setAccessChecked(true);
      return;
    }
    const checkAccess = async () => {
      try {
        await v1.get(`/companies/${companyId}/public-profile-access`);
        setCanEdit(true);
      } catch {
        setCanEdit(false);
      } finally {
        setAccessChecked(true);
      }
    };
    checkAccess();
  }, [companyId]);

  useEffect(() => {
    if (initialEditMode && accessChecked && !canEdit) {
      toast.error("You don't have permission to edit this profile");
      navigate(`/company-overview/${companyId}`, { replace: true });
    }
  }, [initialEditMode, accessChecked, canEdit, companyId, navigate]);

  const handleFormChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleProductChange = useCallback((index, key) => (e) => {
    setForm((prev) => {
      const updated = [...prev.products];
      // Map the active-tab field ('title' / 'description') onto
      // the bilingual storage key for the current language so the
      // user's edit is owned in the active language only.
      // Clearing the auto flag here mirrors the per-field
      // user-ownership rule from #523.
      const langSuffix = language === 'de' ? 'De' : 'En';
      const valueKey = `${key}${langSuffix}`;
      const autoKey = `${valueKey}Auto`;
      updated[index] = {
        ...updated[index],
        [valueKey]: e.target.value,
        [autoKey]: false,
      };
      return { ...prev, products: updated };
    });
  }, [language]);

  const addProduct = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, {
        id: generateProductId(),
        titleEn: '', titleDe: '',
        descriptionEn: '', descriptionDe: '',
        titleEnAuto: false, titleDeAuto: false,
        descriptionEnAuto: false, descriptionDeAuto: false,
      }],
    }));
  }, []);

  const removeProduct = useCallback((productId) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
    setHiddenItems((prev) => {
      const next = { ...prev.products };
      delete next[productId];
      return { ...prev, products: next };
    });
  }, []);

  const handleSocialChange = useCallback((platform) => (e) => {
    setForm((prev) => ({
      ...prev,
      socialMediaLinks: {
        ...prev.socialMediaLinks, [platform]: e.target.value,
      },
    }));
  }, []);

  const toggleSection = useCallback((key) => {
    setSectionVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleItemHidden = useCallback((listKey, itemKey) => {
    setHiddenItems((prev) => ({
      ...prev,
      [listKey]: {
        ...prev[listKey],
        [itemKey]: !prev[listKey][itemKey],
      },
    }));
  }, []);

  const clearField = useCallback((fieldKey) => {
    setPendingClears((prev) => ({ ...prev, [fieldKey]: true }));
  }, []);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const payload = mapFormToApi(form, language);
      const hiddenPayload = buildHiddenPayload(
        sectionVisibility, hiddenItems);
      payload.hiddenProfileElements = hiddenPayload;
      const clearedKeys = Object.entries(pendingClears)
        .filter(([, v]) => !!v).map(([k]) => k);
      if (clearedKeys.length > 0) {
        payload.clearedFields = clearedKeys;
      }
      const otherLang = language === 'de' ? 'en' : 'de';
      const otherKey = otherLang === 'de'
        ? 'companyDescriptionDe'
        : 'companyDescriptionEn';
      const otherWasBlank = !(form[otherKey] || '').trim();
      const otherWasAuto = !!form[`${otherKey}Auto`];
      const activeHasContent =
        !!(payload.companyDescription || '').trim();
      const willTriggerDescTranslation = activeHasContent
        && (otherWasBlank || otherWasAuto);
      // Per-product check (#524): trigger the translation poll
      // when any product item has active-language content and
      // the other-language slot is either blank or still
      // auto-translated. Mirrors the per-field rule above.
      const activeTitleKey = language === 'de'
        ? 'titleDe' : 'titleEn';
      const activeDescKey = language === 'de'
        ? 'descriptionDe' : 'descriptionEn';
      const otherTitleKey = otherLang === 'de'
        ? 'titleDe' : 'titleEn';
      const otherDescKey = otherLang === 'de'
        ? 'descriptionDe' : 'descriptionEn';
      const willTriggerProductTranslation = (form.products || [])
        .some((p) => {
          const aTitle = (p[activeTitleKey] || '').trim();
          const aDesc = (p[activeDescKey] || '').trim();
          const oTitleBlank = !(p[otherTitleKey] || '').trim();
          const oDescBlank = !(p[otherDescKey] || '').trim();
          const oTitleAuto = !!p[`${otherTitleKey}Auto`];
          const oDescAuto = !!p[`${otherDescKey}Auto`];
          const titleNeeds =
            !!aTitle && (oTitleBlank || oTitleAuto);
          const descNeeds =
            !!aDesc && (oDescBlank || oDescAuto);
          return titleNeeds || descNeeds;
        });
      const willTriggerTranslation = willTriggerDescTranslation
        || willTriggerProductTranslation;
      await v1.patch(`/companies/${companyId}/public-profile`, payload);
      // Optimistically reflect the cleared columns in both
      // the form (edit view) and companyData (public view)
      // so the deleted item disappears without a refetch.
      if (clearedKeys.length > 0) {
        setForm((prev) => applyLocalClears(prev, clearedKeys));
        setCompanyData((prev) => applyLocalClearsToData(
          prev, clearedKeys));
      }
      setOriginalForm(applyLocalClears(form, clearedKeys));
      setOriginalHiddenPayload(hiddenPayload);
      setPendingClears({});
      toast.success('Public profile updated successfully');
      if (willTriggerTranslation) {
        startTranslationPoll(otherLang);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleBackToProfile = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/company-overview/${companyId}`);
    }
  };

  const handleLanguageToggle = (event, nextLanguage) => {
    if (!nextLanguage || nextLanguage === language) return;
    if (isDirty) {
      setPendingLanguage(nextLanguage);
      return;
    }
    setLanguage(nextLanguage);
  };

  const cancelLanguageSwitch = () => {
    setPendingLanguage(null);
  };

  const startTranslationPoll = (targetLang) => {
    setTranslatingTarget(targetLang);
    const targetKey = targetLang === 'de'
      ? 'companyDescriptionDe'
      : 'companyDescriptionEn';
    const targetTitleKey = targetLang === 'de'
      ? 'titleDe' : 'titleEn';
    const targetDescKey = targetLang === 'de'
      ? 'descriptionDe' : 'descriptionEn';
    const started = Date.now();
    const tick = async () => {
      // Bail out if more than 15s elapsed; the user can fall
      // back to the manual "Translate from " recovery button.
      if (Date.now() - started > 15000) {
        setTranslatingTarget(null);
        return;
      }
      try {
        const res = await v1.get(
          `/public/companies/${companyId}/profile`,
          { params: { language: targetLang, mode: 'edit' } },
        );
        const translations =
          res.data?.company_description_translations || {};
        const incomingValue = translations[targetLang] || '';
        const incomingAuto =
          !!translations[`${targetLang}_auto_translated`];
        const incomingItems =
          res.data?.core_products_services?.items || [];
        const itemAutoLandings = incomingItems
          .filter((it) => {
            const t = it[`title_${targetLang}`];
            const d = it[`description_${targetLang}`];
            const tAuto =
              !!it[`title_${targetLang}_auto_translated`];
            const dAuto =
              !!it[`description_${targetLang}_auto_translated`];
            return (tAuto && (t || '').trim())
              || (dAuto && (d || '').trim());
          });
        const descLanded = incomingAuto && incomingValue.trim();
        const productsLanded = itemAutoLandings.length > 0;
        if (descLanded || productsLanded) {
          const updateProducts = (products) => products.map((p) => {
            const incoming = incomingItems.find(
              (it) => String(it.id) === String(p.id));
            if (!incoming) return p;
            const newTitle = incoming[`title_${targetLang}`];
            const newDesc = incoming[`description_${targetLang}`];
            const newTitleAuto =
              !!incoming[`title_${targetLang}_auto_translated`];
            const newDescAuto =
              !!incoming[`description_${targetLang}_auto_translated`];
            const next = { ...p };
            if (newTitleAuto && (newTitle || '').trim()) {
              next[targetTitleKey] = newTitle;
              next[`${targetTitleKey}Auto`] = true;
            }
            if (newDescAuto && (newDesc || '').trim()) {
              next[targetDescKey] = newDesc;
              next[`${targetDescKey}Auto`] = true;
            }
            return next;
          });
          setForm((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (descLanded) {
              next[targetKey] = incomingValue;
              next[`${targetKey}Auto`] = true;
            }
            next.products = updateProducts(prev.products || []);
            return next;
          });
          setOriginalForm((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (descLanded) {
              next[targetKey] = incomingValue;
              next[`${targetKey}Auto`] = true;
            }
            next.products = updateProducts(prev.products || []);
            return next;
          });
          setTranslatingTarget(null);
          return;
        }
      } catch (err) {
        // swallow — keep polling until timeout
      }
      setTimeout(tick, 2500);
    };
    setTimeout(tick, 2500);
  };

  const handleManualTranslate = async () => {
    if (!companyId || manualTranslating) return;
    const sourceLang = language === 'de' ? 'en' : 'de';
    setManualTranslating(true);
    try {
      const res = await v1.post(
        `/companies/${companyId}/public-profile/translate`,
        null,
        { params: { from: sourceLang } },
      );
      const translations =
        res.data?.company_description_translations || {};
      const targetKey = language === 'de'
        ? 'companyDescriptionDe'
        : 'companyDescriptionEn';
      const value = translations[language] || '';
      setForm((prev) => prev && ({
        ...prev,
        [targetKey]: value,
        [`${targetKey}Auto`]: true,
      }));
      setOriginalForm((prev) => prev && ({
        ...prev,
        [targetKey]: value,
        [`${targetKey}Auto`]: true,
      }));
      toast.success('Translation completed');
    } catch (err) {
      toast.error(err.response?.data?.error
        || 'Translation failed');
    } finally {
      setManualTranslating(false);
    }
  };

  const handleDiscard = () => {
    if (originalForm) setForm(originalForm);
    if (originalHiddenPayload) {
      const { sectionsList, itemsState } =
        hiddenPayloadToState(originalHiddenPayload);
      setSectionVisibility(
        applyHiddenSectionsToVisibility(sectionsList));
      setHiddenItems(itemsState);
    }
    setPendingClears({});
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, companyLogo: reader.result }));
    };
    reader.readAsDataURL(file);
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };

  const handleOpenPublicView = () => {
    window.open(`/company-overview/${companyId}`, '_blank', 'noopener');
  };

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditProfile = () => {
    handleMenuClose();
    navigate(`/company/${companyId}/edit-public-profile`);
  };

  const handleClaimProfile = () => {
    const companyName = data?.company_name || 'Unknown Company';
    const subject = encodeURIComponent(`Claim Profile Request - ${companyName}`);
    const body = encodeURIComponent(
      `I would like to claim the profile for ${companyName}.\n\nCompany URL: ${window.location.href}\n\nPlease provide more information about the verification process.`
    );
    window.open(`mailto:feedback@impactforesight.io?subject=${subject}&body=${body}`);
    handleMenuClose();
  };

  const handleReportError = () => {
    const companyName = data?.company_name || 'Unknown Company';
    const subject = encodeURIComponent(`Error Report - ${companyName}`);
    const body = encodeURIComponent(
      `I found an error on the profile for ${companyName}.\n\nCompany URL: ${window.location.href}\n\nError description:\n`
    );
    window.open(`mailto:feedback@impactforesight.io?subject=${subject}&body=${body}`);
    handleMenuClose();
  };

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) {
        setCompanyData(SAMPLE_DATA);
        const sampleForm = mapApiToForm({
          company_name: SAMPLE_DATA.company_name,
          company_description: SAMPLE_DATA.company_description,
          company_logo: SAMPLE_DATA.company_logo,
          company_url: SAMPLE_DATA.company_url,
          headquarter_address: SAMPLE_DATA.headquarter_address,
          industry_sectors: SAMPLE_DATA.industry_sectors,
          ceo_name: SAMPLE_DATA.ceo_name,
          legal_form: SAMPLE_DATA.legal_form,
          legal_entity_formation_date: SAMPLE_DATA.legal_entity_formation_date,
          number_of_employees: SAMPLE_DATA.number_of_employees,
          contact_email: SAMPLE_DATA.contact_email,
          core_products_services: SAMPLE_DATA.core_products_services,
          social_media_links: SAMPLE_DATA.social_media_links,
        });
        setForm(sampleForm);
        setOriginalForm(sampleForm);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await v1.get(
          `/public/companies/${companyId}/profile`,
          {
            params: {
              language,
              ...(isEditing ? { mode: 'edit' } : {}),
            },
          },
        );
        if (response.data) {
          const apiData = response.data;
          const mergedData = {
            ...SAMPLE_DATA,
            ...apiData,
            industry_sectors: apiData.industry_sectors
              ? apiData.industry_sectors.split(',').map(s => s.trim().toUpperCase())
              : SAMPLE_DATA.industry_sectors,
            certifications: buildCertifications(apiData),
          };
          setCompanyData(mergedData);
          const mappedForm = mapApiToForm(apiData);
          setForm(mappedForm);
          setOriginalForm(mappedForm);
          const { sectionsList, itemsState } =
            hiddenPayloadToState(apiData.hidden_profile_elements);
          const loadedVisibility =
            applyHiddenSectionsToVisibility(sectionsList);
          setSectionVisibility(loadedVisibility);
          setHiddenItems(itemsState);
          setOriginalHiddenPayload(buildHiddenPayload(
            loadedVisibility, itemsState));
        } else {
          setCompanyData(SAMPLE_DATA);
        }
      } catch (err) {
        console.error('Error fetching company data:', err);
        setCompanyData(SAMPLE_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, language, isEditing]);

  if (loading) {
    return <Loader />;
  }

  const data = companyData || SAMPLE_DATA;

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook':
        return <FacebookIcon sx={{ color: '#1877f2' }} />;
      case 'linkedin':
        return <LinkedInIcon sx={{ color: '#0a66c2' }} />;
      case 'twitter':
        return <XIcon sx={{ color: '#000000' }} />;
      default:
        return null;
    }
  };

  return (
    <PageContainer>

      {/* Navigation Header (public nav — visible in both view and edit modes) */}
      <HeaderNav>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <Logo />
        </Box>

        <NavItem>ABOUT <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /></NavItem>
        <NavItem>NEWS/PRESS <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /></NavItem>
        <NavItem>SERVICES <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /></NavItem>
        <NavItem>PROJECTS <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /></NavItem>
        <NavItem>SITES <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /></NavItem>
        <NavItem>REAL ESTATE <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /></NavItem>
        <NavItem>TALENTS <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /></NavItem>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography sx={{ color: '#00a9a5', fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}>
            WISTA DIREKT
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
            <SearchIcon sx={{ fontSize: 18, color: '#374151' }} />
            <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>SEARCH</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
            <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>EN</Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#374151' }} />
          </Box>
        </Box>
      </HeaderNav>

      {/* Edit toolbar — secondary sticky bar below the WISTA public nav */}
      {isEditing && (
        <EditHeaderBar>
          <BackLink onClick={handleBackToProfile}>
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            Back
          </BackLink>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ToggleButtonGroup
              value={language}
              exclusive
              size='small'
              onChange={handleLanguageToggle}
              aria-label='editor-language'
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#374151',
                  borderColor: '#d1d5db',
                  fontSize: '13px',
                  fontWeight: 600,
                  px: 1.5,
                  py: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#1f2937' },
                  },
                },
              }}
            >
              <ToggleButton value='en' aria-label='language-en'>
                EN
              </ToggleButton>
              <ToggleButton value='de' aria-label='language-de'>
                DE
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant='outlined'
              size='small'
              onClick={handleOpenPublicView}
              startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none', borderRadius: '8px',
                color: '#374151', borderColor: '#d1d5db', fontSize: '13px',
              }}
            >
              Open public view
            </Button>
            <Button
              variant='contained'
              size='small'
              onClick={handleSave}
              disabled={saving || !isDirty}
              startIcon={saving ? <CircularProgress size={14} color='inherit' /> : null}
              sx={{
                textTransform: 'uppercase', borderRadius: '8px',
                backgroundColor: '#111827', fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.5px', '&:hover': { backgroundColor: '#1f2937' },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </EditHeaderBar>
      )}

      <MainContent>
        {/* Breadcrumb (hidden in edit mode) */}
        {!isEditing && (
        <Breadcrumb>
          <BreadcrumbLink>HOME</BreadcrumbLink>
          <Typography sx={{ color: '#9ca3af' }}>&gt;</Typography>
          <BreadcrumbLink>COMPANIES</BreadcrumbLink>
          <Typography sx={{ color: '#9ca3af' }}>&gt;</Typography>
          <BreadcrumbCurrent>{data.company_name?.toUpperCase().replace('GMBH', '').trim()}</BreadcrumbCurrent>
        </Breadcrumb>
        )}

        {/* Company Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            {isEditing && form ? (
              <TextField
                value={form.companyName}
                onChange={handleFormChange('companyName')}
                variant='standard'
                fullWidth
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: '42px', fontWeight: 700, color: '#111827', mb: 2, lineHeight: 1.2 },
                }}
              />
            ) : (
              <Typography variant="h1" sx={{ fontSize: '42px', fontWeight: 700, color: '#111827', mb: 2 }}>
                {data.company_name}
              </Typography>
            )}
            {isEditing && form ? (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Autocomplete
                  multiple freeSolo options={[]}
                  sx={{ flex: 1, '& .MuiAutocomplete-inputRoot': { flexWrap: 'wrap', gap: 0.5 } }}
                  value={form.industrySectors
                    ? form.industrySectors.split(',').map((s) => s.trim()).filter(Boolean)
                    : []}
                  onChange={(_e, newValue) => {
                    setForm((prev) => ({
                      ...prev,
                      industrySectors: newValue.map((v) => v.trim()).filter(Boolean).join(', '),
                    }));
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant='outlined' size='small' label={option.toUpperCase()}
                        {...getTagProps({ index })}
                        sx={{
                          fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
                          borderColor: '#d1d5db', color: '#374151', borderRadius: '6px',
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params} variant='standard' inputRef={sectorInputRef}
                      InputProps={{ ...params.InputProps, disableUnderline: true }}
                    />
                  )}
                />
                <Tooltip title='Add sector' placement='top' arrow>
                  <IconButton
                    onClick={() => sectorInputRef.current?.focus()}
                    aria-label='add sector'
                    sx={{
                      width: 32, height: 32, border: '1px solid #e5e7eb',
                      borderRadius: '6px', backgroundColor: '#ffffff',
                      '&:hover': { backgroundColor: '#f3f4f6' }, mt: 0.5, flexShrink: 0,
                    }}
                  >
                    <AddIcon sx={{ fontSize: 16, color: '#374151' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                {data.industry_sectors?.map((sector, index) => (
                  <React.Fragment key={index}>
                    <IndustryTag sx={{ fontWeight: index === 0 ? 600 : 400 }}>
                      {sector}
                    </IndustryTag>
                    {index < data.industry_sectors.length - 1 && <TagSeparator>·</TagSeparator>}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isEditing && (
            <Tooltip
              title={UNVERIFIED_BADGE_TOOLTIP}
              arrow
              placement="bottom"
              slotProps={{
                tooltip: {
                  sx: {
                    maxWidth: 320,
                    bgcolor: '#ffffff',
                    color: '#374151',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    borderRadius: '12px',
                    p: 2,
                  },
                },
                arrow: {
                  sx: {
                    color: '#ffffff',
                  },
                },
              }}
            >
              <UnverifiedBadge sx={{ cursor: 'pointer' }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                UNVERIFIED, AI-GENERATED PROFILE
              </UnverifiedBadge>
            </Tooltip>
            )}
            {!isEditing && (
              <>
            <IconButton
              onClick={handleMenuClick}
              aria-controls={menuOpen ? 'profile-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : undefined}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="profile-menu"
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              MenuListProps={{ 'aria-labelledby': 'profile-menu-button' }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  borderRadius: '16px',
                  minWidth: '280px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              {canEdit && (
                <MenuItem
                  onClick={handleEditProfile}
                  sx={{ py: 1.5, px: 2.5, fontSize: '15px', fontWeight: 600 }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 18, mr: 1.5, color: '#6b7280' }} />
                  Edit public profile
                </MenuItem>
              )}
              {canEdit && <Divider sx={{ mx: 2 }} />}
              <MenuItem
                onClick={handleClaimProfile}
                sx={{ py: 1.5, px: 2.5, fontSize: '15px', fontWeight: 600 }}
              >
                Claim your profile
              </MenuItem>
              <Divider sx={{ mx: 2 }} />
              <MenuItem
                onClick={handleReportError}
                sx={{ py: 1.5, px: 2.5, fontSize: '15px', fontWeight: 600, color: '#ef4444' }}
              >
                Report error
              </MenuItem>
            </Menu>
              </>
            )}
          </Box>
        </Box>

        {/* Main Info Section - Now in white cards */}
        <EditableSectionWrapper
          title='Overview'
          sectionKey={SECTION_KEYS.OVERVIEW}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        <Box sx={{ display: 'flex', gap: 3, mb: 5 }}>
          {/* Left: Logo and Description Card */}
          <WhiteCard sx={{ display: 'flex', gap: 3, flex: 1 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <LogoContainer>
                {(isEditing && form ? form.companyLogo : data.company_logo) ? (
                  <Box
                    component="img"
                    src={isEditing && form ? form.companyLogo : data.company_logo}
                    alt={data.company_name}
                    sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>
                      {data.company_name?.split(' ')[0] || 'LOGO'}
                    </Typography>
                  </Box>
                )}
              </LogoContainer>
              {isEditing && (
                <>
                  <IconButton
                    onClick={(e) => setLogoMenuAnchor(e.currentTarget)}
                    sx={{
                      position: 'absolute', bottom: 6, right: 6,
                      width: 32, height: 32, backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      '&:hover': { backgroundColor: '#f3f4f6' },
                    }}
                    aria-label='edit logo'
                  >
                    <EditOutlinedIcon sx={{ fontSize: 16, color: '#374151' }} />
                  </IconButton>
                  <Menu
                    anchorEl={logoMenuAnchor}
                    open={Boolean(logoMenuAnchor)}
                    onClose={() => { setLogoMenuAnchor(null); setLogoUrlInput(false); }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    PaperProps={{ sx: { borderRadius: '12px', minWidth: '220px', mt: 1 } }}
                  >
                    <MenuItem
                      onClick={() => {
                        setLogoMenuAnchor(null);
                        setLogoUrlInput(false);
                        logoFileInputRef.current?.click();
                      }}
                      sx={{ fontSize: '14px', gap: 1.5 }}
                    >
                      <FileUploadOutlinedIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                      Upload image
                    </MenuItem>
                    <MenuItem onClick={() => setLogoUrlInput(true)} sx={{ fontSize: '14px', gap: 1.5 }}>
                      <LinkIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                      Enter URL
                    </MenuItem>
                    {logoUrlInput && (
                      <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                        <TextField
                          value={form?.companyLogo || ''}
                          onChange={handleFormChange('companyLogo')}
                          size='small' fullWidth autoFocus
                          placeholder='https://...'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setLogoMenuAnchor(null);
                              setLogoUrlInput(false);
                            }
                          }}
                          sx={{ '& input': { fontSize: '12px' } }}
                        />
                      </Box>
                    )}
                  </Menu>
                  <input
                    ref={logoFileInputRef} type='file' accept='image/*'
                    hidden onChange={handleLogoFileSelect}
                  />
                </>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              {isEditing && form ? (
                <Box sx={{ mb: 3 }}>
                  {(() => {
                    const activeKey = language === 'de'
                      ? 'companyDescriptionDe'
                      : 'companyDescriptionEn';
                    const otherKey = language === 'de'
                      ? 'companyDescriptionEn'
                      : 'companyDescriptionDe';
                    const isAutoActive = !!form[`${activeKey}Auto`];
                    const otherHasContent =
                      !!(form[otherKey] || '').trim();
                    const activeBlank =
                      !(form[activeKey] || '').trim();
                    const showManualTranslate =
                      activeBlank && otherHasContent;
                    const showTranslating =
                      translatingTarget === language && activeBlank;
                    return (
                      <>
                        {(isAutoActive || showTranslating) && (
                          <Box sx={{
                            display: 'flex', alignItems: 'center',
                            gap: 0.75, mb: 1,
                            color: showTranslating ? '#6b7280' : '#0ea5e9',
                            fontSize: '12px', fontWeight: 600,
                            letterSpacing: '0.4px',
                          }}>
                            {showTranslating ? (
                              <>
                                <CircularProgress size={12} sx={{ color: '#6b7280' }} />
                                <span>TRANSLATING…</span>
                              </>
                            ) : (
                              <>
                                <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                                <span>AUTO-TRANSLATED</span>
                              </>
                            )}
                          </Box>
                        )}
                        <TextField
                          value={form[activeKey] || ''}
                          onChange={handleFormChange(activeKey)}
                          multiline rows={4} fullWidth variant='standard'
                          placeholder={language === 'de'
                            ? 'Unternehmensbeschreibung…'
                            : 'Company description…'}
                          InputProps={{ disableUnderline: true, sx: { fontSize: '15px', color: '#374151', lineHeight: 1.7 } }}
                        />
                        {showManualTranslate && (
                          <Box sx={{ mt: 1 }}>
                            <Button
                              variant='outlined'
                              size='small'
                              onClick={handleManualTranslate}
                              disabled={manualTranslating}
                              startIcon={manualTranslating
                                ? <CircularProgress size={14} />
                                : <TranslateIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                textTransform: 'none',
                                borderRadius: '8px',
                                color: '#374151',
                                borderColor: '#d1d5db',
                                fontSize: '12px',
                              }}
                            >
                              {manualTranslating
                                ? 'Translating…'
                                : `Translate from ${language === 'de' ? 'English' : 'German'}`}
                            </Button>
                          </Box>
                        )}
                      </>
                    );
                  })()}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '15px', color: '#374151', lineHeight: 1.7, mb: 3 }}>
                  {data.company_description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                  {isEditing && form ? (
                    <TextField
                      value={form.headquarterAddress}
                      onChange={handleFormChange('headquarterAddress')}
                      variant='standard' placeholder='Headquarters address' fullWidth
                      InputProps={{ disableUnderline: true, sx: { fontSize: '14px', color: '#374151', fontWeight: 600 } }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>
                      Address: {data.headquarter_address}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LanguageIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                  {isEditing && form ? (
                    <TextField
                      value={form.companyUrl}
                      onChange={handleFormChange('companyUrl')}
                      variant='standard' placeholder='company-website.com' fullWidth
                      InputProps={{ disableUnderline: true, sx: { fontSize: '14px', color: '#3b82f6', fontWeight: 600 } }}
                    />
                  ) : (
                    <Link
                      href={`https://${data.company_url}`}
                      target="_blank"
                      sx={{ fontSize: '14px', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {data.company_url}
                    </Link>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Tooltip
                  title={AI_GENERATED_TOOLTIP}
                  arrow
                  placement="top"
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: '#ffffff',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        '& .MuiTooltip-arrow': {
                          color: '#ffffff',
                        },
                      },
                    },
                  }}
                >
                  <InfoIcon>i</InfoIcon>
                </Tooltip>
              </Box>
            </Box>
          </WhiteCard>

          {/* Right: Profile Activity */}
          <ProfileActivityCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
              <Typography sx={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                Company profile activity
              </Typography>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
            </Box>
            <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
              Trending
            </Typography>
            <Typography sx={{ fontSize: '13px', color: '#6b7280', mb: 1, maxWidth: '80%' }}>
              Among all Biotechnology/Environment companies.
            </Typography>
            <TrendingBar />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '11px', color: '#9ca3af' }}>LOW</Typography>
              <Typography sx={{ fontSize: '11px', color: '#9ca3af' }}>HIGH</Typography>
            </Box>
          </ProfileActivityCard>
        </Box>
        </EditableSectionWrapper>

        {/* CEO/Founders Row - Now in white card */}
        <WhiteCard sx={{ display: 'flex', alignItems: 'center', gap: 6, mb: 6 }}>
          <MetricItem>
            <Avatar
              src={data.ceo_photo}
              sx={{ width: 56, height: 56 }}
            >
              {(isEditing && form ? form.ceoName : data.ceo_name)?.charAt(0) || 'T'}
            </Avatar>
            <Box>
              <MetricLabel>CEO/FOUNDERS</MetricLabel>
              {isEditing && form ? (
                <TextField
                  value={form.ceoName} onChange={handleFormChange('ceoName')}
                  variant='standard' placeholder='CEO name'
                  InputProps={{ disableUnderline: true, sx: { fontSize: '18px', fontWeight: 600, color: '#111827' } }}
                />
              ) : (
                <MetricValue>{data.ceo_name || 'Tim Fronzek, Raf S'}</MetricValue>
              )}
            </Box>
          </MetricItem>

          <MetricItem>
            <IconBox>
              <BusinessIcon />
            </IconBox>
            <Box>
              <MetricLabel>LEGAL FORM</MetricLabel>
              {isEditing && form ? (
                <TextField
                  value={form.legalForm} onChange={handleFormChange('legalForm')}
                  variant='standard' placeholder='e.g. GmbH'
                  InputProps={{ disableUnderline: true, sx: { fontSize: '18px', fontWeight: 600, color: '#111827' } }}
                  sx={{ width: '120px' }}
                />
              ) : (
                <MetricValue>{data.legal_form || 'GmbH'}</MetricValue>
              )}
            </Box>
          </MetricItem>

          <MetricItem>
            <IconBox>
              <CalendarTodayIcon />
            </IconBox>
            <Box>
              <MetricLabel>FORMATION DATE</MetricLabel>
              {isEditing && form ? (
                <TextField
                  value={form.legalEntityFormationDate} onChange={handleFormChange('legalEntityFormationDate')}
                  variant='standard' placeholder='e.g. 2020'
                  InputProps={{ disableUnderline: true, sx: { fontSize: '18px', fontWeight: 600, color: '#111827' } }}
                  sx={{ width: '90px' }}
                />
              ) : (
                <MetricValue>{(data.legal_entity_formation_date || '2022').toString().slice(0, 4)}</MetricValue>
              )}
            </Box>
          </MetricItem>

          <MetricItem>
            <IconBox>
              <PeopleIcon />
            </IconBox>
            <Box>
              <MetricLabel>NO. OF EMPLOYEES</MetricLabel>
              {isEditing && form ? (
                <TextField
                  value={form.numberOfEmployees} onChange={handleFormChange('numberOfEmployees')}
                  variant='standard' placeholder='e.g. 51-100'
                  InputProps={{ disableUnderline: true, sx: { fontSize: '18px', fontWeight: 600, color: '#111827' } }}
                  sx={{ width: '110px' }}
                />
              ) : (
                <MetricValue>{data.number_of_employees || '51-100'}</MetricValue>
              )}
            </Box>
          </MetricItem>

          <Box sx={{ ml: 'auto' }}>
            <Tooltip
              title={AI_GENERATED_TOOLTIP}
              arrow
              placement="top"
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    '& .MuiTooltip-arrow': {
                      color: '#ffffff',
                    },
                  },
                },
              }}
            >
              <InfoIcon>i</InfoIcon>
            </Tooltip>
          </Box>
        </WhiteCard>

        {/* What we do Section */}
        <EditableSectionWrapper
          title='What we do'
          sectionKey={SECTION_KEYS.WHAT_WE_DO}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        <Box sx={{ mb: 6 }}>
          <SectionTitleRow
            sectionKey={SECTION_KEYS.WHAT_WE_DO}
            sectionVisibility={sectionVisibility}
            onToggleSection={toggleSection}
            editMode={isEditing}
          >
            What we do
          </SectionTitleRow>
          {(isEditing && form
            ? form.products
            : data.core_products_services?.items || []
          ).map((product, index) => {
            const itemKey = product.id != null
              ? product.id : `idx${index}`;
            const itemHidden = !!hiddenItems.products[itemKey];
            if (!isEditing && itemHidden) return null;
            return (
              <ProductRow
                key={itemKey}
                sx={{ opacity: itemHidden ? 0.4 : 1, alignItems: 'center' }}
              >
                {isEditing && form ? (
                  <>
                    <Box sx={{ width: 160, flexShrink: 0, mr: 2 }}>
                      <TextField
                        value={language === 'de'
                          ? (product.titleDe || '')
                          : (product.titleEn || '')}
                        onChange={handleProductChange(index, 'title')}
                        variant='standard' multiline fullWidth
                        placeholder={language === 'de'
                          ? 'Produktname'
                          : 'Product name'}
                        InputProps={{ disableUnderline: true, sx: { fontSize: '15px', fontWeight: 600, color: '#111827' } }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        value={language === 'de'
                          ? (product.descriptionDe || '')
                          : (product.descriptionEn || '')}
                        onChange={handleProductChange(index, 'description')}
                        variant='standard' multiline fullWidth
                        placeholder={language === 'de'
                          ? 'Produktbeschreibung'
                          : 'Product description'}
                        InputProps={{ disableUnderline: true, sx: { fontSize: '15px', color: '#374151', lineHeight: 1.7 } }}
                      />
                    </Box>
                    <Box sx={{ ml: 2 }}>
                      <InlineControls
                        onHide={() => toggleItemHidden('products', itemKey)}
                        hidden={itemHidden}
                        onDelete={() => removeProduct(itemKey)}
                      />
                    </Box>
                  </>
                ) : (
                  <>
                    <ProductTitle>{product.title}</ProductTitle>
                    <ProductDescription>{product.description}</ProductDescription>
                    <Box sx={{ ml: 2 }}>
                      <Tooltip
                        title={AI_GENERATED_TOOLTIP}
                        arrow placement="top"
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor: '#ffffff',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              '& .MuiTooltip-arrow': { color: '#ffffff' },
                            },
                          },
                        }}
                      >
                        <InfoIcon>i</InfoIcon>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </ProductRow>
            );
          })}
          {isEditing && (
            <Box sx={{ textAlign: 'center', mt: 2, mb: 2 }}>
              <Button
                variant='outlined' startIcon={<AddIcon />} onClick={addProduct}
                sx={{
                  textTransform: 'uppercase', borderRadius: '8px', px: 4, py: 1.2,
                  fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px',
                  color: '#374151', borderColor: '#d1d5db',
                }}
              >
                Add Core Product
              </Button>
            </Box>
          )}
        </Box>
        </EditableSectionWrapper>

        {/* Recent News Section */}
        <EditableSectionWrapper
          title='Recent news'
          sectionKey={SECTION_KEYS.RECENT_NEWS}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        <Box sx={{ mb: 6 }}>
          <SectionTitleRow
            sectionKey={SECTION_KEYS.RECENT_NEWS}
            sectionVisibility={sectionVisibility}
            onToggleSection={toggleSection}
            editMode={isEditing}
          >
            Recent news
          </SectionTitleRow>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {data.recent_news?.map((news, index) => (
              <NewsCard key={index}>
                <NewsHeader sx={{ backgroundColor: '#ffffff' }}>
                  <NewsSource>
                    <SourceLogo>NOSH</SourceLogo>
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        {news.source}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                        {news.date}
                      </Typography>
                    </Box>
                  </NewsSource>
                  {getPlatformIcon(news.platform)}
                </NewsHeader>
                <Box
                  sx={{
                    height: '180px',
                    backgroundColor: '#e5e7eb',
                    backgroundImage: `url(${news.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <Box sx={{ p: 2, backgroundColor: '#ffffff' }}>
                  <Typography sx={{ fontSize: '14px', color: '#374151', mb: 1, lineHeight: 1.5 }}>
                    {news.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {news.tags?.map((tag, tagIndex) => (
                      <Typography key={tagIndex} sx={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>
                        {tag}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </NewsCard>
            ))}
          </Box>
          <PaginationDots>
            {[0, 1, 2, 3].map((i) => (
              <Dot key={i} active={i === newsPage} onClick={() => setNewsPage(i)} />
            ))}
          </PaginationDots>
        </Box>
        </EditableSectionWrapper>

        {/* Social Media CTA */}
        <EditableSectionWrapper
          title='Social media banner'
          sectionKey={SECTION_KEYS.SOCIAL_MEDIA}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        {isEditing && form ? (
          <WhiteCard>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827', mb: 0.5 }}>
              Banner title
            </Typography>
            <Typography sx={{ fontSize: '15px', color: '#111827', fontWeight: 600, mb: 2 }}>
              Want to stay up-to-date about our products and developments?
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              {[
                { key: 'facebook', label: 'Facebook URL' },
                { key: 'twitter', label: 'X / Twitter URL' },
                { key: 'linkedin', label: 'LinkedIn URL' },
                { key: 'instagram', label: 'Instagram URL' },
                { key: 'youtube', label: 'YouTube URL' },
              ].map(({ key, label }) => (
                <TextField
                  key={key} value={form.socialMediaLinks[key]}
                  onChange={handleSocialChange(key)}
                  label={label} variant='outlined'
                  sx={{ '& .MuiOutlinedInput-input': { py: 1.75 } }}
                />
              ))}
            </Box>
          </WhiteCard>
        ) : (
        <CTASection>
          <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#111827', mb: 2 }}>
            Want to stay up-to-date about our products and developments?
          </Typography>
          <Typography sx={{ fontSize: '14px', color: '#6b7280', mb: 3 }}>
            Follow us on social media:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {data.social_media_links?.facebook && (
              <SocialButton bgcolor="#1877f2" href={data.social_media_links.facebook} target="_blank">
                <FacebookIcon />
              </SocialButton>
            )}
            {data.social_media_links?.twitter && (
              <SocialButton bgcolor="#000000" href={data.social_media_links.twitter} target="_blank">
                <XIcon />
              </SocialButton>
            )}
            {data.social_media_links?.linkedin && (
              <SocialButton bgcolor="#0a66c2" href={data.social_media_links.linkedin} target="_blank">
                <LinkedInIcon />
              </SocialButton>
            )}
            {data.social_media_links?.instagram && (
              <SocialButton bgcolor="#E4405F" href={data.social_media_links.instagram} target="_blank">
                <InstagramIcon />
              </SocialButton>
            )}
            {data.social_media_links?.youtube && (
              <SocialButton bgcolor="#FF0000" href={data.social_media_links.youtube} target="_blank">
                <YouTubeIcon />
              </SocialButton>
            )}
          </Box>
        </CTASection>
        )}
        </EditableSectionWrapper>

        {/* Blog Posts & ESG Report Section */}
        <EditableSectionWrapper
          title='Reports'
          sectionKey={SECTION_KEYS.REPORTS}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 6 }}>
          {/* ESG Report card - only show if company has a real ESG report URL */}
          {data.esg_impact_report && data.esg_report_link
          && !pendingClears.esgReport
          && !(!isEditing && hiddenItems.reports.esg) && (
          <Box sx={{ position: 'relative', opacity: hiddenItems.reports.esg ? 0.4 : 1 }}>
            {isEditing && (
              <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                <InlineControls
                  onHide={() => toggleItemHidden('reports', 'esg')}
                  hidden={!!hiddenItems.reports.esg}
                  onDelete={() => clearField('esgReport')}
                />
              </Box>
            )}
            <BlogCard>
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(253,242,248,0.8) 50%, rgba(243,232,255,0.6) 100%)',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <Typography sx={{ fontSize: '12px', color: '#6b7280', mb: 1 }}>
                  {data.esg_report_year || 'August 2025'}
                </Typography>
                <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#111827', mb: 1.5 }}>
                  Latest ESG report available!
                </Typography>
                <Typography sx={{ fontSize: '14px', color: '#6b7280', mb: 2, flex: 1, maxWidth: '70%' }}>
                  Discover how we&apos;re advancing our commitment to environmental responsibility, social impact, and strong governance...
                </Typography>
                <Link
                  href={data.esg_report_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '14px',
                    color: '#0ea5e9',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 500,
                  }}
                >
                  View ESG report
                  <Box component="span" sx={{ fontSize: '16px' }}>&gt;</Box>
                </Link>
                {/* Document icon */}
                <Box
                  component="img"
                  src="/images/icons/report-icon-2.svg"
                  alt="ESG Report icon"
                  sx={{
                    position: 'absolute',
                    right: 20,
                    top: 20,
                    width: 80,
                    height: 80,
                  }}
                />
                {/* AI info badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: 12,
                    bottom: 12,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  i
                </Box>
              </Box>
            </BlogCard>
          </Box>
          )}
        </Box>
        </EditableSectionWrapper>

        {/* How we contribute to a better world */}
        <EditableSectionWrapper
          title='How we contribute to a better world'
          sectionKey={SECTION_KEYS.SDG}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        <WhiteCard sx={{ mt: 6 }}>
          <SectionTitleRow
            sectionKey={SECTION_KEYS.SDG}
            sectionVisibility={sectionVisibility}
            onToggleSection={toggleSection}
            editMode={isEditing}
          >
            How we contribute to a better world
          </SectionTitleRow>
          {data.sdg_contributions?.map((sdg, index) => {
            const sdgKey = sdg.sdg != null ? sdg.sdg : `idx${index}`;
            const itemHidden = !!hiddenItems.sdg[sdgKey];
            if (!isEditing && itemHidden) return null;
            return (
              <SDGBar key={sdgKey} sx={{ opacity: itemHidden ? 0.4 : 1 }}>
                <Box
                  component="img"
                  src={`/images/sdg/${sdg.sdg}.svg`}
                  alt={sdg.label}
                  sx={{ width: 48, height: 48, borderRadius: '8px', flexShrink: 0 }}
                />
                <Typography sx={{ fontSize: '24px', fontWeight: 700, minWidth: '60px' }}>
                  {sdg.percentage}%
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '14px', color: '#6b7280', mb: 0.5 }}>
                    {sdg.label}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={sdg.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: sdg.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                {isEditing && (
                  <InlineControls
                    onHide={() => toggleItemHidden('sdg', sdgKey)}
                    hidden={itemHidden}
                  />
                )}
              </SDGBar>
            );
          })}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            <Typography sx={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
              Provided by: ImpactForesight PBC
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI Powered
            </Typography>
          </Box>
        </WhiteCard>
        </EditableSectionWrapper>

        {/* Sustainability certifications and awards */}
        <EditableSectionWrapper
          title='Sustainability certifications and awards'
          sectionKey={SECTION_KEYS.CERTIFICATIONS}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        <Box sx={{ mt: 6 }}>
          <SectionTitleRow
            sectionKey={SECTION_KEYS.CERTIFICATIONS}
            sectionVisibility={sectionVisibility}
            onToggleSection={toggleSection}
            editMode={isEditing}
          >
            Sustainability certifications and awards
          </SectionTitleRow>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {data.certifications?.map((cert, index) => {
              const certKey = cert.slotKey || `idx${index}`;
              const clearKey = certKey === 'primary' ? 'certPrimary'
                : certKey === 'award1' ? 'certAward1'
                  : certKey === 'award2' ? 'certAward2' : null;
              if (clearKey && pendingClears[clearKey]) return null;
              const itemHidden = !!hiddenItems.certifications[certKey];
              if (!isEditing && itemHidden) return null;
              return (
                <Box key={certKey} sx={{ position: 'relative', opacity: itemHidden ? 0.4 : 1 }}>
                  <CertificationCard>
                    <Box
                      sx={{
                        width: '80px', height: '80px',
                        bgcolor: '#e5e7eb', borderRadius: '8px',
                        margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <VerifiedIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
                    </Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827', mb: 1.5 }}>
                      {cert.name}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6b7280', mb: 2.5 }}>
                      {cert.description}
                    </Typography>
                    {cert.url && (
                      <Link
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: '12px', color: '#3b82f6', textDecoration: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                        }}
                      >
                        {cert.linkLabel}
                        <OpenInNewIcon sx={{ fontSize: 12 }} />
                      </Link>
                    )}
                  </CertificationCard>
                  {isEditing && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                      <InlineControls
                        onHide={() => toggleItemHidden('certifications', certKey)}
                        hidden={itemHidden}
                        onDelete={clearKey
                          ? () => clearField(clearKey) : undefined}
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
        </EditableSectionWrapper>

        {/* How to interact with us */}
        <EditableSectionWrapper
          title='How to interact with us'
          sectionKey={SECTION_KEYS.CONTACT}
          sectionVisibility={sectionVisibility}
          onToggleSection={toggleSection}
          editMode={isEditing}
        >
        <Box sx={{ mt: 6 }}>
          <SectionTitleRow
            sectionKey={SECTION_KEYS.CONTACT}
            sectionVisibility={sectionVisibility}
            onToggleSection={toggleSection}
            editMode={isEditing}
          >
            How to interact with us
          </SectionTitleRow>
          <Box
            sx={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              height: '400px',
            }}
          >
            {data.latitude && data.longitude && GOOGLE_MAPS_API_KEY ? (
              <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: data.latitude, lng: data.longitude }}
                  zoom={13}
                  options={{
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false,
                    zoomControl: true,
                  }}
                >
                  <Marker
                    position={{ lat: data.latitude, lng: data.longitude }}
                  />
                </GoogleMap>
              </LoadScriptNext>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: '#9ca3af' }}>
                  Map unavailable
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: '#ffffff',
                borderRadius: '12px',
                p: 3,
                maxWidth: '320px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box
                sx={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  p: 1,
                  bgcolor: '#ffffff',
                }}
              >
                {data.company_logo ? (
                  <Box
                    component="img"
                    src={data.company_logo}
                    alt={data.company_name}
                    sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span style="font-size: 20px; font-weight: 700; color: #111827;">${data.company_name?.split(' ')[0] || 'LOGO'}</span>`;
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                    {data.company_name?.split(' ')[0] || 'LOGO'}
                  </Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '14px', color: '#6b7280', mb: 2 }}>
                Welcome to our offices at WISTA Science Park Adlershof!
              </Typography>
              {data.contact_email && (
                <Link
                  href={`mailto:${data.contact_email}`}
                  sx={{
                    fontSize: '14px',
                    color: '#3b82f6',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  Contact us
                  <OpenInNewIcon sx={{ fontSize: 14 }} />
                </Link>
              )}
            </Box>
          </Box>
        </Box>
        </EditableSectionWrapper>
      </MainContent>

      {/* Footer */}
      {!isEditing && (
      <Footer>
        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
          2025 © WISTA MANAGEMENT GMBH
        </Typography>
      </Footer>
      )}

      {/* Sticky unsaved-changes bar */}
      {isEditing && isDirty && (
        <Box sx={{
          position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 20,
          backgroundColor: '#111827', borderRadius: '12px',
          padding: '12px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        }}>
          <Typography sx={{ color: '#ffffff', fontSize: '14px', fontWeight: 500 }}>
            You have unsaved changes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='text' size='small' onClick={handleDiscard}
              sx={{ color: '#9ca3af', textTransform: 'none' }}
            >
              Discard
            </Button>
            <Button
              variant='contained' size='small' onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color='inherit' /> : null}
              sx={{
                textTransform: 'uppercase', borderRadius: '8px',
                backgroundColor: '#ffffff', color: '#111827',
                fontSize: '12px', fontWeight: 700,
                '&:hover': { backgroundColor: '#f3f4f6' },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Dirty-state guard for the EN/DE toggle (#517) */}
      <Dialog
        open={!!pendingLanguage}
        onClose={cancelLanguageSwitch}
        aria-labelledby='switch-language-dialog-title'
      >
        <DialogTitle id='switch-language-dialog-title'>
          Save or discard your changes first
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes in the current language.
            Save or discard them before switching languages so
            your edits aren&apos;t lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelLanguageSwitch}>OK</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default memo(CompanyOverviewV2);
