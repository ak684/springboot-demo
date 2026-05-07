const getNote = () => state => state.note.note.data;
const getNoteLoading = () => state => state.note.note.isLoading;

export default {
  getNote,
  getNoteLoading,
};
