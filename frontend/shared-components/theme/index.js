import { createTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

const textPrimary = '#121212';
const textSecondary = '#383838';
const primaryMain = '#2568F6';
const primarySubtle = alpha(primaryMain, 0.2);
const secondaryMain = '#ADBCD0';
const secondaryDark = '#758BAA';
const successMain = '#4D9951';
const errorMain = '#E84747';
const border = '#d4d4d4';

const MAIN_FONT = 'Inter, -apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif;';

let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 744,
      md: 900,
      lg: 1100,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: primaryMain,
      light: '#45A6FF',
      dark: '#052AED',
      contrastText: '#ffffff',
      subtle: primarySubtle,
    },
    secondary: {
      main: secondaryMain,
      light: '#E5EDF6',
      dark: secondaryDark,
      contrastText: '#ffffff',
      subtle: alpha(secondaryMain, 0.2),
    },
    success: {
      main: successMain,
      light: '#83D688',
      dark: '#175C1A',
      contrastText: '#ffffff',
      subtle: alpha(successMain, 0.1),
    },
    warning: {
      main: '#FDB713',
    },
    error: {
      main: errorMain,
      light: '#FD7A7A',
      dark: '#D31414',
      contrastText: '#ffffff',
      subtle: alpha(errorMain, 0.2),
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
      tetriary: '#C0C0C0',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
      fade: '#F2F2F2',
    },
    light: {
      main: '#fff',
      light: '#fff',
      dark: '#fff',
      contrastText: primaryMain,
    },
    border,
  },
  shadows: [
    'none',
    ...Array(4).fill('0 2px 10px rgba(0, 0, 0, 0.05)'),
    ...Array(20).fill(
      '0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)'
    )
  ],
});

const fonts = {
  display: {
    fontFamily: 'Lora, serif',
    fontWeight: 600,
    fontSize: 64,
    lineHeight: 1.28,
    component: 'div',
    [theme.breakpoints.down("lg")]: {
      fontSize: 40,
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: 28,
    },
  },
  h1: {
    fontFamily: 'Lora, serif',
    fontWeight: 600,
    fontSize: 40,
    lineHeight: 1.275,
    [theme.breakpoints.down("lg")]: {
      fontSize: 24,
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: 20,
    },
  },
  h2: {
    fontFamily: 'Lora, serif',
    fontWeight: 600,
    fontSize: 32,
    lineHeight: 1.28125,
    [theme.breakpoints.down("sm")]: {
      fontSize: 18,
    },
  },
  h3: {
    fontFamily: 'Lora, serif',
    fontWeight: 600,
    fontSize: 28,
    lineHeight: 1.285,
    [theme.breakpoints.down("lg")]: {
      fontSize: 20,
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: 12,
    },
  },
  h4: {
    fontFamily: 'Lora, serif',
    fontWeight: 600,
    fontSize: 24,
    lineHeight: 1.3,
    [theme.breakpoints.down("sm")]: {
      fontSize: 16,
    },
  },
  h5: {
    fontFamily: 'Lora, serif',
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.3,
    [theme.breakpoints.down("sm")]: {
      fontSize: 16,
    },
  },
  body: {
    fontSize: 16,
    lineHeight: 1.375,
    [theme.breakpoints.down("sm")]: {
      fontSize: 14,
    },
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 1.375,
    fontWeight: 700,
    [theme.breakpoints.down("sm")]: {
      fontSize: 14,
    },
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 1.2,
    [theme.breakpoints.down("sm")]: {
      fontSize: 12,
    },
  },
  subtitleBold: {
    fontSize: 14,
    lineHeight: 1.2,
    fontWeight: 700,
    [theme.breakpoints.down("sm")]: {
      fontSize: 12,
    },
  },
  caption: {
    fontSize: 12,
    lineHeight: 1.25,
  },
  captionBold: {
    fontSize: 12,
    lineHeight: 1.25,
    fontWeight: 700,
  },
  overline: {
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1.25,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
};

theme = createTheme(theme, {
  typography: {
    fontFamily: MAIN_FONT,
    color: textPrimary,
    ...fonts,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
      styleOverrides: {
        root: {
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 8,
          paddingLeft: 24,
          paddingRight: 24,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          [theme.breakpoints.down('sm')]: {
            fontSize: 12,
            padding: 6,
          },
        },
        sizeSmall: {
          fontSize: 12,
          lineHeight: 1,
          padding: '8px 16px',
        }
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: primarySubtle,
          borderRadius: 8,
          ...fonts.h5,
        },
        label: {
          padding: '0 16px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          MozAppearance: 'textfield',
          '&::-webkit-outer-spin-button': {
            WebkitAppearance: 'none',
            margin: 0
          },
          '&::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        shrink: {
          ...fonts.overline,
          color: secondaryDark,
          transform: 'translate(0, 4px) scale(0.75)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'white',
          borderColor: border,
          borderRadius: 16,
        },
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 14,
          backgroundColor: textSecondary,
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          width: '100%',
          background: '#ffffff',
          borderCollapse: 'collapse',
          border: `1px solid ${border}`,
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          border: `1px solid ${border}`,
        }
      }
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          display: 'h2',
          h1: 'h2',
          h2: 'h2',
          h3: 'h2',
          h4: 'h2',
          h5: 'h2',
          h6: 'h2',
          body: 'div',
          bodyBold: 'div',
          subtitle: 'div',
          subtitleBold: 'div',
          caption: 'div',
          captionBold: 'div',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: theme.palette.background.default,
          scrollbarColor: `transparent ${secondaryMain}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: '6px',
            backgroundColor: secondaryMain,
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
            backgroundColor: '#788EAB',
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: '#788EAB',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#788EAB',
          },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent',
          },
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${border}`,
          '&:not(:last-child)': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 700,
        }
      }
    }
  },
  zIndex: {
    ...theme.zIndex,
    tooltip: 900000
  }
})

export default theme;
