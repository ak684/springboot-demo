import React, { memo, useState } from 'react';
import Modal from "shared-components/views/components/modal/Modal";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Checkbox,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { ventureSelectors, ventureThunks } from "store/ducks/venture";
import { useNavigate, useParams } from "react-router-dom";
import { getImpactIndex } from "shared-components/utils/impact";
import { clone } from "shared-components/utils/lo";
import Loader from "shared-components/views/components/Loader";

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  fontSize: 10,
  fontWeight: 600,
  color: theme.palette.secondary.dark,
  textTransform: 'uppercase',
  border: 'none',
  lineHeight: '16px',
  textAlign: 'center',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  border: 'none',
  textAlign: 'center',
}));

const getScoringProgress = (impact) => {
  const totalQuestions = impact.positive ? 8 + impact.indicators.length * 2 : 7;
  let answeredQuestions = 0;
  const score = impact.scoring.at(-1) || {};

  if (impact.positive) {
    answeredQuestions = !!score.contribution + !!score.degreeOfChange + !!score.duration + !!score.previousEvidence
      + !!score.problemImportance + !!score.sizeOfStakeholders + !!score.stakeholderSituation + !!score.proximity;
    (score.indicatorScores || []).forEach(indicatorScore => {
      answeredQuestions += !!indicatorScore.noisiness;
      answeredQuestions += !!indicatorScore.validation;
    })
  } else {
    answeredQuestions = !!score.contribution + !!score.degreeOfChange + !!score.durationNegative
      + !!score.previousEvidenceNegative + !!score.problemImportanceNegative + !!score.sizeOfStakeholdersNegative
      + !!score.stakeholderSituationNegative;
  }

  return Math.round(answeredQuestions / totalQuestions * 100);
}

const getProgressColor = (impact) => {
  const progress = getScoringProgress(impact);

  if (progress <= 30) {
    return 'error.main';
  } else if (progress <= 99) {
    return 'warning.main';
  } else {
    return 'success.main';
  }
}

const AiScoringModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const [impacts, setImpacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const scoreImpacts = () => {
    setLoading(true);
    dispatch(ventureThunks.aiScoreImpacts({ ventureId, impacts }))
      .then(() => {
        setLoading(false);
        navigate(`/ventures/${ventureId}/scoring-overview`);
      });
  }

  const toggleImpact = (impact) => {
    if (impacts.find(i => i.id === impact.id)) {
      setImpacts(impacts.filter(i => i.id !== impact.id));
    } else {
      setImpacts([...impacts, impact]);
    }
  }

  const sortedImpacts = clone(venture.impacts).sort((i1, i2) => i2.positive - i1.positive);

  return (
    <Modal
      open
      onClose={onClose}
      title='Score using AI'
      actions={loading ? <Button onClick={onClose}>Close</Button> : <Button onClick={scoreImpacts}>Score</Button>}
    >
      {loading && (
        <Box>
          <Typography align='center' sx={{ mb: 2, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }} color='secondary.main'>
            Please wait for selected impact chains to be scored. This may take a few minutes
          </Typography>
          <Loader />
        </Box>
      )}
      {!loading && (
        <Box py={2} px={3} sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'border' }}>
          <Typography variant='bodyBold' sx={{ mb: 2 }}>
            Please select impact chains you would like to score using AI:
          </Typography>
          <Table sx={{ border: 'none' }}>
            <TableHead>
              <TableRow sx={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'border' }}>
                <StyledHeaderCell component='th' sx={{ textAlign: 'left' }}>Impact name</StyledHeaderCell>
                <StyledHeaderCell component='th'>Progress</StyledHeaderCell>
                <StyledHeaderCell component='th'>SDGs assigned</StyledHeaderCell>
                <StyledHeaderCell component='th'>Geographic boundary</StyledHeaderCell>
                <StyledHeaderCell component='th' sx={{ textAlign: 'right' }}>Score</StyledHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedImpacts.map(impact => (
                <TableRow key={impact.id}>
                  <StyledTableCell sx={{ textAlign: 'left' }}>
                    <Typography component='span'
                      color={impact.positive ? 'success.main' : 'error.main'}
                      variant='subtitleBold'>
                      {impact.positive ? 'Positive' : 'Negative'} {getImpactIndex(impact, sortedImpacts)}:
                    </Typography>&nbsp;
                    <Typography component='span' variant='subtitle'>{impact.name}</Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant='subtitleBold' color={getProgressColor(impact)}>
                      {getScoringProgress(impact)}%
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Checkbox
                      sx={{ p: 0 }}
                      disabled
                      checked={impact.goals.length > 0}
                      onClick={() => toggleImpact(impact)}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Checkbox
                      sx={{ p: 0 }}
                      disabled
                      checked={impact.geography.length > 0}
                      onClick={() => toggleImpact(impact)}
                    />
                  </StyledTableCell>
                  <StyledTableCell sx={{ textAlign: 'right' }}>
                    <Checkbox
                      sx={{ p: 0 }}
                      checked={!!impacts.find(i => i.id === impact.id)}
                      onClick={() => toggleImpact(impact)}
                    />
                  </StyledTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Modal>
  );
};

export default memo(AiScoringModal);
