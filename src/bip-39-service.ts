// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable security/detect-object-injection */
import * as bip39 from "bip39";

export const validLengths = [12, 15, 18, 21, 24];
const wordlist = bip39.wordlists.english;

/**
 *
 * @param variable - variable to check if it can be converted
 * @returns true or false
 */
export function canBeBigInt(variable: unknown): boolean {
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
 * Calculate the factorial of a number.
 * @param numb - A non-negative integer.
 * @returns The factorial of n.
 */
const factorial = (numb: bigint): bigint => {
  let result = BigInt(1);
  for (let index = 2; index <= numb; index += 1) {
    result *= BigInt(index);
  }
  return result;
};

/**
 * Calculate the number of permutations of n items taken k at a time.
 * @param numb - Total items.
 * @param choose - Items to choose.
 * @returns The number of permutations.
 */
const permutations = (numb: bigint, choose: bigint): bigint => {
  if (choose > numb) return 0n;
  return factorial(numb) / factorial(numb - choose);
};

/**
 * Removes punctuation from the input string and replaces it with spaces.
 * @param inputStringInner - The input string to process.
 * @returns The cleaned string with punctuation replaced by spaces.
 */
const replacePunctuationWithSpaces = (inputStringInner: string): string => {
  const punctuations = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~\n\r";
  let cleanedString = "";
  for (const char of inputStringInner) {
    cleanedString += punctuations.includes(char) ? " " : char;
  }
  return cleanedString;
};

/**
 * Finds and returns all BIP39 words in the given string.
 * @param inputStringInner - The string to search for BIP39 words.
 * @returns An array of found BIP39 words.
 */
export const findBIP39Words = (
  inputStringInner: string,
): Array<{ index: number; word: string }> => {
  const cleanedString = replacePunctuationWithSpaces(inputStringInner);
  const words = cleanedString.toLowerCase().split(" ").filter(Boolean);
  return words
    .filter((word) => wordlist.includes(word))
    .map((word, index) => ({ index, word }));
};

/**
 * Calculates the total number of possible permutations for given lengths.
 * @param words - The list of words extracted from the input.
 * @returns The total number of permutations.
 */
export const calculateTotalPermutations = (words: string[]): bigint => {
  let totalPermutations = BigInt(0);
  for (const length of validLengths) {
    if (words.length >= length) {
      totalPermutations += permutations(BigInt(words.length), BigInt(length));
    }
  }
  return totalPermutations;
};
/**
 * Formats large numbers into a more human-readable string using scaling words.
 * @param number - the number to format
 * @returns A formatted string
 */
function formatLargeNumber(number: bigint): string {
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
/**
 *
 * @param array_ - an array of words
 * @param size - the size
 * @param memo - memo list of words
 */
function* permute(
  array_: string[],
  size: number,
  memo: string[] = [],
): Generator<string[]> {
  if (memo.length === size) {
    yield memo;
  } else {
    for (let index = 0; index < array_.length; index += 1) {
      const current = [...array_];
      const next = current.splice(index, 1);
      yield* permute(current, size, [...memo, ...next]);
    }
  }
}

/**
 * Generates all permutations of a given array of words.
 * @param array - Array of words.
 * @param size - Size of each permutation.
 */
export function* generatePermutations(
  array: string[],
  size: number,
): Generator<string[]> {
  yield* permute(array, size);
}

/**
 * Finds all valid BIP39 seed phrases from a list of words.
 * @param foundBip39Words - List of words to test for valid mnemonics.
 */
export async function findValidSeeds(foundBip39Words: string[]): Promise<void> {
  // Attempt to generate valid mnemonics for each valid length
  let count = 0;
  for (const length of validLengths) {
    if (foundBip39Words.length >= length) {
      for (const permutation of generatePermutations(foundBip39Words, length)) {
        const possibleMnemonic = permutation.join(" ");
        if (bip39.validateMnemonic(possibleMnemonic)) {
          process.stdout.write(
            `\rvalid, ${count}: ${possibleMnemonic}`.padEnd(100, " "),
          );
        } else {
          // console.log(`\nValid: ${possibleMnemonic}`.padEnd(100, " "));
          // invalid
        }
        count += 1;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
