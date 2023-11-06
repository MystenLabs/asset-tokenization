import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519"
import { ADMIN_SECRET_KEY, SUI_NETWORK } from "./config"
import { fromB64 } from "@mysten/sui.js/utils"

console.log("Connecting to", SUI_NETWORK);

export function getSigner() {
  const phrase = process.env.ADMIN_PHRASE;
  const keypair = Ed25519Keypair.fromSecretKey(fromB64(ADMIN_SECRET_KEY!).slice(1));

  const admin = keypair.getPublicKey().toSuiAddress();
  console.log("Admin Address = " + admin);

  return keypair;
}

getSigner();
