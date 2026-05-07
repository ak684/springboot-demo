import theme from "../theme";

export const getTypography = (styleName) => {
  const typographyStyle = theme.typography[styleName];
  const getStyleForBreakpoint = (breakpoint) => {
    const breakpointStyle = typographyStyle[theme.breakpoints.down(breakpoint)] || {};
    return { ...breakpointStyle };
  };

  let result = { ...typographyStyle };
  const breakpoints = ['xl', 'lg', 'md', 'sm', 'xs'];
  const screenWidth = window.innerWidth;

  for (let i = 0; i < breakpoints.length; i++) {
    const breakpoint = breakpoints[i];
    if (theme.breakpoints.values[breakpoint] < screenWidth) {
      break;
    }

    result = { ...result, ...getStyleForBreakpoint(breakpoint) };
  }

  return {
    ...(result.fontFamily !== undefined && { fontFamily: result.fontFamily }),
    ...(result.fontWeight !== undefined && { fontWeight: result.fontWeight }),
    ...(result.fontSize !== undefined && { fontSize: result.fontSize }),
    ...(result.lineHeight !== undefined && { lineHeight: result.lineHeight }),
    ...(result.letterSpacing !== undefined && { letterSpacing: result.letterSpacing }),
    ...(result.textTransform !== undefined && { textTransform: result.textTransform }),
  };
};
