import { config } from "dotenv";

config({});
export const SUI_NETWORK = process.env.SUI_NETWORK!;
export const packageId = process.env.ASSET_TOKENIZATION_PACKAGE_ID!;
export const publisher = process.env.ASSET_TOKENIZATION_PUBLISHER!;
export const adminPhrase = process.env.OWNER_MNEMONIC_PHRASE!;

const keys = Object.keys(process.env);
console.log(
  "env contains OWNER_MNEMONIC_PHRASE:",
  keys.includes("OWNER_MNEMONIC_PHRASE")
);
