import React, { useEffect, useState } from "react";
import { Box, Button, Divider, Grid, Rating, Typography, useMediaQuery, useTheme, } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import api from "services/api";
import AiTocFooter from "./components/AiTocFooter";
import StarIcon from "@mui/icons-material/Star";
import Loader from "shared-components/views/components/Loader";
import AiTocSeeStatistics from "./AiTocSeeStatistics";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const AiTocLanding = () => {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  const goToCreation = () => {
    navigate("/ai-toc");
  };

  useEffect(() => {
    api.get("/ai-toc/stats").then(setStats);
  }, []);

  if (!stats) {
    return <Loader />;
  }

  return (
    <CustomErrorBoundary>
      <Box
        minHeight={`calc(100vh - ${HEADER_HEIGHT}px)`}
        p={{ xs: 3, md: 6, lg: 15 }}
        pb={{ xs: 15 }}
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        gap={5}
        sx={{
          background:
            "linear-gradient(209deg, rgba(255, 255, 255, 0.00) 24.35%, #FFF 56.97%), url(/images/background/brain.jpeg) lightgray -1px -8.233px / 100.327% 117.614% no-repeat",
          backgroundSize: "100%",
        }}
      >
        <Typography variant="display" sx={{ maxWidth: 750 }}>
          Use Al to develop your measurement system
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          flexWrap="wrap"
          gap={5}
          width="100%"
        >
          <Button onClick={goToCreation} fullWidth={isMobileView}>
            Create theory of change for free
          </Button>
          <Box display="flex" alignItems="center" gap={2}>
            <Rating
              precision={0.1}
              defaultValue={stats.rating}
              sx={{ pointerEvents: "none" }}
              size="large"
              emptyIcon={
                <StarIcon
                  style={{ color: theme.palette.secondary.light }}
                  fontSize="inherit"
                />
              }
            />
            <Typography variant="subtitle">
              {stats.ratingTotal} innovators rated
            </Typography>
          </Box>
        </Box>
        <Box
          p={2}
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          gap={2}
          sx={{ border: 1, borderColor: "border", borderRadius: "16px" }}
        >
          <Box>
            <Typography sx={{ width: 200 }} variant="caption">
              AI ToC created today
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 18, fontWeight: "bold" }}>
              {stats.today}
            </Typography>
          </Box>
          <Divider
            orientation={isMobileView ? "horizontal" : "vertical"}
            flexItem
          />
          <Box>
            <Typography sx={{ width: 200 }} variant="caption">
              AI ToC created since {stats.since}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 18, fontWeight: "bold" }}>
              {stats.all}
            </Typography>
          </Box>
        </Box>
        <Divider flexItem />
        <Grid container spacing={5}>
          <Grid item xs={12} sm={4} display="flex" gap={3}>
            <Box
              component="img"
              width={52}
              height={52}
              alt="1. Generate"
              src="/images/icons/ai-toc/ai.svg"
            />
            <Box>
              <Typography variant="bodyBold">
                1. Generate AI Theory of Change
              </Typography>
              <Typography variant="caption" sx={{ mt: 1 }}>
                Testing takes about 2 minutes and does not require any login or
                payment
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4} display="flex" gap={3}>
            <Box
              component="img"
              width={52}
              height={52}
              alt="2. Feedback"
              src="/images/icons/ai-toc/feedback.svg"
            />
            <Box>
              <Typography variant="bodyBold">
                2. Provide feedback&nbsp;
                <Typography
                  component="span"
                  sx={{ fontWeight: "normal" }}
                  color="secondary.main"
                >
                  (optional)
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ mt: 1 }}>
                Share your thoughts about the result
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4} display="flex" gap={3}>
            <Box
              component="img"
              width={52}
              height={52}
              alt="3. Account"
              src="/images/icons/ai-toc/account.svg"
            />
            <Box>
              <Typography variant="bodyBold">
                3. Option to create a (free trial) account
              </Typography>
              <Typography variant="caption" sx={{ mt: 1 }}>
                You can create an account (first 2 weeks free trial) to save and
                refine the result
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <AiTocFooter values={{}} />
        <AiTocSeeStatistics anchor={location.hash} />
      </Box>
    </CustomErrorBoundary>
  );
};

export default AiTocLanding;
