import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient } from "@mysten/kiosk";
import { SUI_NETWORK, KIOSK_NETWORK, adminPhrase, buyerPhrase } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const kioskClient = new KioskClient({
  client,
  network: KIOSK_NETWORK,
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