const getNote = () => state => state.note.note.data;
const getNoteLoading = () => state => state.note.note.isLoading;
const getNoteDetails = () => state => state.note.details;

export default {
  getNote,
  getNoteLoading,
  getNoteDetails,
};
