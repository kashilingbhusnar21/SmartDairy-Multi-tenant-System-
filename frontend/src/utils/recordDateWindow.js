function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getOperationalRecordDateWindow() {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() - 2);

  return {
    min: toISODate(minDate),
    max: toISODate(today),
  };
}
