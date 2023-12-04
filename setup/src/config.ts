import { config } from "dotenv";
import { Network } from "@mysten/kiosk";

config({});
export const SUI_NETWORK = process.env.SUI_NETWORK as string;
export const KIOSK_NETWORK = Network.MAINNET;
export const assetTokenizationPackageId = process.env.ASSET_TOKENIZATION_PACKAGE_ID as string;
export const publisher = process.env.ASSET_PUBLISHER as string;
export const registry = process.env.REGISTRY as string;
export const adminPhrase = process.env.OWNER_MNEMONIC_PHRASE as string;
export const buyerPhrase = process.env.BUYER_MNEMONIC_PHRASE as string;
export const assetCap = process.env.ASSET_CAP_ID as string;
export const protectedTP = process.env.PROTECTED_TP as string;
export const transferPolicy = process.env.TRANSFER_POLICY as string;
export const targetKioskId = process.env.TARGET_KIOSK as string;
export const buyerKioskId = process.env.BUYER_KIOSK as string;
export const assetOTW = `${process.env.TEMPLATE_PACKAGE_ID}::template::TEMPLATE`;
export const tokenizedAssetID = process.env.TOKENIZED_ASSET as string;
export const tokenizedAssetType = `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${assetOTW}>`;
export const FT1 = process.env.FT1 as string;
export const FT2 = process.env.FT2 as string;

const keys = Object.keys(process.env);
console.log(
  "env contains OWNER_MNEMONIC_PHRASE:",
  keys.includes("OWNER_MNEMONIC_PHRASE")
);
