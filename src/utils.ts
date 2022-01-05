/**
 * Get a timestamp from a date or number. Uses Math.floor for numbers, and throws on NaN/InvalidDate, Infinity, or negative numbers.
 * @param dateOrNumber date or number to convert
 * @returns timestamp as string
 */
export function getSafeTimestampString(dateOrNumber: Date | number): string {
  const ts =
    dateOrNumber instanceof Date
      ? dateOrNumber.valueOf()
      : Math.floor(dateOrNumber);

  if (isNaN(ts) || ts === Infinity || ts < 0)
    throw new Error("Invalid date or Number: " + dateOrNumber);

  return ts.toString();
}
