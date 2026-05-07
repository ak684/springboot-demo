export const lineClamp = (lines) => ({
  WebkitLineClamp: lines,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
})
