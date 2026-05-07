import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Divider,
  FormControlLabel,
  IconButton,
  styled,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditableBox from './EditableBox';
import { useDispatch, useSelector } from 'react-redux';
import { appSelectors } from 'store/ducks/app';
import { GLOBAL_COMMUNITY_INPUT, IMPACT_SORT, VENTURE_ACCESS } from "shared-components/utils/constants";
import ImpactPopupMenu from 'views/common/ImpactPopupMenu';
import AppLabel from 'views/common/AppLabel';
import AddIndicatorModal from 'views/common/AddIndicatorModal';
import DeleteIcon from '@mui/icons-material/Delete';
import { ventureSelectors, ventureThunks } from "store/ducks/venture";
import { capitalize } from "shared-components/utils/helpers";
import { impactSelectors } from "store/ducks/impact";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { impactFieldNames, impactTooltips } from "shared-components/utils/impact";
import { getTypography } from "shared-components/utils/typography";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useParams } from "react-router-dom";
import { dictionarySelectors } from "../../../../store/ducks/dictionary";
import useModal from "shared-components/hooks/useModal";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '.MuiTooltip-tooltip': {
    minWidth: 480,
    padding: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      minWidth: 350,
    }
  },
}));

const getSdgTooltip = (goal, rate) => (
  <CustomErrorBoundary>
    <Box display='flex' gap={2}>
      <Box display='flex' flexDirection='column' gap={1}>
        <Box
          width={112}
          height={112}
          component='img'
          src={goal.image}
          alt={goal.shortName}
          sx={{ borderRadius: '4px' }}
          flexShrink={0}
        />
        <Typography color='white' sx={{ fontSize: 32, fontWeight: 'bold' }}>
          {rate}%
        </Typography>
        <Typography color='white' sx={{ fontSize: 10 }}>
          We attribute {rate}% of this innovation impact to this SDG
        </Typography>
      </Box>
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant='bodyBold' color='white'>
          SDG{goal.number}. {goal.shortName}
        </Typography>
        <Box>
          <Typography color='white' sx={{ fontSize: 14 }}>
            {goal.description}
          </Typography>
        </Box>
      </Box>
    </Box>
  </CustomErrorBoundary>
);

const getSdgItem = (goal, rate, index) => (
  <CustomErrorBoundary>
    <Box key={index}>
      <StyledTooltip placement='top-end' title={getSdgTooltip(goal, rate)}>
        <Box
          width={40}
          height={40}
          sx={{ borderRadius: '4px' }}
          component='img'
          src={goal.image}
          alt={goal.shortName}
        />
      </StyledTooltip>
      {rate && typeof rate === 'number' && (
        <Typography sx={{ fontSize: 10, fontWeight: 'bold' }}>{rate}%</Typography>
      )}
    </Box>
  </CustomErrorBoundary>
);

const editableFields = ['statusQuo', 'innovation', 'stakeholders', 'change', 'outputUnits'];

