/**
 * Automatic shift detection based on dairy operating hours.
 * MORNING: 04:00 - 12:59
 * EVENING: 13:00 - 23:59 (and late night up to 03:59)
 */
export function getAutoShift(date = new Date()) {
  const hours = date.getHours();
  // Before 1 PM (13:00) is MORNING, 1 PM onwards is EVENING
  if (hours >= 4 && hours < 13) {
    return "MORNING";
  }
  return "EVENING";
}

export function formatShiftLabel(shift) {
  return shift === "MORNING" ? "☀️ MORNING" : "🌙 EVENING";
}
