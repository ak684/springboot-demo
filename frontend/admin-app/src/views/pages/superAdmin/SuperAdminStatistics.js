import React, { useEffect, useState } from 'react';
import { Box, Card, Link, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import filters from "shared-components/filters";
import api from "services/api";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { sortBy } from "shared-components/utils/lo";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const SuperAdminStatistics = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("card");
  const [sort, setSort] = useState(null);

  useEffect(() => {
    api.get('/superadmin', {}, { timeout: 600000 }).then((res) => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  let userSubscriptions = [];
  stats
    .filter(u => u.subscriptions?.length > 0)
    .forEach(user => {
      userSubscriptions.push(...user.subscriptions.map(subscription => ({ ...user, ...subscription })));
    });
  if (sort !== null) {
    if (sort === "ASC") {
      userSubscriptions = sortBy(userSubscriptions, 'subscriptionEnd');
    } else {
      userSubscriptions = sortBy(userSubscriptions, 'subscriptionEnd').reverse();
    }
  }

  const toggleSort = () => {
    if (sort === null) {
      setSort("ASC");
    } else if (sort === "ASC") {
      setSort("DESC");
    } else if (sort === "DESC") {
      setSort(null);
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <CustomErrorBoundary>
      <Box p={4} display='flex' flexDirection='column' gap={2}>
        <Box display='flex' alignItems='center' gap={0.5}>
          <Typography variant='subtitle'>Card view</Typography>
          <Switch checked={view === "table"} onChange={() => setView(view === "card" ? "table" : "card")} />
          <Typography variant='subtitle'>Table view</Typography>
        </Box>
        {view === "card" && stats.map(user => (
          <Card
            key={user.email}
            sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5, border: 1, borderColor: 'border' }}
          >
            <Typography>User: <b>{user.name} {user.lastName}</b></Typography>
            <Typography>Created: <b>{filters.date(user.createdAt)}</b></Typography>
            <Typography>Logged in: <b>{user.hasPassword ? 'Yes' : 'No'}</b></Typography>
            <Typography>Email: <Link href={`mailto:{user.email}`}>{user.email}</Link></Typography>
            {user.customerIds.length > 0 && <Typography>Stripe Customer IDs: {user.customerIds.join(', ')}</Typography>}
            {user.subscriptions && (
              <Box>
                <Typography variant='bodyBold'>Subscriptions:</Typography>
                <Box display='flex' gap={2} flexWrap='wrap'>
                  {user.subscriptions.map(subscription => (
                    <Card sx={{ p: 2, border: 1, borderColor: 'border' }} key={subscription.subscriptionId}>
                      <Typography>Id: <b>{subscription.subscriptionId}</b></Typography>
                      <Typography>Created: <b>{filters.date(subscription.createdAt)}</b></Typography>
                      <Typography>Finishes at: <b>{filters.date(subscription.subscriptionEnd * 1000)}</b></Typography>
                      <Typography>Period: <b>{subscription.interval}</b></Typography>
                      <Typography>Product: <b>{subscription.product}</b></Typography>
                      <Typography>Auto renewal: <b>{subscription.renew ? 'Yes' : 'No'}</b></Typography>
                      {subscription.discount && <Typography>Discount: <b>{subscription.discount}</b></Typography>}
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
            {user.ventures?.length > 0 && (
              <Box>
                <Typography variant='bodyBold'>Ventures:</Typography>
                <Box display='flex' gap={2} flexWrap='wrap'>
                  {user.ventures.map(venture => (
                    <Card sx={{ p: 2, border: 1, borderColor: 'border' }} key={venture.id}>
                      <Typography>Name: <b>{venture.name}</b></Typography>
                      <Typography>Subscription ID: <b>{venture.subscriptionId}</b></Typography>
                      <Typography>Active: <b>{venture.active.toString()}</b></Typography>
                      <Typography>Last modified: <b>{filters.date(venture.lastModified)}</b></Typography>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
            {user.portfolios?.length > 0 && (
              <Box>
                <Typography variant='bodyBold'>Portfolios:</Typography>
                <Box display='flex' gap={2} flexWrap='wrap'>
                  {user.portfolios.map(portfolio => (
                    <Card sx={{ p: 2, border: 1, borderColor: 'border' }} key={portfolio.id}>
                      <Typography>Name: <b>{portfolio.name}</b></Typography>
                      <Typography>Last modified: <b>{filters.date(portfolio.lastModified)}</b></Typography>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Card>
        ))}
        {view === "table" && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Name</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Email</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Created</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Logged in</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Stripe IDs</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Subscription ID</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Subscription
                  created</TableCell>
                <TableCell
                  component='th'
                  padding='none'
                  sx={{ fontWeight: 'bold', p: 0.5, cursor: 'pointer' }}
                  onClick={toggleSort}
                >
                  <Box display='flex' alignItems='center' gap={0.25}>
                    <Typography variant='subtitleBold'>Subscription end</Typography>
                    {sort === "ASC" && <ArrowDropDownIcon />}
                    {sort === "DESC" && <ArrowDropUpIcon />}
                  </Box>
                </TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Period</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Product</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Auto renewal</TableCell>
                <TableCell component='th' padding='none' sx={{ fontWeight: 'bold', p: 0.5 }}>Discount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userSubscriptions.map(subscription => (
                <TableRow key={subscription.subscriptionId}>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.name} {subscription.lastName}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.email}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{filters.date(subscription.createdAt)}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.hasPassword ? 'Yes' : 'No'}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.customerIds.join(', ')}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.subscriptionId}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{filters.date(subscription.createdAt)}</TableCell>
                  <TableCell padding='none'
                    sx={{ p: 0.5 }}>{filters.date(subscription.subscriptionEnd * 1000)}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.interval}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.product}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.renew ? 'Yes' : 'No'}</TableCell>
                  <TableCell padding='none' sx={{ p: 0.5 }}>{subscription.discount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </CustomErrorBoundary>
  );
};

export default SuperAdminStatistics;
