import React, { memo } from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  styled,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useTheme
} from "@mui/material";
import ventureColors from '../data/colors';
import Card from "@mui/material/Card";
import {
  getVentureTotalLikelihood,
  getVentureTotalMagnitude,
  getVentureTotalScore
} from "shared-components/utils/scoring";
import { containsBy } from "shared-components/utils/lo";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledTableCell = styled(TableCell, { shouldForwardProp: prop => prop !== 'top' })(({ top }) => ({
  borderLeft: 'none',
  borderRight: 'none',
  borderBottom: 'none',
  borderTop: top ? 'none' : 'default',
}));

const StyledVentureIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 32,
  height: 32,
  color: 'white',
  ...getTypography('captionBold'),
  borderRadius: '50%',
}))

const VenturesOverviewFilter = ({ ventures, selected, setSelected, showDetails, setShowDetails }) => {
  const theme = useTheme();

  const toggleSelectVenture = (venture) => {
    if (containsBy(selected, venture, 'id')) {
      setSelected(selected.filter(i => i.id !== venture.id));
    } else {
      setSelected([...selected, venture]);
    }
  }

  const ventureRows = [...ventures]
    .sort((v1, v2) => getVentureTotalScore(v2) - getVentureTotalScore(v1))
    .map((v) => (
      <TableRow key={v.id}>
        <StyledTableCell>
          <Checkbox checked={containsBy(selected, v, 'id')} onChange={() => toggleSelectVenture(v)} />
        </StyledTableCell>
        <StyledTableCell>
          <StyledVentureIcon backgroundColor={ventureColors[ventures.indexOf(v) % ventureColors.length]}>
            V{ventures.indexOf(v) + 1}
          </StyledVentureIcon>
        </StyledTableCell>
        <StyledTableCell>
          <Box maxWidth={130}>
            <Typography noWrap variant='captionBold' title={v.name}>{v.name}</Typography>
            <Typography color='secondary.dark' sx={{ fontSize: 10 }}>
              {v.impacts.filter(i => !i.draft).filter(i => i.scoring.at(-1)?.score).length} Impact area(s)
            </Typography>
          </Box>
        </StyledTableCell>
        {showDetails && (
          <>
            <StyledTableCell><Typography variant='caption'>{getVentureTotalMagnitude(v)}</Typography></StyledTableCell>
            <StyledTableCell><Typography variant='caption'>{getVentureTotalLikelihood(v)}%</Typography></StyledTableCell>
            <StyledTableCell><Typography variant='caption'>{getVentureTotalScore(v)}</Typography></StyledTableCell>
          </>
        )}
        <StyledTableCell padding='none' />
      </TableRow>
    ))

  return (
    <CustomErrorBoundary>
      <Card sx={{ border: `1px solid ${theme.palette.border}` }}>
        <Table padding='checkbox' sx={{ border: 'none' }}>
          <TableBody>
            <TableRow>
              <StyledTableCell colSpan={3} padding='normal' top>
                <Typography variant='caption'>Ventures</Typography>
              </StyledTableCell>
              {showDetails && (
                <>
                  <StyledTableCell top><Typography variant='caption'>Magnitude</Typography></StyledTableCell>
                  <StyledTableCell top><Typography variant='caption'>Likelihood</Typography></StyledTableCell>
                  <StyledTableCell top><Typography variant='caption'>Potential</Typography></StyledTableCell>
                </>
              )}
              <StyledTableCell top padding='none'>
                <IconButton onClick={() => setShowDetails(!showDetails)} sx={{ p: 0 }}>
                  {showDetails ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </StyledTableCell>
            </TableRow>
            {ventureRows}
          </TableBody>
        </Table>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(VenturesOverviewFilter);
