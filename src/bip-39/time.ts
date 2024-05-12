// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable security/detect-object-injection */

/**
 *
 * @param variable - variable to check if it can be converted
 * @returns true or false
 */
function canBeBigInt(variable: unknown): boolean {
  // Check if it's already a bigint
  if (typeof variable === "bigint") {
    return true;
  }

  // Check if it's a number that is an integer and safe to convert
  if (
    typeof variable === "number" &&
    Number.isInteger(variable) &&
    Number.isSafeInteger(variable)
  ) {
    return true;
  }

  // Check if it's a string that can be converted to a valid bigint
  if (typeof variable === "string" && variable.trim() !== "") {
    try {
      BigInt(variable.trim());
      return true;
    } catch {
      return false;
    }
  }

  // If none of the above, return false
  return false;
}

/**
 * Formats large numbers into a more human-readable string using scaling words.
 * @param number - the number to format
 * @returns A formatted string
 */
export function formatLargeNumber(number: bigint): string {
  const names = ["", "thousand", "million", "billion", "trillion"];
  let divisor = 1n;
  let nameIndex = 0;
  let scaled = number;
  const parts = [];

  // Divide the number to reduce its size and keep track of each division level
  while (scaled >= 1000n) {
    scaled /= 1000n;
    divisor *= 1000n;
    nameIndex++;
  }

  // Start with the most significant scaled number

  // Build the scale name from the largest to smallest
  while (divisor > 1n && nameIndex >= names.length) {
    divisor /= 1000n;
    parts.push(names.at(-1));
    nameIndex -= names.length - 1;
  }

  if (nameIndex < names.length && nameIndex > 0) {
    parts.push(names[nameIndex]);
  }
  parts.push(scaled.toString());
  // Join all parts with space and ensure no trailing spaces
  return parts.reverse().join(" ").trim();
}

export const timeToCrack = (
  totalKeysInner: bigint,
  rate: bigint | boolean | number | string,
): { secure: boolean; timeString: string } => {
  if (!canBeBigInt(rate) || rate === 0n)
    return { secure: false, timeString: "Does not compute" };

  const bigIntRate = BigInt(rate);
  if (bigIntRate === 0n)
    return { secure: false, timeString: "Can not divide by 0" };

  const seconds = totalKeysInner / BigInt(rate);
  let time = seconds;
  const units = [
    "second",
    "minute",
    "hour",
    "day",
    "year",
    "decade",
    "century",
    "millennium",
  ];
  const limits = [60n, 60n, 24n, 365n, 10n, 10n, 10n];
  let unitIndex = 0;
  while (unitIndex < limits.length && time >= limits[unitIndex]) {
    time /= limits[unitIndex];
    unitIndex++;
  }

  // Determine if the time exceeds 100 years
  let secure = false;
  if (unitIndex > 4 || (unitIndex === 4 && time >= 10n)) {
    secure = true;
  }

  // Formatting time to be more human-readable
  const humanReadableTime = formatLargeNumber(time);

  // Apply pluralization
  const unit = units[unitIndex] + (time === 1n ? "" : "s");
  const timeString = `${humanReadableTime} ${unit}`;

  return { secure, timeString };
};
