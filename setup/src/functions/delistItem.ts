import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, Network, KioskTransaction } from "@mysten/kiosk";
import { adminPhrase, tokenizedAssetID, tokenizedAssetType, targetKioskId } from "../config";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);
const address = owner_keypair.toSuiAddress().toString();

export async function DelistItem(tokenized_asset?: string) {
  const itemId = tokenized_asset ?? tokenizedAssetID;
  const itemType = tokenizedAssetType;

  const tx = new TransactionBlock();
  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  kioskTx
    .delist({
      itemId,
      itemType,
    })
    .finalize();

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    options: {
      showEffects: true,
    },
  });

  console.log("Execution status", result.effects?.status);
  console.log("Result", result.effects);
  console.log("Delisted Item: ", itemId);
  return itemId;
}
