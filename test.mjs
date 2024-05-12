import { BIP32Factory } from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

// Create BIP32 instance
const bip32 = BIP32Factory(ecc);

// The provided seed phrase
const seedPhrase =
  "digital around asset this used used world world possible this asset digital";

// Generate seed from the mnemonic
const seed = bip39.mnemonicToSeedSync(seedPhrase);

// Create a BIP32 root key
const root = bip32.fromSeed(seed);

// Function to generate multiple addresses
const generateAddresses = (root, count) => {
  const addresses = [];
  for (let index = 0; index < count; index++) {
    const path = `m/44'/0'/0'/0/${index}`; // BIP44 path for Bitcoin
    const keyPair = root.derivePath(path);
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    addresses.push(address);
  }
  return addresses;
};

// Generate 10 addresses
const addressCount = 1000;
const addresses = generateAddresses(root, addressCount);

// Output the addresses
for (const [index, address] of addresses.entries()) {
  console.log(`Address ${index + 1}: ${address}`);
}
