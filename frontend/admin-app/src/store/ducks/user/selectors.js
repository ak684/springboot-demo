const getCurrentUser = () => state => state.user.current.data;
const userLoading = () => state => state.user.current.isLoading;
const initialUserLoading = () => state => state.user.initialLoading;

const getSubscriptionDetails = () => state => state.user.subscriptionDetails.data;
const subscriptionDetailsLoading = () => state => state.user.subscriptionDetails.isLoading;
const getUserIntro = () => state => state.user.intro.data;
const userIntroLoading = () => state => state.user.intro.isLoading;
const isSuperAdmin = () => state => state.user.current.data?.superAdmin || false;

export default {
  getCurrentUser,
  userLoading,
  initialUserLoading,
  getSubscriptionDetails,
  subscriptionDetailsLoading,
  getUserIntro,
  userIntroLoading,
  isSuperAdmin,
};