const SortableTableRow = ({ impact, id, edit, editedCell, cancel, confirm, collapsed, impactNameRef }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  const impactSort = useSelector(appSelectors.getImpactSort());
  const theme = useTheme();
  const [indicatorModalOpen, addIndicator, closeIndicatorModal] = useModal();
  const dispatch = useDispatch();
  const autofillValues = useSelector(impactSelectors.getImpactAutofillValues());
  const { ventureId } = useParams();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));
  const goals = useSelector(dictionarySelectors.getGoals());

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const scoring = impact.scoring.at(-1);

  const toggleGlobalCommunity = () => {
    if (impact.stakeholders === GLOBAL_COMMUNITY_INPUT) {
      edit(impact.id, 'stakeholders');
    } else {
      confirm(GLOBAL_COMMUNITY_INPUT, `${impact.id}.stakeholders`);
    }
  }

  return (
    <StyledTableRow style={style}>
      <CustomErrorBoundary>
        <TableCell padding='none' sx={{ borderRight: 'none', width: 10, height: '100%' }}>
          <Box
            m={0.25}
            padding='3px'
            height='calc(100% - 4px)'
            sx={{ backgroundColor: impact.positive ? theme.palette.success.main : theme.palette.error.main }}>
          </Box>
        </TableCell>
        {impactSort === IMPACT_SORT.CUSTOM && (
          <TableCell
            padding='none'
            sx={{ width: 24, cursor: 'grab', borderRight: 'none', borderLeft: 'none' }}
            ref={setNodeRef}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon sx={{ color: theme.palette.secondary.main }} />
          </TableCell>
        )}
        <TableCell sx={{ borderLeft: 'none', position: 'relative' }}>
          {
            impactSort === IMPACT_SORT.CUSTOM && scoring?.score &&
            <Box mb={1}>Score: <b>{scoring.score.toFixed(0) * (impact.positive ? 1 : -1)}</b></Box>
          }
          {
            impactSort !== IMPACT_SORT.CUSTOM && scoring?.[impactSort] &&
            <Box mb={1}>
              {capitalize(impactSort)}:&nbsp;
              <b>
                {scoring[impactSort].toFixed(0) * (impact.positive ? 1 : -1)}{impactSort === IMPACT_SORT.BY_LIKELIHOOD ? '%' : ''}
              </b>
            </Box>
          }
          <ImpactPopupMenu
            impact={impact}
            sx={{ position: 'absolute', top: 8, right: 0, p: 0.5 }}
            extended
            addIndicator={addIndicator}
          />
          <EditableBox
            defaultValue={impact.name}
            edit={() => edit(impact.id, 'name')}
            edited={editedCell === `${impact.id}.name`}
            cancel={cancel}
            confirm={confirm}
            maxLength={60}
            typography={getTypography('subtitleBold')}
            impactNameRef={impactNameRef}
          />
          {impact.draft && <AppLabel sx={{ mt: 1 }}>Draft</AppLabel>}
        </TableCell>
        {editableFields.filter(f => !collapsed.includes(f)).map(f => (
          <TableCell key={f} sx={{ '&:hover': { '.info-section': { visibility: 'visible' } } }}>
            <Box height='100%' display='flex' flexDirection='column' justifyContent='space-between'>
              <EditableBox
                defaultValue={impact[f]}
                placeholder={impactFieldNames[f]}
                edit={() => edit(impact.id, f)}
                edited={editedCell === `${impact.id}.${f}`}
                cancel={cancel}
                confirm={confirm}
                maxLength={100}
                options={autofillValues[f]}
              />
              {editedCell !== `${impact.id}.${f}` && (
                <Box className='info-section' sx={{ visibility: 'hidden' }}>
                  <Box display='flex' gap={1} alignItems='center'>
                    <Divider sx={{ my: 1, flexGrow: 1 }} />
                    <Tooltip
                      title={(
                        <Box>
                          {f === 'stakeholders' && (
                            <Box>
                              <Typography variant='bodyBold'>Suggestion</Typography>
                              <Typography variant='subtitle' sx={{ mt: 1 }}>
                                Whenever possible, please name individuals belonging to a specific stakeholder group,
                                such
                                as
                                individuals suffering from Alzheimer disease, unemployed in the USA, families below the
                                poverty
                                line in South America etc.
                              </Typography>
                              <Typography variant='subtitle' sx={{ mt: 1 }}>
                                Choose global community, if identifying a specific stakeholder group is difficult, such
                                as effects of carbon emissions (hard to name a specific stakeholder group), or
                                preserving
                                rain
                                forest, wildlife etc.
                              </Typography>
                            </Box>
                          )}
                          {f !== 'stakeholders' && (
                            <Typography variant='subtitle'>
                              {impactTooltips[f](impact.positive)}
                            </Typography>
                          )}
                        </Box>
                      )}
                    >
                      <IconButton><InfoOutlinedIcon sx={{
                        width: 16,
                        height: 16,
                        color: 'secondary.main'
                      }} /></IconButton>
                    </Tooltip>
                  </Box>
                  {f === 'stakeholders' && access === VENTURE_ACCESS.EDIT && (
                    <FormControlLabel
                      componentsProps={{ typography: getTypography('caption') }}
                      control={
                        <Switch
                          checked={impact[f] === GLOBAL_COMMUNITY_INPUT}
                          onChange={toggleGlobalCommunity}
                          size='small'
                        />
                      }
                      label='Global community'
                    />
                  )}
                </Box>
              )}
            </Box>
          </TableCell>
        ))}
        {!collapsed.includes('indicators') && (
          <TableCell sx={{ '&:hover': { '.add-indicator': { visibility: 'visible' } } }}>
            <Box display='flex' flexDirection='column' gap={1}>
              {impact.indicators.map((i, index) => (
                <EditableBox
                  key={index}
                  defaultValue={i.name}
                  edit={() => edit(impact.id, 'indicators', i.id)}
                  edited={editedCell === `${impact.id}.indicators.${i.id}`}
                  cancel={cancel}
                  confirm={confirm}
                  prefix={<b>{`${index + 1}:`}&nbsp;</b>}
                  maxLength={100}
                  HoverIcon={DeleteIcon}
                  hoverAction={() => dispatch(ventureThunks.deleteIndicator(i))}
                />
              ))}
              {impact.indicators.length < 3 && (
                <Box
                  display='flex'
                  gap={0.5}
                  alignItems='center'
                  onClick={addIndicator}
                  sx={{ visibility: 'hidden' }}
                  className='add-indicator'
                >
                  <AddCircleIcon sx={{ width: 16, color: 'primary.main' }} />
                  <Typography variant='subtitle'
                    color='primary.main'
                    sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                    Add indicator
                  </Typography>
                </Box>
              )}
            </Box>
          </TableCell>
        )}
        <TableCell>
          <Box display='flex' gap={1} flexWrap='wrap'>
            {impact.goals.map((goal, index) => (
              getSdgItem(goal.goal, goal.rate, index)
            ))}
          </Box>
        </TableCell>
        {indicatorModalOpen && <AddIndicatorModal open onClose={closeIndicatorModal} impactId={impact.id} />}
      </CustomErrorBoundary>
    </StyledTableRow>
  );
};
export default memo(SortableTableRow);
