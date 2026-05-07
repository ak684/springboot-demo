import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, TextField, Typography, CircularProgress } from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import BaseSection from './BaseSection';
import { v1LongTimeout } from 'services/api';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';

const CompanyNotesSection = ({ companyId, portfolioId }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef(content);
  const originalContentRef = useRef(originalContent);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    originalContentRef.current = originalContent;
  }, [originalContent]);

  useEffect(() => {
    const fetchNote = async () => {
      if (!companyId || !portfolioId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await v1LongTimeout.get(
          `/companies/${companyId}/notes?portfolioId=${portfolioId}`
        );
        const noteContent = response.data?.content || '';
        setContent(noteContent);
        setOriginalContent(noteContent);
      } catch (error) {
        console.error('Error fetching company note:', error);
        toast.error('Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [companyId, portfolioId]);

  const saveNote = useCallback(async (noteContent) => {
    if (!companyId || !portfolioId) return;

    try {
      setSaving(true);
      await v1LongTimeout.put(
        `/companies/${companyId}/notes?portfolioId=${portfolioId}`,
        { content: noteContent }
      );
      setOriginalContent(noteContent);
    } catch (error) {
      console.error('Error saving company note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  }, [companyId, portfolioId]);

  const debouncedSave = useMemo(
    () => debounce((noteContent) => {
      saveNote(noteContent);
    }, 2000),
    [saveNote]
  );

  // Cleanup: cancel debounce and save any pending changes on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      // Save any unsaved changes when component unmounts (modal closes)
      if (contentRef.current !== originalContentRef.current) {
        saveNote(contentRef.current);
      }
    };
  }, [debouncedSave, saveNote]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedSave(newContent);
  };

  const handleBlur = () => {
    if (content !== originalContent) {
      debouncedSave.cancel();
      saveNote(content);
    }
  };

  if (!portfolioId) {
    return null;
  }

  return (
    <BaseSection
      title="Internal Notes"
      subtitle="Notes are visible to portfolio members only"
      icon={<NotesIcon />}
      actions={saving ? <CircularProgress size={16} /> : null}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box>
          <TextField
            multiline
            fullWidth
            minRows={4}
            maxRows={12}
            value={content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            placeholder="Add internal notes about this company..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                '& fieldset': {
                  border: 'none'
                },
                '&:hover fieldset': {
                  border: 'none'
                },
                '&.Mui-focused fieldset': {
                  border: 'none'
                }
              }
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: '#999999',
              mt: 1,
              display: 'block',
              fontStyle: 'italic'
            }}
          >
            Notes are automatically saved
          </Typography>
        </Box>
      )}
    </BaseSection>
  );
};

export default CompanyNotesSection;
