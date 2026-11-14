function formatEventDate(value) {
  const d = new Date(value);
  if (isNaN(d)) return String(value); // fall back to the raw value if it can't be parsed

  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // your dates are stored at midnight UTC, so this keeps the day from shifting
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("weekday")}, ${get("day")} ${get("month")} ${get("year")}`;
}

module.exports = formatEventDate