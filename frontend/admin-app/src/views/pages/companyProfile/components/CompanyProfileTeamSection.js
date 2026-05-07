import React, { memo } from 'react';
import { Box, Button, Card, Typography } from '@mui/material';
import CompanyProfileTeamMemberForm from "./CompanyProfileTeamMemberForm";
import CompanyProfileTeamMemberCard from "./CompanyProfileTeamMemberCard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileTeamSection = ({ items, label, type, newItem, setNewItem, isPortfolio }) => {
  const { setNodeRef } = useDroppable({ id: type });

  return (
    <CustomErrorBoundary>
      <SortableContext id={type} items={items.map(m => m.id)} strategy={verticalListSortingStrategy}>
        <Card
          sx={{ p: 2, border: 1, borderColor: 'border', display: 'flex', flexDirection: 'column', gap: 2 }}
          ref={setNodeRef}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='h5'>{label}</Typography>
            <Button variant='outlined' onClick={() => setNewItem({ type })}>Add</Button>
          </Box>
          {newItem && (
            <CompanyProfileTeamMemberForm
              member={newItem}
              closeForm={() => setNewItem(null)}
              isPortfolio={isPortfolio}
            />
          )}
          {items.length > 0 && (
            <Box display='flex' flexDirection='column' gap={2}>
              {items.map(m => <CompanyProfileTeamMemberCard key={m.id} member={m} edit={setNewItem} />)}
            </Box>
          )}
        </Card>
      </SortableContext>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileTeamSection);
