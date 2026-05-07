import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  MenuItem,
  styled,
  Switch,
  Tab,
  Tabs,
  Typography,
  useTheme
} from "@mui/material";
import { FormikProvider, useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { noteThunks } from "store/ducks/note";
import LinkIcon from '@mui/icons-material/Link';
import AttachmentIcon from '@mui/icons-material/Attachment';
import { toast } from "react-toastify";
import LinkCard from "../../../common/notes/LinkCard";
import FileCard from "../../../common/notes/FileCard";
import ProgressPie from "../../../common/stepper/ProgressPie";
import { dictionarySelectors } from "store/ducks/dictionary";
import AddLink from "../../../common/notes/AddLink";
import EvidenceCard from "../../../common/notes/EvidenceCard";
import { clone } from "shared-components/utils/lo";
import { scoringThunks } from "store/ducks/scoring";
import { getTypography } from "shared-components/utils/typography";
import TextInput from "shared-components/views/form/TextInput";
import FieldLabel from "shared-components/views/components/FieldLabel";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledTab = styled(Tab)(({ theme }) => ({
  flexBasis: '50%',
  ...getTypography('subtitleBold'),
  textTransform: 'none',
}));

const getQuestionProgress = (value, collection) => {
  return (collection.findIndex(v => v.name === value) + 1) / collection.length;
}

const clonePreValue = (pre) => {
  const cloned = clone(pre);
  cloned.links = pre.links.map(l => ({
    ...l,
    id: null,
  }));
  cloned.files = pre.files.map(f => ({
    ...f,
    id: null,
  }));
  cloned.newFiles = pre.newFiles.map(f => ({
    ...f,
    id: null,
    file: f.file,
  }));

  return cloned;
}

const QuantificationPrePostEvidenceDrawer = ({ onClose, tab, setTab, impact, indicator }) => {
  const theme = useTheme();
  const [preNote, setPreNote] = useState({});
  const [postNote, setPostNote] = useState({});
  const [addingLink, setAddingLink] = useState();
  const [duplicatePre, setDuplicatePre] = useState(false);
  const dispatch = useDispatch();
  const fileRef = useRef();
  const questions = useSelector(dictionarySelectors.getScoringQuestions());
  const indicatorScore = (impact.scoring.at(-1)?.indicatorScores || []).find(i => i.indicator?.id === indicator.id);
  const [noisiness, setNoisiness] = useState(indicatorScore?.noisiness?.name || '');
  const [validation, setValidation] = useState(indicatorScore?.validation?.name || '');

  const addLink = () => {
    setAddingLink(!addingLink);
  }

  const addFile = () => {
    fileRef.current.click();
  }

  const formikContext = useFormik({
    initialValues: {
      pre: {
        ...preNote,
        links: preNote?.links || [],
        files: preNote?.files || [],
        newFiles: [],
      },
      post: {
        ...postNote,
        links: postNote?.links || [],
        files: postNote?.files || [],
        newFiles: [],
      }
    },
    enableReinitialize: true,
    onSubmit: (data, { setSubmitting }) => {
      if (duplicatePre) {
        data.post = {
          id: data.post.id,
          links: [],
          files: [],
          newFiles: [],
        };
      }

      dispatch(scoringThunks.updateIndicatorScoring({ impact, indicator, questions, noisiness, validation }));
      Promise.all([
        dispatch(noteThunks.createNote({
          note: data.pre,
          details: { screen: 'pre', impact, indicator },
          showMessage: false,
        })),
        dispatch(noteThunks.createNote({
          note: { ...data.post, same: duplicatePre },
          details: { screen: 'post', impact, indicator }
        })),
      ])
        .then(() => {
          onClose();
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  });

  useEffect(() => {
    dispatch(noteThunks.fetchNote({ screen: 'pre', impact, indicator }))
      .then(res => {
        setPreNote(res.payload || {});
      });
    dispatch(noteThunks.fetchNote({ screen: 'post', impact, indicator }))
      .then(res => {
        const postNote = res.payload || {}
        setPostNote(postNote);
        setDuplicatePre(!!postNote.same);
      });
    formikContext.resetForm();
  }, []);

  const saveLink = (link) => {
    const links = formikContext.values[tab].links;
    const newLink = {
      ...link,
      comment: '',
      risk: 0,
      evidenceType: 'OWN_VALIDATION',
    }
    formikContext.setFieldValue(`${tab}.links`, [...links, newLink]);
    setAddingLink(false);
  }

  const deleteLink = (index) => {
    const links = [...formikContext.values[tab].links];
    links.splice(index, 1);
    formikContext.setFieldValue(`${tab}.links`, links);
  }

  const fileSelected = (e) => {
    const files = e.currentTarget.files;

    if ([...files].some(f => f.size > 52428800)) {
      toast.error('The selected file is too large');
      return;
    }

    const newFiles = Array.from(files).map(f => ({
      file: f,
      comment: '',
      risk: 0,
      evidenceType: 'OWN_VALIDATION',
    }));

    formikContext.setFieldValue(`${tab}.newFiles`, [...formikContext.values[tab].newFiles, ...newFiles]);
  }

  const deleteFile = (index) => {
    const files = [...formikContext.values[tab].files];
    files.splice(index, 1);
    formikContext.setFieldValue(`${tab}.files`, files);
  }

  const deleteNewFile = (index) => {
    const files = [...formikContext.values[tab].newFiles];
    files.splice(index, 1);
    formikContext.setFieldValue(`${tab}.newFiles`, files);
  }

  return (
    <Drawer anchor='right' open={!!tab} sx={{ zIndex: theme.zIndex.drawer + 1 }} onClose={onClose}>
      <CustomErrorBoundary>
        <Box p={2}>
          <Typography variant='h5'>Evidence estimation</Typography>
        </Box>
        <Divider />
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <StyledTab label='Pre intervention' value='pre' />
          <StyledTab label='Post intervention' value='post' />
        </Tabs>
        <Box width={400} p={4}>
          <Box display='flex' flexDirection='column' justifyContent='space-between' minHeight='80vh' gap={2}>
            <Box>
              {tab === 'post' && (
                <FormControlLabel
                  sx={{ mb: 1 }}
                  control={<Switch checked={duplicatePre} onChange={() => setDuplicatePre(!duplicatePre)} />}
                  label='Same as "Pre intervention"'
                  componentsProps={{ typography: getTypography('subtitle') }}
                />
              )}
              <Box
                sx={{
                  opacity: tab === 'post' && duplicatePre ? 0.5 : 1,
                  pointerEvents: tab === 'post' && duplicatePre ? 'none' : 'auto'
                }}
              >
                <FieldLabel>Own validation</FieldLabel>
                <Box display='flex' alignItems='center' gap={2}>
                  <TextInput value={validation} onChange={(e) => setValidation(e.target.value)} select fullWidth>
                    {questions.validation.map(q => (
                      <MenuItem key={q.name} value={q.name}>{q.shortName}</MenuItem>
                    ))}
                  </TextInput>
                  <ProgressPie percent={getQuestionProgress(validation, questions.validation)} />
                </Box>
                <FieldLabel sx={{ mt: 3 }}>Indicator noisiness</FieldLabel>
                <Box display='flex' alignItems='center' gap={2}>
                  <TextInput value={noisiness} onChange={(e) => setNoisiness(e.target.value)} select fullWidth>
                    {questions.noisiness.map(q => (
                      <MenuItem key={q.name} value={q.name}>{q.shortName}</MenuItem>
                    ))}
                  </TextInput>
                  <ProgressPie percent={getQuestionProgress(noisiness, questions.noisiness)} />
                </Box>
                <FieldLabel sx={{ mt: 3 }}>Data evidence</FieldLabel>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Box display='flex' flexDirection='column' gap={2}>
                    <FormikProvider value={formikContext}>
                      {formikContext.values[duplicatePre ? 'pre' : tab].links.map((l, index) => (
                        <EvidenceCard
                          key={index}
                          editMode
                          item={l}
                          index={index}
                          type='links'
                          tab={duplicatePre ? 'pre' : tab}
                          score={indicatorScore}
                        >
                          <LinkCard sx={{ mt: 1 }} link={l} onDelete={() => deleteLink(index)} editMode />
                        </EvidenceCard>
                      ))}
                      {formikContext.values[duplicatePre ? 'pre' : tab].files.map((f, index) =>
                        <EvidenceCard
                          key={index}
                          editMode
                          item={f}
                          index={index}
                          type='files'
                          tab={duplicatePre ? 'pre' : tab}
                          score={indicatorScore}
                        >
                          <FileCard
                            sx={{ mt: 1 }}
                            file={f}
                            onDelete={() => deleteFile(index)}
                            editMode
                            allowDownload
                          />
                        </EvidenceCard>
                      )}
                      {formikContext.values[duplicatePre ? 'pre' : tab].newFiles.map((f, index) =>
                        <EvidenceCard
                          key={index}
                          editMode
                          item={f}
                          index={index}
                          type='newFiles'
                          tab={duplicatePre ? 'pre' : tab}
                          score={indicatorScore}
                        >
                          <FileCard
                            sx={{ mt: 1 }}
                            file={f.file}
                            onDelete={() => deleteNewFile(index)}
                            editMode
                          />
                        </EvidenceCard>
                      )}
                      {!addingLink && (
                        <Box>
                          <FieldLabel sx={{ mt: 2 }}>Supporting evidence sources (max file size - 50mb)</FieldLabel>
                          <Box display='flex' gap={1} mb={2}>
                            <Button variant='outlined'
                              startIcon={<AttachmentIcon />}
                              onClick={addFile}
                              fullWidth
                              size='small'>
                              Add file
                            </Button>
                            <Button variant='outlined'
                              startIcon={<LinkIcon />}
                              onClick={addLink}
                              fullWidth
                              size='small'>
                              Add link
                            </Button>
                          </Box>
                        </Box>
                      )}
                      {addingLink && <AddLink sx={{ mb: 2 }} onClose={() => setAddingLink(false)} save={saveLink} />}
                      <input
                        ref={fileRef}
                        style={{ display: 'none' }}
                        type="file"
                        onChange={fileSelected}
                      />
                    </FormikProvider>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box mt={2}>
              {formikContext.isSubmitting && <Loader />}
              <Box display='flex' gap={1}>
                <Button color='secondary' onClick={onClose} fullWidth>
                  Close
                </Button>
                <Button onClick={formikContext.handleSubmit} fullWidth disabled={formikContext.isSubmitting}>
                  Save note
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </CustomErrorBoundary>
    </Drawer>
  );
};

export default memo(QuantificationPrePostEvidenceDrawer);
