import { styled } from "@mui/material";
import Card from "@mui/material/Card";

export default styled(Card)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  padding: theme.spacing(1.5, 2),
  border: `1px solid ${theme.palette.border}`,
}))
