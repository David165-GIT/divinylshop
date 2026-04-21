/**
 * Formats an event date range for display.
 * - No start date → null (caller should hide the date row).
 * - Start + end on different days → "du 26 au 28 avril 2026"
 *   (months/years are deduplicated when identical).
 * - Single day with time at 00:00 → "26 avril 2026"
 * - Single day with explicit time → "26 avril 2026 à 19:00"
 */
export const formatEventDate = (startIso: string | null, endIso: string | null): string | null => {
  if (!startIso) return null;
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;

  const sameDay =
    end &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (end && !sameDay) {
    const sameMonth =
      start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    const startFmt = sameMonth
      ? new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(start)
      : sameYear
        ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(start)
        : new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(start);

    const endFmt = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(end);

    return `du ${startFmt} au ${endFmt}`;
  }

  // Single day (no end date or same-day end)
  const dateFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(start);

  const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0;
  if (!hasTime) return dateFmt;

  const timeFmt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);

  return `${dateFmt} à ${timeFmt}`;
};
