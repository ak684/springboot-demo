import React, { memo } from 'react';
import { Avatar, Box, Card, IconButton, Link, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { useDispatch } from "react-redux";
import { ventureThunks } from "store/ducks/venture";
import { useParams } from "react-router-dom";
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileTeamMemberCard = ({ member, edit, sx = {} }) => {
  const { ventureId } = useParams();
  const dispatch = useDispatch();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <CustomErrorBoundary>
      <Card
        sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, border: 1, borderColor: 'border', ...sx }}
        style={style}
      >
        <DragIndicatorOutlinedIcon
          sx={{ cursor: 'pointer', color: 'secondary.main' }}
          {...attributes}
          {...listeners}
          ref={setNodeRef}
        />
        <Avatar sx={{ width: 40, height: 40 }} src={member.avatar} alt={`${member.name} ${member.lastName}`} />
        <Box width={150}>
          <Typography noWrap variant='subtitleBold'>{member.name} {member.lastName}</Typography>
          <Typography noWrap variant='subtitle'>{member.position}</Typography>
        </Box>
        <Box>
          {member.linkedin && (
            <IconButton component={Link} href={member.linkedin} target='_blank' sx={{ cursor: 'pointer' }}>
              <LinkedInIcon sx={{ color: '#0077B7' }} />
            </IconButton>
          )}
        </Box>
        <Typography variant='subtitleBold' sx={{ flexGrow: 1 }}>{member.email}</Typography>
        <Box display='flex' onClick={(e) => e.stopPropagation()}>
          <IconButton onClick={() => edit(member)}><EditIcon /></IconButton>
          <IconButton onClick={() => dispatch(ventureThunks.removeTeamMember({ ventureId, data: member }))}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileTeamMemberCard);
