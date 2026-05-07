import React, { memo } from 'react';
import { styled, Table } from "@mui/material";
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledTable = styled(Table,
  { shouldForwardProp: prop => !['highlighted'].includes(prop) })
(({ theme, highlighted }) => ({
  position: 'relative',

  '.MuiTableCell-root': {
    padding: theme.spacing(1),
    textAlign: 'center',
    ...getTypography('caption'),
    lineHeight: '17px',
  },
  '.MuiTableCell-head': {
    backgroundColor: theme.palette.secondary.subtle,
    ...getTypography('captionBold'),
  },
  '.cell-selected': {
    backgroundColor: theme.palette.primary.subtle,
    border: `2px solid ${theme.palette.primary.main} !important`
  },
  '.MuiTableHead-root': {
    '.MuiTableRow-root': {
      '&:first-of-type .MuiTableCell-root': {
        borderTop: highlighted ? '2px solid blue' : 'inherit'
      },
    },
  },
  '.MuiTableBody-root': {
    '.MuiTableRow-root': {
      '&:last-of-type .MuiTableCell-root': {
        borderBottom: highlighted ? '2px solid blue' : 'inherit'
      }
    },
  },
  '.MuiTableCell-root:first-of-type': {
    borderLeft: highlighted ? '2px solid blue' : 'inherit'
  },
  '.MuiTableCell-root:last-of-type': {
    borderRight: highlighted ? '2px solid blue' : 'inherit'
  },
}))

const QuantificationTable = ({ children, ...rest }) => {
  return (
    <CustomErrorBoundary>
      <StyledTable {...rest}>
        {children}
      </StyledTable>
    </CustomErrorBoundary>
  );
};

export default memo(QuantificationTable);
