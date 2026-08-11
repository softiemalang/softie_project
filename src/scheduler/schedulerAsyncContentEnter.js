export function createSchedulerAsyncContentEnterState() {
  return {
    hasSuccessfullySettled: false,
    shouldAnimateInitialContent: false,
  }
}

export function settleSchedulerAsyncContentEnter(state, result) {
  if (state.hasSuccessfullySettled || result.status !== 'success') return state

  return {
    hasSuccessfullySettled: true,
    shouldAnimateInitialContent: Boolean(result.hasContent),
  }
}
