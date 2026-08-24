export const continueStoryPhases = Object.freeze({
  resultStart: 0.44,
  undoStart: 0.78,
  undoTapCenters: Object.freeze([0.7, 0.77])
});

export function showsContinueInsertion(progress) {
  return progress >= continueStoryPhases.resultStart
    && progress < continueStoryPhases.undoStart;
}
