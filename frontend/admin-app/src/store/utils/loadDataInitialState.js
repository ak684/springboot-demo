const loadDataInitialState = (initialData, isLoading = true) => ({
  data: initialData,
  isLoading,
  error: null
});

export default loadDataInitialState;
