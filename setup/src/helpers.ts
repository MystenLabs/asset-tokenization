import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { adminPhrase, SUI_NETWORK } from "./config";

console.log("Connecting to", SUI_NETWORK);

export function getSigner() {
  const keypair = Ed25519Keypair.deriveKeypair(adminPhrase);

  const admin = keypair.getPublicKey().toSuiAddress();
  console.log("Admin Address = " + admin);

  return keypair;
}

getSigner();
