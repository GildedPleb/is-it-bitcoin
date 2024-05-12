import * as bip39 from "bip39";

export const wordlist = bip39.wordlists.english;
/**
 * Removes punctuation from the input string and replaces it with spaces.
 * @param inputStringInner - The input string to process.
 * @returns The cleaned string with punctuation replaced by spaces.
 */
export const replacePunctuationWithSpaces = (
  inputStringInner: string,
): string => {
  const punctuations = "!\"#$%&'()*+,-§—.–/:;<=>?@[\\]^_`{|}~1234567890\n\r";
  let cleanedString = "";
  for (const char of inputStringInner) {
    cleanedString += punctuations.includes(char) ? " " : char;
  }
  return cleanedString;
};

/**
 * Finds and returns unique BIP39 words and their first occurrence index in the given string.
 * @param inputStringInner - The string to search for BIP39 words.
 * @returns An array of unique BIP39 words and their indices.
 */
export const findBIP39Words = (
  inputStringInner: string,
): Array<{ index: number; word: string }> => {
  const cleanedString = replacePunctuationWithSpaces(inputStringInner);
  const words = cleanedString.toLowerCase().split(" ").filter(Boolean);

  const seenWords = new Set<string>();
  const result: Array<{ index: number; word: string }> = [];

  for (const [index, word] of words.entries()) {
    if (wordlist.includes(word) && !seenWords.has(word)) {
      seenWords.add(word);
      result.push({ index, word });
    }
  }

  return result;
};
