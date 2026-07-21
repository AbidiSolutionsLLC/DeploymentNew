export const dispatchReadOnlyModal = () => {
  window.dispatchEvent(new CustomEvent('showReadOnlyModal'));
};
