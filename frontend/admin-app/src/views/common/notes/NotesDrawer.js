import React, { memo, useRef, useState } from 'react';
import { Box, Button, Divider, Drawer, Typography, useTheme } from "@mui/material";
import { FormikProvider, useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { noteActions, noteSelectors, noteThunks } from "store/ducks/note";
import LinkIcon from '@mui/icons-material/Link';
import AttachmentIcon from '@mui/icons-material/Attachment';
import AddLink from "./AddLink";
import LinkCard from "./LinkCard";
import FileCard from "./FileCard";
import { toast } from "react-toastify";
import { getTypography } from "shared-components/utils/typography";
import Loader from "shared-components/views/components/Loader";
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import FieldLabel from "shared-components/views/components/FieldLabel";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const NotesDrawer = () => {
  const theme = useTheme();
  const [addingLink, setAddingLink] = useState();
  const note = useSelector(noteSelectors.getNote()) || {};
  const loading = useSelector(noteSelectors.getNoteLoading());
  const noteDetails = useSelector(noteSelectors.getNoteDetails());
  const dispatch = useDispatch();
  const fileRef = useRef();

  const onClose = () => {
    dispatch(noteActions.closeDrawer());
  }

  const addLink = () => {
    setAddingLink(!addingLink);
  }

  const addFile = () => {
    fileRef.current.click();
  }

  const formikContext = useFormik({
    initialValues: {
      ...note,
      comment: note.comment || '',
      links: note.links || [],
      files: note.files || [],
      newFiles: [],
    },
    enableReinitialize: true,
    onSubmit: (data, { setSubmitting }) => {
      dispatch(noteThunks.createNote({ note: data, details: noteDetails }))
        .then(() => {
          onClose();
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  });

  const saveLink = (link) => {
    const links = formikContext.values.links;
    formikContext.setFieldValue('links', [...links, link]);
    setAddingLink(false);
  }

  const deleteLink = (index) => {
    const links = [...formikContext.values.links];
    links.splice(index, 1);
    formikContext.setFieldValue('links', links);
  }

  const fileSelected = (e) => {
    const files = e.currentTarget.files;

    if ([...files].some(f => f.size > 52428800)) {
      toast.error('The selected file is too large');
      return;
    }

    const newFiles = Array.from(files).map(f => ({ file: f }));
    formikContext.setFieldValue('newFiles', [...formikContext.values.newFiles, ...newFiles]);
  }

  const deleteFile = (index) => {
    const files = [...formikContext.values.files];
    files.splice(index, 1);
    formikContext.setFieldValue('files', files);
  }

  const deleteNewFile = (index) => {
    const files = [...formikContext.values.newFiles];
    files.splice(index, 1);
    formikContext.setFieldValue('newFiles', files);
  }

  return (
    <Drawer anchor='right' open={!!noteDetails.screen} sx={{ zIndex: theme.zIndex.drawer + 1 }} onClose={onClose}>
      <CustomErrorBoundary>
        <Box p={2}>
          <Typography variant='h5'>Notes</Typography>
        </Box>
        <Divider />
        <Box width={400} p={4}>
          {loading && <Loader />}
          {!loading && (
            <Box>
              <Box display='flex' flexDirection='column' justifyContent='space-between' minHeight='80vh' gap={2}>
                <Box>
                  <FormikProvider value={formikContext}>
                    <FormikTextInput
                      multiline
                      name='comment'
                      placeholder='Your comment here'
                      label='Your comment here'
                      fullWidth
                      inputProps={{ maxLength: 1000, style: { ...getTypography('subtitle') } }}
                      letterCounter
                    />
                  </FormikProvider>
                  {formikContext.values.links.map((l, index) =>
                    <LinkCard key={index} sx={{ mt: 1 }} link={l} onDelete={() => deleteLink(index)} editMode />)
                  }
                  {formikContext.values.files.map((f, index) =>
                    <FileCard
                      key={index}
                      sx={{ mt: 1 }}
                      file={f}
                      onDelete={() => deleteFile(index)}
                      editMode
                      allowDownload
                    />
                  )}
                  {formikContext.values.newFiles.map((f, index) =>
                    <FileCard key={index}
                      sx={{ mt: 1 }}
                      file={f.file}
                      onDelete={() => deleteNewFile(index)}
                      editMode />)
                  }
                  {!addingLink && (
                    <>
                      <FieldLabel sx={{ mt: 2 }}>Supporting evidence sources (max file size - 50mb)</FieldLabel>
                      <Box display='flex' gap={1} mb={2}>
                        <Button
                          variant='outlined'
                          startIcon={<AttachmentIcon />}
                          onClick={addFile}
                          fullWidth
                          size='small'
                        >
                          Add file
                        </Button>
                        <Button variant='outlined' startIcon={<LinkIcon />} onClick={addLink} fullWidth size='small'>
                          Add link
                        </Button>
                      </Box>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    style={{ display: 'none' }}
                    type="file"
                    onChange={fileSelected}
                  />
                  {addingLink && <AddLink sx={{ mb: 2 }} onClose={() => setAddingLink(false)} save={saveLink} />}
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
          )}
        </Box>
      </CustomErrorBoundary>
    </Drawer>
  );
};

export default memo(NotesDrawer);
