type Candidate = { id: string; title: string; type: string; status: string; customerId: string | null; orderId: string | null; createdAt: Date };

export function duplicateWindowHours(value?: string) {
  const hours = Number(value);
  return Number.isInteger(hours) && hours >= 1 && hours <= 720 ? hours : 24;
}

/** Suggestions only: unknown conversation/origin means equivalence is unproven. */
export function possibleTaskDuplicates(tasks: Candidate[], hours: number) {
  const buckets = new Map<string, Candidate[]>();
  const matches = new Map<string, string[]>();
  for (const task of tasks) {
    if (!["OPEN", "IN_PROGRESS"].includes(task.status) || (!task.customerId && !task.orderId)) continue;
    const title = task.title.normalize("NFKC").trim().toLocaleLowerCase("es-AR").replace(/\s+/g, " ");
    if (!title) continue;
    const key = JSON.stringify([task.customerId, task.orderId, task.type, title]);
    const bucket = buckets.get(key) || [];
    for (const previous of bucket) {
      if (Math.abs(task.createdAt.getTime() - previous.createdAt.getTime()) > hours * 3600000) continue;
      matches.set(task.id, [...(matches.get(task.id) || []), previous.id]);
      matches.set(previous.id, [...(matches.get(previous.id) || []), task.id]);
    }
    bucket.push(task); buckets.set(key, bucket);
  }
  return matches;
}
