// Split a page across the unanswered and answered partitions before querying.
export function inboxPriorityPage(pendingCount: number, page: number, size = 50) {
  const offset = (page - 1) * size;
  const pendingTake = Math.min(size, Math.max(0, pendingCount - offset));
  return { pendingSkip: offset, pendingTake, restSkip: Math.max(0, offset - pendingCount), restTake: size - pendingTake };
}
