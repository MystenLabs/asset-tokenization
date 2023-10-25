import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner
} from "@mysten/sui.js";
import { SUI_NETWORK } from "./config";

console.log("Connecting to ", SUI_NETWORK);

export function getSigner() {
  const connOptions = new Connection({
    fullnode: SUI_NETWORK,
  });
  let provider = new JsonRpcProvider(connOptions);
  
  const phrase = process.env.ADMIN_PHRASE;
  const keypair = Ed25519Keypair.deriveKeypair(phrase!);
  const signer = new RawSigner(keypair, provider);

  const admin = keypair.getPublicKey().toSuiAddress();
  console.log("Admin Address = " + admin);

  return signer;
}

getSigner();
