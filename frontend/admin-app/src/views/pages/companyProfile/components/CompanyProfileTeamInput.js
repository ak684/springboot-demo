import React, { memo, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CompanyProfileTeamMemberCard from "./CompanyProfileTeamMemberCard";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import CompanyProfileTeamSection from "./CompanyProfileTeamSection";
import { ventureSelectors, ventureThunks } from "store/ducks/venture";
import { portfolioSelectors, portfolioThunks } from "store/ducks/portfolio";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileTeamInput = ({ setFieldValue, nextStep, isPortfolio }) => {
  const { ventureId, portfolioId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
  const company = isPortfolio ? portfolio : venture;
  const dispatch = useDispatch();

  const addedCeo = company.team.filter(m => m.type === 'CEO');
  const addedCLevel = company.team.filter(m => m.type === 'C_LEVEL');
  const addedRegular = company.team.filter(m => m.type === 'REGULAR');

  const [newCeo, setNewCeo] = useState(null);
  const [newCLevel, setNewCLevel] = useState(null);
  const [newRegular, setNewRegular] = useState(null);

  const [teamMembers, setTeamMembers] = useState({
    CEO: addedCeo,
    C_LEVEL: addedCLevel,
    REGULAR: addedRegular,
  });

  useEffect(() => {
    setTeamMembers({
      CEO: addedCeo,
      C_LEVEL: addedCLevel,
      REGULAR: addedRegular,
    })
  }, [company.team.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState();
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const findContainer = (id) => {
    return typeof id === 'string' ? id :
      Object.keys(teamMembers).find((key) => teamMembers[key].some(m => m.id === id));
  }

  const handleDragOver = (event) => {
    const { active, over } = event;
    const { id } = active;
    const { id: overId } = over;

    const activeMember = company.team.find(m => m.id === id);
    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setTeamMembers(prev => {
      const newActiveContainer = prev[activeContainer].filter(m => m.id !== id);
      const newOverContainer = [...prev[overContainer], { ...activeMember, type: overContainer }];
      return { ...prev, [activeContainer]: newActiveContainer, [overContainer]: newOverContainer }
    });
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const { id } = active;
    const { id: overId } = over;

    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }

    const activeIndex = teamMembers[overContainer].findIndex(m => m.id === active.id);
    const overIndex = teamMembers[overContainer].findIndex(m => m.id === overId);

    setTeamMembers(prev => {
      const newTeamMembers = {
        ...prev,
        [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex)
      }
      const updatedTeamArray = [...newTeamMembers.CEO, ...newTeamMembers.C_LEVEL, ...newTeamMembers.REGULAR];
      setFieldValue('team', updatedTeamArray);

      if (isPortfolio) {
        dispatch(portfolioThunks.updateTeamMembersOrder({ portfolioId, data: updatedTeamArray }));
      } else {
        dispatch(ventureThunks.updateTeamMembersOrder({ ventureId, data: updatedTeamArray }));
      }

      return newTeamMembers;
    });

    setActiveId(null);
  };

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Key employees</StepperTitle>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <Box display='flex' flexDirection='column' gap={2} mt={4}>
              <CompanyProfileTeamSection
                items={teamMembers.CEO}
                label='Company head'
                type='CEO'
                newItem={newCeo}
                setNewItem={setNewCeo}
                isPortfolio={isPortfolio}
              />
              <CompanyProfileTeamSection
                items={teamMembers.C_LEVEL}
                label='C-level employees'
                type='C_LEVEL'
                newItem={newCLevel}
                setNewItem={setNewCLevel}
                isPortfolio={isPortfolio}
              />
              <CompanyProfileTeamSection
                items={teamMembers.REGULAR}
                label='Other employees'
                type='REGULAR'
                newItem={newRegular}
                setNewItem={setNewRegular}
                isPortfolio={isPortfolio}
              />
              <DragOverlay>
                {activeId ? <CompanyProfileTeamMemberCard sx={{ minWidth: 500 }}
                  member={company.team.find(m => m.id === activeId)} /> : null}
              </DragOverlay>
            </Box>
          </DndContext>
          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileTeamInput);
