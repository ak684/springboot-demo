import React, { memo, useEffect, useState } from 'react';
import { Box, Checkbox, FormControlLabel, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { ventureSelectors, ventureThunks } from "store/ducks/venture";
import {
  getAverageChange,
  getIndicatorInceptionData,
  getIndicatorThisYearData,
  getNetOutcome
} from "shared-components/utils/quantification";
import { noteThunks } from "store/ducks/note";
import { sortBy } from "shared-components/utils/lo";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const getRiskItem = (note, preNote) => {
  if (!note) {
    return {};
  }

  const source = note.same ? preNote : note;
  return sortBy([...source.links, ...source.files], 'risk')[0];
}

// toDO: Delete this page when it is no longer needed
const IndicatorsOverview = () => {
  const [preNotes, setPreNotes] = useState({});
  const [postNotes, setPostNotes] = useState({});
  const [hiddenVentures, setHiddenVentures] = useState([]);
  const ventures = useSelector(ventureSelectors.getVentures());
  const dispatch = useDispatch();

  useEffect(() => {
    if (ventures.length === 0) {
      dispatch(ventureThunks.fetchVentures());
    }
  }, []);

  useEffect(() => {
    if (ventures.length > 0) {
      ventures.forEach(venture => {
        venture.impacts.forEach(impact => {
          impact.indicators.forEach((indicator, index) => {
            dispatch(noteThunks.fetchNote({ screen: 'pre', impact, indicator }))
              .then(res => {
                setPreNotes(val => ({ ...val, [indicator.id]: res.payload }));
              });
            dispatch(noteThunks.fetchNote({ screen: 'post', impact, indicator }))
              .then(res => {
                setPostNotes(val => ({ ...val, [indicator.id]: res.payload }));
              });
          })
        })
      });
    }
  }, [ventures]);

  const indicatorRows = [];

  ventures.filter(v => !hiddenVentures.includes(v.id)).forEach(venture => {
    venture.impacts.forEach(impact => {
      impact.indicators.forEach((indicator, index) => {
        indicatorRows.push(
          <TableRow key={indicator.id}>
            <TableCell sx={{ p: 0.5 }}>{venture.name}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{impact.name}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{indicator.name}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{indicator.quantificationType}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getAverageChange(impact, indicator)[0]}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getRiskItem(preNotes[indicator.id])?.risk || '-'}%</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getAverageChange(impact, indicator)[1]}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getRiskItem(postNotes[indicator.id], preNotes[indicator.id])?.risk || '-'}%</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getAverageChange(impact, indicator)[2]}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getAverageChange(impact, indicator)[3]}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getIndicatorInceptionData(impact, indicator, getNetOutcome)}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{getIndicatorThisYearData(impact, indicator, getNetOutcome)}</TableCell>
            <TableCell sx={{ p: 0.5 }}>{indicator.year}</TableCell>
          </TableRow>
        );
      })
    });
  });

  const toggleHideVenture = (venture) => {
    if (hiddenVentures.includes(venture.id)) {
      setHiddenVentures(hiddenVentures.filter(id => id !== venture.id));
    } else {
      setHiddenVentures([...hiddenVentures, venture.id]);
    }
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box mb={2} display='flex' gap2={2}>
          {ventures.map(v => (
            <FormControlLabel
              key={v.id}
              componentsProps={{ typography: getTypography('caption') }}
              control={<Checkbox checked={!hiddenVentures.includes(v.id)} onChange={() => toggleHideVenture(v)} />}
              label={v.name}
            />
          ))}
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Venture
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Impact
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Indicator
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Quantification by
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Value pre
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Risk pre
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Value post
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Risk post
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Absolute improvement
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Relative improvement
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Net impact since inception
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Net impact current year
              </TableCell>
              <TableCell component='th' sx={{ p: 0.5, fontWeight: 'bold', backgroundColor: 'secondary.subtle' }}>
                Measurement start year
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {indicatorRows}
          </TableBody>
        </Table>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(IndicatorsOverview);
