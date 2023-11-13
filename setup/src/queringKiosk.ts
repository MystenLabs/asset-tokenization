import { config } from "dotenv";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, Network } from "@mysten/kiosk";
config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  process.env.OWNER_MNEMONIC_PHRASE as string
);
const address = owner_keypair.toSuiAddress().toString();

export async function QueringKiosks() {
  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
    address,
  });
  
  const nonPersonalKiosks = kioskOwnerCaps.filter(
    (cap) => cap.isPersonal == false
  );
  const personalKiosks = kioskOwnerCaps.filter(
    (cap) => cap.isPersonal == true
  );
  // console.log([personalKiosks, nonPersonalKiosks])
  return [personalKiosks, nonPersonalKiosks];
}

QueringKiosks();