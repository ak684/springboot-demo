import React, { memo } from 'react';
import {
  Box,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Divider
} from "@mui/material";
import { getTypography } from "shared-components/utils/typography";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { impactSelectors } from "store/ducks/impact";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { impactTooltips, impactFieldNames } from "shared-components/utils/impact";
import AiTocEditableBox from "./AiTocEditableBox";

const isFirstNegative = (index, data) => {
  const firstNegativeIndex = data.findIndex(row => row.type.toLowerCase().includes('negative'));
  return index === firstNegativeIndex;
}

// Define editable fields - same as in Impact Table
const editableFields = ['title', 'statusQuo', 'innovation', 'stakeholders', 'change', 'outputUnits'];

const StyledTable = styled(Table)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(10),
  width: '100%',
  height: '1px',
  '.MuiTableCell-root': {
    border: 'none',
    verticalAlign: 'top'
  },
  'th.MuiTableCell-root': {
    verticalAlign: 'middle',
  },
  'td.MuiTableCell-root': {
    fontSize: 12,
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(17),
  },
}));

const StyledHeaderCell = styled(TableCell)(() => ({
  ...getTypography('overline'),
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

const getSdgTooltip = (sdg, goals) => (
  <CustomErrorBoundary>
    <Box display='flex' gap={2}>
      <Box display='flex' flexDirection='column' gap={1}>
        <Box
          width={112}
          height={112}
          component='img'
          src={`/images/sdg/${sdg.number}.svg`}
          alt={goals[sdg.number - 1].shortName}
          sx={{ borderRadius: '4px' }}
          flexShrink={0}
        />
        <Typography color='white' sx={{ fontSize: 32, fontWeight: 'bold' }}>
          {sdg.percent}%
        </Typography>
        <Typography color='white' sx={{ fontSize: 10 }}>
          We attribute {sdg.percent}% of this innovation impact to this SDG
        </Typography>
      </Box>
      <Box display='flex' flexDirection='column' gap={1}>
        <Typography variant='bodyBold' color='white'>
          SDG{sdg.number}. {goals[sdg.number - 1].shortName}
        </Typography>
        <Box>
          <Typography sx={{ mb: 1 }} variant='subtitleBold' color='white'>Target</Typography>
          <Typography variant='caption' color='white'>{sdg.target}</Typography>
        </Box>
        <Box>
          <Typography sx={{ mb: 1 }} variant='subtitleBold' color='white'>Indicator</Typography>
          <Typography variant='caption' color='white'>{sdg.indicator}</Typography>
        </Box>
      </Box>
    </Box>
  </CustomErrorBoundary>
);

const getSdgItem = (sdg, index, goals) => (
  <CustomErrorBoundary>
    <Box key={index}>
      <StyledTooltip placement='top-end' title={getSdgTooltip(sdg, goals)}>
        <Box
          width={40}
          height={40}
          sx={{ borderRadius: '4px' }}
          component='img'
          src={`/images/sdg/${sdg.number}.svg`}
          alt={goals[sdg.number - 1].shortName}
        />
      </StyledTooltip>
      {sdg.percent && typeof sdg.percent === 'number' && (
        <Typography sx={{ fontSize: 10, fontWeight: 'bold' }}>{sdg.percent}%</Typography>
      )}
    </Box>
  </CustomErrorBoundary>
);

const AiTocTable = ({ toc, edit, editedCell, cancel, confirm, deleteIndicator, addIndicator }) => {
  const theme = useTheme();
  const goals = useSelector(dictionarySelectors.getGoals());
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const autofillValues = useSelector(impactSelectors.getImpactAutofillValues());

  if (isMobileView) {
    return (
      <CustomErrorBoundary>
        <Box mb={19} mt={2} display='flex' flexDirection='column' gap={2}>
          {toc && Array.isArray(toc) && toc.map((row, index) => (
            <Box key={index} border={1} borderColor='border'>
              <Box
                height={8}
                sx={{ backgroundColor: row.type.toLowerCase().includes('positive') ? theme.palette.success.main : theme.palette.error.main }}
                id='ai-toc-title-cell'
              />
              <Box
                sx={{ p: 1.5 }}
                id={isFirstNegative(index, toc) ? 'ai-toc-first-negative' : undefined}
              >
                <AiTocEditableBox
                  defaultValue={`${row.type}: ${row.title}`}
                  edit={() => edit(index, 'title')}
                  edited={editedCell === `${index}.title`}
                  cancel={cancel}
                  confirm={(value) => {
                    // Extract just the title part, preserving the type
                    const titlePart = value.split(': ')[1] || value;
                    confirm(titlePart, `${index}.title`);
                  }}
                  maxLength={60}
                  typography={getTypography('captionBold')}
                />
              </Box>
              <Typography
                variant='overline'
                sx={{ p: 1.5, backgroundColor: 'secondary.subtle' }}
                component='div'
                id='ai-toc-status-quo-cell'
              >
                Status quo
              </Typography>
              <Box sx={{ p: 1.5, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <AiTocEditableBox
                  defaultValue={row.statusQuo}
                  placeholder={impactFieldNames['statusQuo']}
                  edit={() => edit(index, 'statusQuo')}
                  edited={editedCell === `${index}.statusQuo`}
                  cancel={cancel}
                  confirm={confirm}
                  maxLength={100}
                  options={autofillValues?.statusQuo || []}
                />
                {editedCell !== `${index}.statusQuo` && (
                  <Box className='info-section' sx={{ visibility: 'hidden' }}>
                    <Box display='flex' gap={1} alignItems='center'>
                      <Divider sx={{ my: 1, flexGrow: 1 }} />
                      <Tooltip
                        title={(
                          <Box>
                            <Typography variant='subtitle'>
                              {impactTooltips['statusQuo']()}
                            </Typography>
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
                  </Box>
                )}
              </Box>
              <Typography
                variant='overline'
                sx={{ p: 1.5, backgroundColor: 'secondary.subtle' }}
                component='div'
                id='ai-toc-innovation-cell'
              >
                Our innovation
              </Typography>
              <Box sx={{ p: 1.5, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <AiTocEditableBox
                  defaultValue={row.innovation}
                  placeholder={impactFieldNames['innovation']}
                  edit={() => edit(index, 'innovation')}
                  edited={editedCell === `${index}.innovation`}
                  cancel={cancel}
                  confirm={confirm}
                  maxLength={100}
                  options={autofillValues?.innovation || []}
                />
                {editedCell !== `${index}.innovation` && (
                  <Box className='info-section' sx={{ visibility: 'hidden' }}>
                    <Box display='flex' gap={1} alignItems='center'>
                      <Divider sx={{ my: 1, flexGrow: 1 }} />
                      <Tooltip
                        title={(
                          <Box>
                            <Typography variant='subtitle'>
                              {impactTooltips['innovation']()}
                            </Typography>
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
                  </Box>
                )}
              </Box>
              <Typography
                variant='overline'
                sx={{ p: 1.5, backgroundColor: 'secondary.subtle' }}
                component='div'
                id='ai-toc-stakeholders-cell'
              >
                Stakeholders
              </Typography>
              <Box sx={{ p: 1.5, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <AiTocEditableBox
                  defaultValue={row.stakeholders}
                  placeholder={impactFieldNames['stakeholders']}
                  edit={() => edit(index, 'stakeholders')}
                  edited={editedCell === `${index}.stakeholders`}
                  cancel={cancel}
                  confirm={confirm}
                  maxLength={100}
                  options={autofillValues?.stakeholders || []}
                />
                {editedCell !== `${index}.stakeholders` && (
                  <Box className='info-section' sx={{ visibility: 'hidden' }}>
                    <Box display='flex' gap={1} alignItems='center'>
                      <Divider sx={{ my: 1, flexGrow: 1 }} />
                      <Tooltip
                        title={(
                          <Box>
                            <Typography variant='bodyBold'>Suggestion</Typography>
                            <Typography variant='subtitle' sx={{ mt: 1 }}>
                              Whenever possible, please name individuals belonging to a specific stakeholder group,
                              such as individuals suffering from Alzheimer disease, unemployed in the USA, families below the
                              poverty line in South America etc.
                            </Typography>
                            <Typography variant='subtitle' sx={{ mt: 1 }}>
                              Choose global community, if identifying a specific stakeholder group is difficult, such
                              as effects of carbon emissions (hard to name a specific stakeholder group), or preserving
                              rain forest, wildlife etc.
                            </Typography>
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
                  </Box>
                )}
              </Box>
              <Typography
                variant='overline'
                sx={{ p: 1.5, backgroundColor: 'secondary.subtle' }}
                component='div'
                id='ai-toc-change-cell'
              >
                Stakeholder change
              </Typography>
              <Box sx={{ p: 1.5, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <AiTocEditableBox
                  defaultValue={row.change}
                  placeholder={impactFieldNames['change']}
                  edit={() => edit(index, 'change')}
                  edited={editedCell === `${index}.change`}
                  cancel={cancel}
                  confirm={confirm}
                  maxLength={100}
                  options={autofillValues?.change || []}
                />
                {editedCell !== `${index}.change` && (
                  <Box className='info-section' sx={{ visibility: 'hidden' }}>
                    <Box display='flex' gap={1} alignItems='center'>
                      <Divider sx={{ my: 1, flexGrow: 1 }} />
                      <Tooltip
                        title={(
                          <Box>
                            <Typography variant='subtitle'>
                              {impactTooltips['change'](row.type.toLowerCase().includes('positive'))}
                            </Typography>
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
                  </Box>
                )}
              </Box>
              <Typography
                variant='overline'
                sx={{ p: 1.5, backgroundColor: 'secondary.subtle' }}
                component='div'
                id='ai-toc-output-units-cell'
              >
                Products / services / activities
              </Typography>
              <Box sx={{ p: 1.5, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <AiTocEditableBox
                  defaultValue={row.outputUnits}
                  placeholder={impactFieldNames['outputUnits']}
                  edit={() => edit(index, 'outputUnits')}
                  edited={editedCell === `${index}.outputUnits`}
                  cancel={cancel}
                  confirm={confirm}
                  maxLength={100}
                  options={autofillValues?.outputUnits || []}
                />
                {editedCell !== `${index}.outputUnits` && (
                  <Box className='info-section' sx={{ visibility: 'hidden' }}>
                    <Box display='flex' gap={1} alignItems='center'>
                      <Divider sx={{ my: 1, flexGrow: 1 }} />
                      <Tooltip
                        title={(
                          <Box>
                            <Typography variant='subtitle'>
                              {impactTooltips['outputUnits']()}
                            </Typography>
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
                  </Box>
                )}
              </Box>
              <Typography
                variant='overline'
                sx={{ p: 1.5, backgroundColor: 'secondary.subtle' }}
                component='div'
                id='ai-toc-indicators-cell'
              >
                Indicators
              </Typography>
              <Box p={1.5} display='flex' flexDirection='column' gap={1}>
                {Array.isArray(row.indicators) && row.indicators.map((indicator, indicatorIndex) => {
                  if (typeof indicator === 'object' && indicator.name) {
                    return (
                      <AiTocEditableBox
                        key={indicatorIndex}
                        defaultValue={indicator.name}
                        prefix={<b>{`${indicatorIndex + 1}:`}&nbsp;</b>}
                        HoverIcon={DeleteIcon}
                        hoverAction={() => deleteIndicator(index, indicatorIndex)}
                      />
                    )
                  } else {
                    return null;
                  }
                })}
                {Array.isArray(row.indicators) && row.indicators.length < 3 && (
                  <Box
                    display='flex'
                    gap={0.5}
                    alignItems='center'
                    onClick={() => addIndicator(index)}
                    sx={{ cursor: 'pointer' }}
                    className='add-indicator'
                  >
                    <AddCircleIcon sx={{ width: 16, color: 'primary.main' }} />
                    <Typography variant='subtitle'
                      color='primary.main'
                      sx={{ textDecoration: 'underline' }}>
                      Add indicator
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography
                variant='overline'
                sx={{ p: 1.5, backgroundColor: 'secondary.subtle' }}
                component='div'
                id='ai-toc-sdgs-cell'
              >
                SDGs
              </Typography>
              <Box p={1.5} display='flex' gap={1}>
                {Array.isArray(row.sdgs) && row.sdgs.map((sdg, index) => {
                  if (
                    typeof sdg === 'object'
                    && sdg.number
                    && typeof sdg.number === 'number'
                    && sdg.number >= 1
                    && sdg.number <= 17
                  ) {
                    return getSdgItem(sdg, index, goals);
                  } else {
                    return null;
                  }
                })}
              </Box>
            </Box>
          ))}
        </Box>
      </CustomErrorBoundary>
    );
  }

  return (
    <CustomErrorBoundary>
      <StyledTable>
        <TableHead>
          <TableRow>
            <TableCell component='th' colSpan={2}></TableCell>
            <TableCell sx={{ ...getTypography('subtitleBold') }} component='th' colSpan={2}>
              Our actions...
            </TableCell>
            <TableCell sx={{ ...getTypography('subtitleBold') }} component='th' colSpan={3}>
              Lead to change...
            </TableCell>
            <TableCell sx={{ ...getTypography('subtitleBold') }} component='th' colSpan={2}>
              ...and we provide evidence!
            </TableCell>
          </TableRow>
          <TableRow sx={{ backgroundColor: (theme) => theme.palette.secondary.subtle }}>
            <StyledHeaderCell
              component='th'
              sx={{ fontWeight: 'bold', px: 2, py: 1.5 }}
              padding='none'
              colSpan={2}
              id='ai-toc-title-cell'
            >
              Title
            </StyledHeaderCell>
            <StyledHeaderCell
              component='th'
              sx={{ fontWeight: 'bold', px: 2, py: 1.5 }}
              padding='none'
              id='ai-toc-status-quo-cell'
            >
              Status quo solution
            </StyledHeaderCell>
            <StyledHeaderCell
              component='th'
              sx={{ fontWeight: 'bold', px: 2, py: 1.5 }}
              padding='none'
              id='ai-toc-innovation-cell'
            >
              Our innovation
            </StyledHeaderCell>
            <StyledHeaderCell
              component='th'
              sx={{ fontWeight: 'bold', px: 2, py: 1.5 }}
              padding='none'
              id='ai-toc-stakeholders-cell'
            >
              Stakeholders
            </StyledHeaderCell>
            <StyledHeaderCell
              component='th'
              sx={{ fontWeight: 'bold', px: 2, py: 1.5 }}
              padding='none'
              id='ai-toc-change-cell'
            >
              Stakeholder change
            </StyledHeaderCell>
            <StyledHeaderCell
              component='th'
              sx={{ fontWeight: 'bold', px: 2, py: 1.5 }}
              padding='none'
              id='ai-toc-output-units-cell'
            >
              Products / services / activities
            </StyledHeaderCell>
            <StyledHeaderCell
              component='th'
              sx={{ width: '25%', fontWeight: 'bold', px: 2, py: 1.5 }}  // Updated from 20% to 25% to match Impact Table
              padding='none'
              id='ai-toc-indicators-cell'
            >
              Indicators
            </StyledHeaderCell>
            <StyledHeaderCell
              component='th'
              sx={{ fontWeight: 'bold', px: 2, py: 1.5 }} //width: '12%' }}  // Add width: '12%' to match Impact Table
              padding='none'
              id='ai-toc-sdgs-cell'
            >
              SDGs
            </StyledHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {toc && Array.isArray(toc) && toc.map((row, index) => (
            <TableRow key={index} sx={{ backgroundColor: index % 2 > 0 ? 'background.default' : '' }}>
              <TableCell padding='none' sx={{ width: 10, height: '100%' }}>
                <Box
                  m={0.25}
                  padding='3px'
                  height='calc(100% - 4px)'
                  sx={{ backgroundColor: row.type.toLowerCase().includes('positive') ? theme.palette.success.main : theme.palette.error.main }}>
                </Box>
              </TableCell>
              <TableCell
                padding='none'
                sx={{ p: 1 }}
                id={isFirstNegative(index, toc) ? 'ai-toc-first-negative' : undefined}
              >
                <AiTocEditableBox
                  defaultValue={`${row.type}: ${row.title}`}
                  edit={() => edit(index, 'title')}
                  edited={editedCell === `${index}.title`}
                  cancel={cancel}
                  confirm={(value) => {
                    // Extract just the title part, preserving the type
                    const titlePart = value.split(': ')[1] || value;
                    confirm(titlePart, `${index}.title`);
                  }}
                  maxLength={60}
                  typography={getTypography('subtitleBold')}
                />
              </TableCell>
              <TableCell padding='none' sx={{ p: 1, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <Box height='100%' display='flex' flexDirection='column' justifyContent='space-between'>
                  <AiTocEditableBox
                    defaultValue={row.statusQuo}
                    placeholder={impactFieldNames['statusQuo']}
                    edit={() => edit(index, 'statusQuo')}
                    edited={editedCell === `${index}.statusQuo`}
                    cancel={cancel}
                    confirm={confirm}
                    maxLength={100}
                    options={autofillValues?.statusQuo || []}
                  />
                  {editedCell !== `${index}.statusQuo` && (
                    <Box className='info-section' sx={{ visibility: 'hidden' }}>
                      <Box display='flex' gap={1} alignItems='center'>
                        <Divider sx={{ my: 1, flexGrow: 1 }} />
                        <Tooltip
                          title={(
                            <Box>
                              <Typography variant='subtitle'>
                                {impactTooltips['statusQuo']()}
                              </Typography>
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
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell padding='none' sx={{ p: 1, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <Box height='100%' display='flex' flexDirection='column' justifyContent='space-between'>
                  <AiTocEditableBox
                    defaultValue={row.innovation}
                    placeholder={impactFieldNames['innovation']}
                    edit={() => edit(index, 'innovation')}
                    edited={editedCell === `${index}.innovation`}
                    cancel={cancel}
                    confirm={confirm}
                    maxLength={100}
                    options={autofillValues?.innovation || []}
                  />
                  {editedCell !== `${index}.innovation` && (
                    <Box className='info-section' sx={{ visibility: 'hidden' }}>
                      <Box display='flex' gap={1} alignItems='center'>
                        <Divider sx={{ my: 1, flexGrow: 1 }} />
                        <Tooltip
                          title={(
                            <Box>
                              <Typography variant='subtitle'>
                                {impactTooltips['innovation']()}
                              </Typography>
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
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell padding='none' sx={{ p: 1, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <Box height='100%' display='flex' flexDirection='column' justifyContent='space-between'>
                  <AiTocEditableBox
                    defaultValue={row.stakeholders}
                    placeholder={impactFieldNames['stakeholders']}
                    edit={() => edit(index, 'stakeholders')}
                    edited={editedCell === `${index}.stakeholders`}
                    cancel={cancel}
                    confirm={confirm}
                    maxLength={100}
                    options={autofillValues?.stakeholders || []}
                  />
                  {editedCell !== `${index}.stakeholders` && (
                    <Box className='info-section' sx={{ visibility: 'hidden' }}>
                      <Box display='flex' gap={1} alignItems='center'>
                        <Divider sx={{ my: 1, flexGrow: 1 }} />
                        <Tooltip
                          title={(
                            <Box>
                              <Typography variant='bodyBold'>Suggestion</Typography>
                              <Typography variant='subtitle' sx={{ mt: 1 }}>
                                Whenever possible, please name individuals belonging to a specific stakeholder group,
                                such as individuals suffering from Alzheimer disease, unemployed in the USA, families below the
                                poverty line in South America etc.
                              </Typography>
                              <Typography variant='subtitle' sx={{ mt: 1 }}>
                                Choose global community, if identifying a specific stakeholder group is difficult, such
                                as effects of carbon emissions (hard to name a specific stakeholder group), or preserving
                                rain forest, wildlife etc.
                              </Typography>
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
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell padding='none' sx={{ p: 1, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <Box height='100%' display='flex' flexDirection='column' justifyContent='space-between'>
                  <AiTocEditableBox
                    defaultValue={row.change}
                    placeholder={impactFieldNames['change']}
                    edit={() => edit(index, 'change')}
                    edited={editedCell === `${index}.change`}
                    cancel={cancel}
                    confirm={confirm}
                    maxLength={100}
                    options={autofillValues?.change || []}
                  />
                  {editedCell !== `${index}.change` && (
                    <Box className='info-section' sx={{ visibility: 'hidden' }}>
                      <Box display='flex' gap={1} alignItems='center'>
                        <Divider sx={{ my: 1, flexGrow: 1 }} />
                        <Tooltip
                          title={(
                            <Box>
                              <Typography variant='subtitle'>
                                {impactTooltips['change'](row.type.toLowerCase().includes('positive'))}
                              </Typography>
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
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell padding='none' sx={{ p: 1, '&:hover': { '.info-section': { visibility: 'visible' } } }}>
                <Box height='100%' display='flex' flexDirection='column' justifyContent='space-between'>
                  <AiTocEditableBox
                    defaultValue={row.outputUnits}
                    placeholder={impactFieldNames['outputUnits']}
                    edit={() => edit(index, 'outputUnits')}
                    edited={editedCell === `${index}.outputUnits`}
                    cancel={cancel}
                    confirm={confirm}
                    maxLength={100}
                    options={autofillValues?.outputUnits || []}
                  />
                  {editedCell !== `${index}.outputUnits` && (
                    <Box className='info-section' sx={{ visibility: 'hidden' }}>
                      <Box display='flex' gap={1} alignItems='center'>
                        <Divider sx={{ my: 1, flexGrow: 1 }} />
                        <Tooltip
                          title={(
                            <Box>
                              <Typography variant='subtitle'>
                                {impactTooltips['outputUnits']()}
                              </Typography>
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
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell padding='none' sx={{ p: 1, '&:hover': { '.add-indicator': { visibility: 'visible' } } }}>
                <Box display='flex' flexDirection='column' gap={1}>
                  {Array.isArray(row.indicators) && row.indicators.map((indicator, indicatorIndex) => {
                    if (typeof indicator === 'object' && indicator.name) {
                      return (
                        <AiTocEditableBox
                          key={indicatorIndex}
                          defaultValue={indicator.name}
                          prefix={<b>{`${indicatorIndex + 1}:`}&nbsp;</b>}
                          HoverIcon={DeleteIcon}
                          hoverAction={() => deleteIndicator(index, indicatorIndex)}
                        />
                      )
                    } else {
                      return null;
                    }
                  })}
                  {Array.isArray(row.indicators) && row.indicators.length < 3 && (
                    <Box
                      display='flex'
                      gap={0.5}
                      alignItems='center'
                      onClick={() => addIndicator(index)}
                      sx={{ visibility: 'hidden', cursor: 'pointer' }}
                      className='add-indicator'
                    >
                      <AddCircleIcon sx={{ width: 16, color: 'primary.main' }} />
                      <Typography variant='subtitle'
                        color='primary.main'
                        sx={{ textDecoration: 'underline' }}>
                        Add indicator
                      </Typography>
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell padding='none' sx={{ p: 1 }}>
                <Box display='flex' gap={1}>
                  {Array.isArray(row.sdgs) && row.sdgs.map((sdg, index) => {
                    if (
                      typeof sdg === 'object'
                      && sdg.number
                      && typeof sdg.number === 'number'
                      && sdg.number >= 1
                      && sdg.number <= 17
                    ) {
                      return getSdgItem(sdg, index, goals);
                    } else {
                      return null;
                    }
                  })}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </CustomErrorBoundary>
  );
};

export default memo(AiTocTable);
