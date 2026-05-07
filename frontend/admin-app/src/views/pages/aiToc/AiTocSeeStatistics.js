import {
  Box,
  Button,
  Grid,
  Rating,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState, useEffect, useRef} from "react";
import AiTocCountryStatistics from "./AiTocCountryStatistics";
import StarIcon from "@mui/icons-material/Star";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import api from "services/api";
import { useNavigate } from "react-router-dom";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const AiTocSeeStatistics = ({ anchor }) => {
  const [showStatistics, setShowStatistics] = useState(false);
  const [stats, setStats] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobileView = useMediaQuery(theme.breakpoints.down("sm"));
  const statisticsRef = useRef(null);

  const goToCreation = () => {
    navigate("/ai-toc");
  };

  useEffect(() => {
    api.get("/ai-toc/stats").then(setStats);
  }, []);

  useEffect(() => {
    if (anchor === "#statistics") {
      setShowStatistics(true);
    }
  }, [anchor]);

  useEffect(() => {
    let timeoutId;
    if (showStatistics && anchor === "#statistics") {
    timeoutId = setTimeout(() => {
      if (statisticsRef.current) {
        statisticsRef.current.scrollIntoView({ behavior: "smooth" });
        window.scrollBy(0, 650);
      }
    }, 1000);
  }

  return () => {
    clearTimeout(timeoutId);
  };
  }, [showStatistics, anchor]);

  const toggleStatistics = () => {
    setShowStatistics(!showStatistics);
  };

  return (
    <CustomErrorBoundary>
      {showStatistics ? (
        <Box sx={{ width: "100%", alignItems: "center" }} ref={statisticsRef}>
          <Box>
            <AiTocCountryStatistics />
          </Box>
         {stats ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={5}
            width="100%"
          >
            <br />
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
            <Button
              sx={{
                display: "flex",
                alignItems: "center",
                // width: "100%",
                color: "blue",
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                mt: -2, // Add margin top for spacing
                "&:hover": { background: "none" },
                "&:focus": { outline: "none" },
              }}
              onClick={toggleStatistics}
            >
              Hide Statistics
              <ArrowUpwardIcon sx={{ fontSize: "1.5rem", marginLeft: "5px" }} />
            </Button>
          </Box>
        ) : (
            <Typography>Loading statistics...</Typography>
        )}
        </Box>
      ) : (
        <Box display="flex" width="100%" justifyContent={"center"}>
          <Button
            sx={{
              color: "blue",
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              "&:hover": { background: "none" },
              "&:focus": { outline: "none" },
            }}
            onClick={toggleStatistics}
          >
            See Statistics
            <ArrowDownwardIcon sx={{ fontSize: "1.5rem", marginLeft: "5px" }} />
          </Button>
        </Box>
      )}
    </CustomErrorBoundary>
  );
};

export default AiTocSeeStatistics;
