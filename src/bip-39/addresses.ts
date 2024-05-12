// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { BIP32Factory, type BIP32Interface } from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import { LRUCache } from "lru-cache";
import * as ecc from "tiny-secp256k1";

const bip32 = BIP32Factory(ecc);

interface AddressStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

interface AddressData {
  chain_stats: AddressStats;
  mempool_stats: AddressStats;
}

// Helper function to convert mnemonic to seed and root
const getRootFromSeedPhrase = (seedPhrase: string): BIP32Interface => {
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  return bip32.fromSeed(seed);
};

// Generator function for Legacy (P2PKH) addresses
/**
 *
 * @param seedPhrase - valid seed phrase
 */
export function* generateP2PKHAddresses(
  seedPhrase: string,
): Generator<string, void, undefined> {
  const root = getRootFromSeedPhrase(seedPhrase);
  let index = 0;
  while (true) {
    const path = `m/44'/0'/0'/0/${index}`;
    const child = root.derivePath(path);
    const address = bitcoin.payments.p2pkh({ pubkey: child.publicKey }).address;
    if (address !== undefined && address !== "") yield address;
    index++;
  }
}

// Generator function for Nested SegWit (P2SH-P2WPKH) addresses
/**
 *
 * @param seedPhrase - valid seed phrase
 */
export function* generateP2SHP2WPKHAddresses(
  seedPhrase: string,
): Generator<string, void, undefined> {
  const root = getRootFromSeedPhrase(seedPhrase);
  let index = 0;
  while (true) {
    const path = `m/49'/0'/0'/0/${index}`;
    const child = root.derivePath(path);
    const address = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey: child.publicKey }),
    }).address;
    if (address !== undefined && address !== "") yield address;
    index++;
  }
}

// Generator function for Native SegWit (P2WPKH) addresses
/**
 *
 * @param seedPhrase - valid seed phrase
 */
export function* generateP2WPKHAddresses(
  seedPhrase: string,
): Generator<string, void, undefined> {
  const root = getRootFromSeedPhrase(seedPhrase);
  let index = 0;
  while (true) {
    const path = `m/84'/0'/0'/0/${index}`;
    const child = root.derivePath(path);
    const address = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
    }).address;
    if (address !== undefined && address !== "") yield address;
    index++;
  }
}

// Main function to derive addresses using generators
const deriveAddresses = (seedPhrase: string, count: number): string[] => {
  const addresses: string[] = [];

  // List of generator functions
  const generators = [
    generateP2PKHAddresses,
    generateP2SHP2WPKHAddresses,
    generateP2WPKHAddresses,
  ];

  // Use each generator to get 'count' addresses
  for (const generate of generators) {
    const generator = generate(seedPhrase);
    for (let index = 0; index < count; index++) {
      const { done, value } = generator.next();
      if (done !== undefined && done) break;
      if (value === undefined || value === "") break;
      addresses.push(value);
    }
  }

  return addresses;
};
// Function to check transaction history and balance for a single address

// Define the LRU cache
const cache = new LRUCache<string, [boolean, number]>({
  allowStale: false,
  max: 50_000,
  ttl: 1000 * 60 * 60 * 24,
  updateAgeOnGet: true,
});

// Function to check transaction history and balance for a single address
export const checkAddressHistory = async (
  address: string,
): Promise<[boolean, number]> => {
  // Check if the address data is in the cache
  const cachedData = cache.get(address);
  if (cachedData !== undefined) {
    console.log(`Cache hit for address: ${address}`);
    return cachedData;
  }

  const call = `https://blockstream.info/api/address/${address}`;
  console.log("calling:", call);
  try {
    // Call the API
    const response = await fetch(call);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data for address ${address}: ${response.statusText}`,
      );
    }
    const data = (await response.json()) as AddressData;

    const hasHistory =
      data.chain_stats.tx_count > 0 || data.mempool_stats.tx_count > 0;
    const currentBalance =
      data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;

    const result: [boolean, number] = [hasHistory, currentBalance];

    // Store the result in the cache
    cache.set(address, result);

    return result;
  } catch (error) {
    console.error(`Error checking address history for ${address}:`, error);
    return [false, 0];
  }
};

// Function to batch check addresses
const batchCheckAddresses = async (
  addresses: string[],
): Promise<Array<[string, boolean, number]>> => {
  const results: Array<[string, boolean, number]> = [];

  for await (const address of addresses) {
    const [hasHistory, balance] = await checkAddressHistory(address);
    results.push([address, hasHistory, balance]);
  }

  return results;
};

// Main function to process multiple seed phrases
export const checkSeedPhraseAddresses = async (
  seedPhrase: string,
  addressCount: number,
): Promise<Array<[string, boolean, number]>> => {
  const addresses = deriveAddresses(seedPhrase, addressCount);
  return batchCheckAddresses(addresses);
};

// // Example usage
// const seedPhrases = [
//   "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
//   // Add more seed phrases as needed
// ];

// await processSeedPhrases(seedPhrases, 5).catch((error) => {
//   console.error(error);
// });
