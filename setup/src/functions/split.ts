import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Network, KioskClient, KioskTransaction } from "@mysten/kiosk";
config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  process.env.OWNER_MNEMONIC_PHRASE as string
);

const address = owner_keypair.getPublicKey().toSuiAddress();

export async function Split(tokenized_asset?: string) {
  const tx = new TransactionBlock();

  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

  const targetKioskId = process.env.TARGET_KIOSK as string;

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const itemId = tokenized_asset ?? (process.env.TOKENIZED_ASSET as string);
  const itemType = `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE>`;
  const [item, promise] = kioskTx.borrow({
    itemId,
    itemType,
  });

  const value = 1;
  const new_tokenized_asset = tx.moveCall({
    target: `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::split`,
    typeArguments: [
      `${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE`,
    ],
    arguments: [item, tx.pure(value)],
  });

  kioskTx.place({
    itemType: `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE>`,
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
  const target_type = `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE>`;
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
      console.log("Created Asset: ", target_object_id);
      return target_object_id;
    }
    i = i + 1;
  }
}
