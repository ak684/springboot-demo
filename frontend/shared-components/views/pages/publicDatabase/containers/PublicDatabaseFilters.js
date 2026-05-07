import React, { memo, useState } from 'react';
import { Box, Card, Checkbox, Collapse, Divider, FormControlLabel, IconButton, Typography } from "@mui/material";
import { getTypography } from "shared-components/utils/typography";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { profitOrientationOptions } from "shared-components/utils/company";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { distinctBy, sortBy } from "shared-components/utils/lo";
import { normalizeGeographyEntries } from "shared-components/utils/geography";

const PublicDatabaseFilters = ({ filters, setFilters, ventures }) => {
  const [sdgCollapsed, setSdgCollapsed] = useState(false);
  const [profitCollapsed, setProfitCollapsed] = useState(false);
  const [countriesCollapsed, setCountriesCollapsed] = useState(false);
  const [sectorCollapsed, setSectorCollapsed] = useState(false);
  const goals = useSelector(dictionarySelectors.getGoals());

  const toggleFilter = (type, value) => {
    if (filters[type].includes(value)) {
      setFilters({ ...filters, [type]: filters[type].filter(v => v !== value) });
    } else {
      setFilters({ ...filters, [type]: [...filters[type], value] });
    }
  }

  const numberOfFilters = filters.sdg.length + filters.profitOrientation.length + filters.sector.length;
  const countries = ventures
    .flatMap(v => v.impacts)
    .flatMap(i => normalizeGeographyEntries(i.geography))
    .filter(c => c.code)
    .filter(distinctBy('code'));
  const sortedCountries = sortBy(countries, 'title');

  return (
    <Card sx={{ width: 300, maxHeight: '85vh', overflowY: 'auto' }}>
      <Typography sx={{ p: 2 }} variant='h5'>
        Filters {numberOfFilters > 0 && <span>({numberOfFilters})</span>}
      </Typography>
      <Divider />
      <Box p={2}>
        <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
          <Typography variant='bodyBold'>SDGs</Typography>
          <IconButton onClick={() => setSdgCollapsed(!sdgCollapsed)}>
            {sdgCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
        <Collapse in={!sdgCollapsed}>
          <Box mt={2} display='flex' flexDirection='column'>
            {goals.map(g => (
              <FormControlLabel
                key={g.name}
                componentsProps={{ typography: getTypography('subtitle') }}
                control={<Checkbox checked={filters.sdg.includes(g.name)}
                  onClick={() => toggleFilter('sdg', g.name)} />}
                label={`${g.number}. ${g.shortName}`}
              />
            ))}
          </Box>
        </Collapse>
      </Box>
      <Divider />
      <Box p={2}>
        <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
          <Typography variant='bodyBold'>Type of organization</Typography>
          <IconButton onClick={() => setProfitCollapsed(!profitCollapsed)}>
            {profitCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
        <Collapse in={!profitCollapsed}>
          <Box mt={2} display='flex' flexDirection='column'>
            {profitOrientationOptions.map(option => (
              <FormControlLabel
                key={option.name}
                componentsProps={{ typography: getTypography('subtitle') }}
                control={
                  <Checkbox
                    checked={filters.profitOrientation.includes(option.name)}
                    onClick={() => toggleFilter('profitOrientation', option.name)}
                  />
                }
                label={option.title}
              />
            ))}
          </Box>
        </Collapse>
      </Box>
      <Divider />
      <Box p={2}>
        <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
          <Typography variant='bodyBold'>Countries</Typography>
          <IconButton onClick={() => setCountriesCollapsed(!countriesCollapsed)}>
            {countriesCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
        <Collapse in={!countriesCollapsed}>
          <Box mt={2} display='flex' flexDirection='column'>
            {sortedCountries.map(c => (
              <FormControlLabel
                key={c.code}
                componentsProps={{ typography: getTypography('subtitle') }}
                control={
                  <Checkbox
                    checked={filters.countries.includes(c.code)}
                    onClick={() => toggleFilter('countries', c.code)} />
                }
                label={c.title}
              />
            ))}
          </Box>
        </Collapse>
      </Box>
      {/*<Divider />*/}
      {/*<Box p={2}>*/}
      {/*  <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>*/}
      {/*    <Typography variant='bodyBold'>Sector (IRIS+ categories)</Typography>*/}
      {/*    <IconButton onClick={() => setSectorCollapsed(!sectorCollapsed)}>*/}
      {/*      {sectorCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}*/}
      {/*    </IconButton>*/}
      {/*  </Box>*/}
      {/*  <Collapse in={!sectorCollapsed}>*/}
      {/*    <Box mt={2} display='flex' flexDirection='column'>*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Agriculture'*/}
      {/*      />*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Air'*/}
      {/*      />*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Biodiversity & Ecosystems'*/}
      {/*      />*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Climate'*/}
      {/*      />*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Diversity & Inclusion'*/}
      {/*      />*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Education'*/}
      {/*      />*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Employment'*/}
      {/*      />*/}
      {/*      <FormControlLabel*/}
      {/*        componentsProps={{ typography: getTypography('subtitle') }}*/}
      {/*        onClick={() => {*/}
      {/*        }}*/}
      {/*        control={<Checkbox checked={false} />}*/}
      {/*        label='Energy'*/}
      {/*      />*/}
      {/*    </Box>*/}
      {/*  </Collapse>*/}
      {/*</Box>*/}
    </Card>
  );
};

export default memo(PublicDatabaseFilters);
