import React, { memo } from 'react';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useDispatch, useSelector } from "react-redux";
import { userSelectors, userThunks } from "store/ducks/user";
import { Typography } from "@mui/material";
import { reportSelectors, reportThunks } from "store/ducks/report";
import Link from "@mui/material/Link";
import Loader from "shared-components/views/components/Loader";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const GooglePresentation = () => {
  const user = useSelector(userSelectors.getCurrentUser());
  const dispatch = useDispatch();
  const googleFiles = useSelector(reportSelectors.getGoogleFiles());
  const filesLoading = useSelector(reportSelectors.googleFilesLoading());

  const connectGoogle = () => {
    dispatch(userThunks.connectGoogle());
  };

  const createSlide = () => {
    dispatch(reportThunks.createGooglePresentation());
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box>
          {!user.googleConnected && <Button onClick={connectGoogle}>Connect google account</Button>}
          {user.googleConnected && <Typography>Google account connected successfully</Typography>}
        </Box>
        <Box>
          {user.googleConnected && <Button onClick={createSlide} disabled={filesLoading}>Download presentation</Button>}
        </Box>
        {filesLoading && <Loader />}
        {!filesLoading && googleFiles.length > 0 && (
          <Box>
            <Typography>
              We have prepared a spreadsheet and a presentation. You can access them from your connected Google account
            </Typography>
            {googleFiles.map(file => (
              <Box key={file}>
                <Link href={file} target='_blank'>{file}</Link>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(GooglePresentation);
