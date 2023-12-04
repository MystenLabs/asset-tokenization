import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, KioskTransaction } from "@mysten/kiosk";
import { SUI_NETWORK, KIOSK_NETWORK, adminPhrase, targetKioskId, protectedTP, assetTokenizationPackageId, tokenizedAssetType, assetOTW, FT1, FT2 } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const kioskClient = new KioskClient({
  client,
  network: KIOSK_NETWORK,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);
const owner_address = owner_keypair.toSuiAddress().toString();

export async function Join(ft1?: string, ft2?: string) {
  const tx = new TransactionBlock();

  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
    address: owner_address,
  });

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const itemType = tokenizedAssetType;
  const itemXId = ft1 ?? FT1;
  const itemYId = ft2 ?? FT2;
  const sellerKiosk = targetKioskId;

  const [itemX, promise] = kioskTx.borrow({
    itemId: itemXId,
    itemType,
  });

  kioskTx.list({
    itemId: itemYId,
    itemType,
    price: "0",
  });

  const [itemY, transferRequest] = kioskTx.purchase({
    itemType,
    itemId: itemYId,
    price: "0",
    sellerKiosk,
  });

  const join_promise = tx.moveCall({
    target: `${assetTokenizationPackageId}::unlock::asset_from_kiosk_to_join`,
    typeArguments: [assetOTW],
    arguments: [itemX, itemY, tx.object(protectedTP), transferRequest],
  });

  const burn_proof = tx.moveCall({
    target: `${assetTokenizationPackageId}::tokenized_asset::join`,
    typeArguments: [assetOTW],
    arguments: [itemX, itemY],
  });

  tx.moveCall({
    target: `${assetTokenizationPackageId}::unlock::prove_join`,
    typeArguments: [assetOTW],
    arguments: [itemX, join_promise, burn_proof],
  });

  kioskTx
    .return({
      itemType,
      item: itemX,
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

  const mutated_objects_length = result.effects?.mutated?.length as number;
  let i = 0;
  let target_object_id: string;
  while (i < mutated_objects_length) {
    target_object_id = (result.effects?.mutated &&
      result.effects?.mutated[i].reference.objectId) as string;
    let target_object = await client.getObject({
      id: target_object_id,
      options: {
        showType: true,
      },
    });
    let current_type = target_object.data?.type as string;
    if (current_type == tokenizedAssetType) {
      console.log("Remaining Asset: ", target_object_id);
      return target_object_id;
    }
    i = i + 1;
  }
}
