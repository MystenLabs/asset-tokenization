import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, Network } from "@mysten/kiosk";
import { adminPhrase, buyerPhrase } from "../config";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);
const owner_address = owner_keypair.toSuiAddress().toString();

const buyer_keypair = Ed25519Keypair.deriveKeypair(
  buyerPhrase
);

const buyer_address = buyer_keypair.toSuiAddress().toString();

export async function QueringKiosks() {
  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
    address: owner_address,
    // address: buyer_address,
  });
  
  const nonPersonalKiosks = kioskOwnerCaps.filter(
    (cap) => cap.isPersonal == false
  );
  const personalKiosks = kioskOwnerCaps.filter(
    (cap) => cap.isPersonal == true
  );
  
  console.log(kioskOwnerCaps);
  return [personalKiosks, nonPersonalKiosks];
}