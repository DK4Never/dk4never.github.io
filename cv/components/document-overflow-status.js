export const setOverflowStatus = (state) => {
    const element = document.querySelector('#overflow-status');
    if (!element)
        return;
    element.textContent = state.message;
    element.dataset.state = state.overflowing ? 'warning' : 'ready';
    element.title = state.title;
};
