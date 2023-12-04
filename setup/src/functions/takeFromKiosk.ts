import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, KioskTransaction } from "@mysten/kiosk";
import { SUI_NETWORK, KIOSK_NETWORK, adminPhrase, tokenizedAssetID, tokenizedAssetType, targetKioskId } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const kioskClient = new KioskClient({
  client,
  network: KIOSK_NETWORK,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);
const address = owner_keypair.toSuiAddress().toString();

export async function TakeFromKiosk(tokenized_asset?: string) {
  const itemId = tokenized_asset ?? tokenizedAssetID;

  const tx = new TransactionBlock();
  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const item = kioskTx.take({
    itemId,
    itemType: tokenizedAssetType,
  });

  tx.transferObjects([item], address);

  kioskTx.finalize();

  // Sign and execute transaction block.
  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    options: {
      showEffects: true,
    },
  });

  console.log("Execution status", result.effects?.status);
  console.log("Result", result.effects);
}
