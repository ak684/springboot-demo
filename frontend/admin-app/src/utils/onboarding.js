export const getElementPosition = (elementRef) => {
  if (elementRef.current) {
    const rect = elementRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
    };
  }
};
