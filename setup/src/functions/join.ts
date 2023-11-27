import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, Network, KioskTransaction, KIOSK_MODULE, objArg } from "@mysten/kiosk";
config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  process.env.OWNER_MNEMONIC_PHRASE as string
);
const owner_address = owner_keypair.toSuiAddress().toString();

export async function Join(ft1?: string, ft2?: string) {
  const tx = new TransactionBlock();

  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({address:owner_address});

  const targetKioskId = process.env.TARGET_KIOSK as string;
  
  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId)
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const protected_tp = process.env.PROTECTED_TP as string;

  const itemType =  `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::tokenized_asset::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>`;
  const itemXId = ft1 ?? process.env.FT1 as string;
  const itemYId = ft2 ?? process.env.FT2 as string;
  const sellerKiosk = targetKioskId;

  const [itemX, promise] = kioskTx.borrow({
    itemId: itemXId,
    itemType,
  });

  kioskTx.list({
        itemId: itemYId,
        itemType,
        price: '0',
    })

  const [itemY, transferRequest] = kioskTx.purchase({
    itemType,
		itemId: itemYId,
		price: '0',
		sellerKiosk,
  })

  const join_promise = tx.moveCall({
    target: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::unlock::asset_from_kiosk_to_join`,
    typeArguments: [
      `${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE`
    ],
    arguments: [
      itemX,
      itemY,
      tx.object(protected_tp),
      transferRequest
    ],
  });

  const burn_proof = tx.moveCall({
    target: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::tokenized_asset::join`,
    typeArguments: [
      `${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE`
    ],
    arguments: [
      itemX,
      itemY
    ],
  });

  tx.moveCall({
    target: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::unlock::prove_join`,
    typeArguments: [
      `${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE`
    ],
    arguments: [
      itemX,
      join_promise,
      burn_proof
    ],
  });

  kioskTx.return({
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
  const target_type = `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::tokenized_asset::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>`;
  let target_object_id: string;
  while (i < mutated_objects_length) {
    target_object_id = (result.effects?.mutated && result.effects?.mutated[i].reference.objectId) as string
    let target_object = await client.getObject({
      id: target_object_id,
      options: {
        showType:true
      }
    })
    let current_type = target_object.data?.type as string;
    if (current_type == target_type) {
      console.log("Remaining Asset: ", target_object_id);
      return target_object_id;
    }
    i = i + 1;
  }
}