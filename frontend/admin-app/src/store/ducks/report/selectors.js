const getGoogleFiles = () => state => state.report.googleFiles.data;
const googleFilesLoading = () => state => state.report.googleFiles.isLoading;
const getFollowers = () => state => state.report.followers.data;

export default {
  getGoogleFiles,
  googleFilesLoading,
  getFollowers,
};
