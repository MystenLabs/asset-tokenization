import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient } from "@mysten/kiosk";
import { SUI_NETWORK, KIOSK_NETWORK, adminPhrase, registry, publisher, assetTokenizationPackageId, tokenizedAssetType, assetOTW } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const kioskClient = new KioskClient({
  client,
  network: KIOSK_NETWORK,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);
const address = owner_keypair.toSuiAddress().toString();

export async function CreateTransferPolicy() {
  const tx = new TransactionBlock();

  const [policy, cap] = tx.moveCall({
    target: `${assetTokenizationPackageId}::proxy::setup_tp`,
    typeArguments: [assetOTW],
    arguments: [tx.object(registry), tx.object(publisher)],
  });

  tx.transferObjects([cap], address);

  tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [
      `0x2::transfer_policy::TransferPolicy<${tokenizedAssetType}>`,
    ],
    arguments: [policy],
  });

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
  const target_type = `0x2::transfer_policy::TransferPolicy<${tokenizedAssetType}>`;
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
      console.log("Transfer Policy ID", target_object_id);
      return target_object_id;
    }
    i = i + 1;
  }
}
