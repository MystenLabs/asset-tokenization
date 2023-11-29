import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import {
  KioskClient,
  Network,
  TransferPolicyTransaction,
  percentageToBasisPoints,
} from "@mysten/kiosk";

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

export async function CreateTransferPolicy() {
  const tx = new TransactionBlock();
  const registry = process.env.REGISTRY as string;
  const publisher = process.env.ASSET_PUBLISHER as string;

  const [policy, cap] = tx.moveCall({
    target: `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::proxy::setup_tp`,
    typeArguments: [
      `${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE`,
    ],
    arguments: [tx.object(registry), tx.object(publisher)],
  });

  tx.transferObjects([cap], address);

  tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [
      `0x0000000000000000000000000000000000000000000000000000000000000002::transfer_policy::TransferPolicy<${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE>>`,
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
  const target_type = `0x2::transfer_policy::TransferPolicy<${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE>>`;
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
