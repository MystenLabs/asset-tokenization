import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, Network, KioskTransaction } from "@mysten/kiosk";

config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  process.env.OWNER_MNEMONIC_PHRASE as string
);

const address = owner_keypair.toSuiAddress().toString();
const tokenized_asset = process.env.TOKENIZED_ASSET as string;

export async function PlaceItemInKiosk(minted_asset?: string) {
  const tx = new TransactionBlock();
  const item = minted_asset ?? tokenized_asset;

  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

  const targetKioskId = process.env.TARGET_KIOSK as string;

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId)
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const policyId = process.env.TRANSFER_POLICY as string;

  kioskTx.place({
    itemType: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::tokenized_asset::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>`,
    item
  });

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

  const created_objects_length = result.effects?.created?.length as number;
  let i = 0;
  const target_type = `0x2::dynamic_field::Field<0x2::dynamic_object_field::Wrapper<0x2::kiosk::Item>, 0x2::object::ID>`
  let target_object_id: string;
  while (i < created_objects_length) {
    target_object_id = (result.effects?.created && result.effects?.created[i].reference.objectId) as string
    let target_object = await client.getObject({
      id: target_object_id,
      options: {
        showType:true
      }
    })
    let current_type = target_object.data?.type as string;
    if (current_type == target_type) {
      console.log("Dynamic Object Field: ", target_object_id);
      return target_object_id;
    }
    i = i + 1;
  }
}