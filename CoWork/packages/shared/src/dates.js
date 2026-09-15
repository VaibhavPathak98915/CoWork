/**
 * Calendar dates in the server's LOCAL timezone, as YYYY-MM-DD.
 *
 * Not toISOString().slice(0,10): that is UTC, and for anyone east of Greenwich it
 * disagrees with the user's calendar for the first hours of every day. At 00:30
 * IST a booking made "today" would land on UTC's yesterday and never appear in
 * the dashboard's "Bookings Today".
 */
export const localDate = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const localDateDaysAgo = (days) =>
  localDate(new Date(Date.now() - days * 86400000));
