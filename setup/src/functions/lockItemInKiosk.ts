import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, Network, KioskTransaction } from "@mysten/kiosk";
import { tokenizedAssetType, adminPhrase, tokenizedAssetID, targetKioskId, transferPolicy } from "../config";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);

const address = owner_keypair.toSuiAddress().toString();

export async function LockItemInKiosk(minted_asset?: string) {
  const tx = new TransactionBlock();
  const item = minted_asset ?? tokenizedAssetID;

  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  kioskTx.lock({
    itemType: tokenizedAssetType,
    itemId: item,
    policy: tx.object(transferPolicy),
  });

  kioskTx.finalize();

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    options: {
      showEffects: true,
    },
  });

  console.log("Execution status", result.effects?.status);
  console.log("Result", result.effects);

  const created_objects_length = result.effects?.created?.length as number;
  let i = 0;
  const target_type = `0x2::dynamic_field::Field<0x2::kiosk::Lock, bool>`;
  let target_object_id: string;
  while (i < created_objects_length) {
    target_object_id = (result.effects?.created &&
      result.effects?.created[i].reference.objectId) as string;
    let target_object = await client.getObject({
      id: target_object_id,
      options: {
        showType: true,
      },
    });
    let current_type = target_object.data?.type as string;
    if (current_type == target_type) {
      console.log("Lock Dynamic Field: ", target_object_id);
      return target_object_id;
    }
    i = i + 1;
  }
}
