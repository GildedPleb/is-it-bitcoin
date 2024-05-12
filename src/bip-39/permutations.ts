// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable security/detect-object-injection */
import * as bip39 from "bip39";

import { VALID_LENGTHS } from "../constants";

// /**
//  * Calculate the factorial of a number.
//  * @param numb - A non-negative integer.
//  * @returns The factorial of n.
//  */
// const factorial = (numb: bigint): bigint => {
//   let result = BigInt(1);
//   for (let index = 2; index <= numb; index += 1) {
//     result *= BigInt(index);
//   }
//   return result;
// };

// /**
//  * Calculate the number of permutations of n items taken k at a time.
//  * @param numb - Total items.
//  * @param choose - Items to choose.
//  * @returns The number of permutations.
//  */
// const permutations = (numb: bigint, choose: bigint): bigint => {
//   if (choose > numb) return 0n;
//   return factorial(numb) / factorial(numb - choose);
// };

// /**
//  * Calculates the total number of possible permutations for given lengths.
//  * @param words - The list of words extracted from the input.
//  * @returns The total number of permutations.
//  */
// export const calculateTotalPermutations = (words: string[]): bigint => {
//   let totalPermutations = BigInt(0);
//   for (const length of VALID_LENGTHS) {
//     if (words.length >= length) {
//       totalPermutations += permutations(BigInt(words.length), BigInt(length));
//     }
//   }
//   return totalPermutations;
// };

/**
 * Calculate the number of permutations of n items taken k at a time with repetition.
 * @param numb - Total items.
 * @param choose - Items to choose.
 * @returns The number of permutations with repetition.
 */
const permutationsWithRepetition = (numb: bigint, choose: bigint): bigint => {
  return numb ** choose;
};

/**
 * Calculates the total number of possible permutations with repetition for given lengths.
 * @param words - The list of words extracted from the input.
 * @returns The total number of permutations with repetition.
 */
export const calculateTotalPermutations = (words: string[]): bigint => {
  let totalPermutations = BigInt(0);
  for (const length of VALID_LENGTHS) {
    totalPermutations += permutationsWithRepetition(
      BigInt(words.length),
      BigInt(length),
    );
  }
  return totalPermutations;
};
// /**
//  *
//  * @param array_ - an array of words
//  * @param size - the size
//  * @param memo - memo list of words
//  */
// function* permute(
//   array_: string[],
//   size: number,
//   memo: string[] = [],
// ): Generator<string[]> {
//   if (memo.length === size) {
//     yield memo;
//   } else {
//     for (let index = 0; index < array_.length; index += 1) {
//       const current = [...array_];
//       const next = current.splice(index, 1);
//       yield* permute(current, size, [...memo, ...next]);
//     }
//   }
// }

// /**
//  * Generates all permutations of a given array of words.
//  * @param array - Array of words.
//  * @param size - Size of each permutation.
//  */
// export function* generatePermutations(
//   array: string[],
//   size: number,
// ): Generator<string[]> {
//   yield* permute(array, size);
// }

/**
 * Generates all permutations of a given array of words allowing repetitions.
 * @param array - Array of words.
 * @param size - Size of each permutation.
 */
export function* generatePermutations(
  array: string[],
  size: number,
): Generator<string[]> {
  const length = array.length;
  const indices = new Uint32Array(size);
  crypto.getRandomValues(indices);

  // Normalize indices to be within the range of the array length
  for (let index = 0; index < size; index++) {
    indices[index] %= length;
  }
  const result = Array.from<string>({ length: size });

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    // Build the current permutation
    for (let index = 0; index < size; index++) {
      result[index] = array[indices[index]];
    }
    yield [...result];

    // Increment the indices array
    let current = size - 1;
    while (current >= 0 && indices[current] === length - 1) {
      indices[current] = 0;
      current -= 1;
    }

    if (current < 0) break;
    indices[current] += 1;
  }
}
/**
 * Finds all valid BIP39 seed phrases from a list of words.
 * @param foundBip39Words - List of words to test for valid mnemonics.
 */
export async function findValidSeeds(foundBip39Words: string[]): Promise<void> {
  // Attempt to generate valid mnemonics for each valid length
  let count = 0;
  for (const length of VALID_LENGTHS) {
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
