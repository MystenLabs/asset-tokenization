import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, KioskTransaction } from "@mysten/kiosk";
import { SUI_NETWORK, KIOSK_NETWORK, adminPhrase, targetKioskId, tokenizedAssetID, tokenizedAssetType, assetTokenizationPackageId, assetOTW } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const kioskClient = new KioskClient({
  client,
  network: KIOSK_NETWORK,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);

const address = owner_keypair.getPublicKey().toSuiAddress();

export async function Split(tokenized_asset?: string) {
  const tx = new TransactionBlock();

  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const itemId = tokenized_asset ?? tokenizedAssetID;
  const itemType = tokenizedAssetType;
  const [item, promise] = kioskTx.borrow({
    itemId,
    itemType,
  });

  const value = 1;
  const new_tokenized_asset = tx.moveCall({
    target: `${assetTokenizationPackageId}::tokenized_asset::split`,
    typeArguments: [assetOTW],
    arguments: [item, tx.pure(value)],
  });

  kioskTx.place({
    itemType: tokenizedAssetType,
    item: new_tokenized_asset,
  });

  kioskTx
    .return({
      itemType,
      item,
      promise,
    })
    .finalize();

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    options: {
      showEffects: true,
    },
  });

  console.log("Status", result.effects?.status);
  console.log("Result", result);

  const created_objects_length = result.effects?.created?.length as number;
  let i = 0;
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
    if (current_type == tokenizedAssetType) {
      console.log("Created Asset: ", target_object_id);
      return target_object_id;
    }
    i = i + 1;
  }
}
