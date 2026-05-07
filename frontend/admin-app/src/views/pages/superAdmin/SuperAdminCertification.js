import React, { useEffect, useState } from 'react';
import { Box, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import api from "../../../services/api";
import { sortBy } from "shared-components/utils/lo";
import TextInput from "shared-components/views/form/TextInput";
import FieldLabel from "shared-components/views/components/FieldLabel";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const SuperAdminCertification = () => {
  const [ventures, setVentures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get('/superadmin/ventures')
      .then(res => {
        setVentures(res);
        setLoading(false);
      });
  }, []);

  const filteredVentures = sortBy(ventures.filter(v => v.name.toLowerCase().includes(search.toLowerCase())), 'id');

  const updateCertificationLevel = (venture, level) => {
    const ventureIndex = ventures.indexOf(venture);
    const updatedVenture = { ...venture, certification: level };
    ventures.splice(ventureIndex, 1, updatedVenture);
    api.put(`/superadmin/certification/${venture.id}`, level)
      .then(() => {
        setVentures([...ventures]);
      });
  }

  if (loading) {
    return <Loader />
  }

  return (
    <CustomErrorBoundary>
      <Box p={2}>
        <Box mb={4}>
          <FieldLabel>Search</FieldLabel>
          <TextInput
            placeholderd='Search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 400 }}
          />
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding='none' sx={{ p: 0.5, fontWeight: 'bold', minWidth: 50 }}>ID</TableCell>
              <TableCell padding='none' sx={{ p: 0.5, fontWeight: 'bold' }}>Name</TableCell>
              <TableCell padding='none' sx={{ p: 0.5, fontWeight: 'bold', minWidth: 150 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVentures.map(v => (
              <TableRow key={v.id}>
                <TableCell padding='none' sx={{ p: 0.5 }}>{v.id}</TableCell>
                <TableCell padding='none' sx={{ p: 0.5 }}>{v.name}</TableCell>
                <TableCell padding='none' sx={{ p: 0.5 }}>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography>Level:</Typography>
                    <TextInput
                      select
                      value={v.certification || 0}
                      onChange={(e) => updateCertificationLevel(v, e.target.value)}
                      sx={{ '.MuiInputBase-root': { minHeight: 'unset !important' } }}
                    >
                      <MenuItem value={0}>0</MenuItem>
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={4}>4</MenuItem>
                      <MenuItem value={5}>5</MenuItem>
                    </TextInput>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </CustomErrorBoundary>
  );
};

export default SuperAdminCertification;
