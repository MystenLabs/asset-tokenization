import { config } from "dotenv";
import {
  TransactionBlock,
  TransactionObjectArgument,
} from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, KioskTransaction, Network } from "@mysten/kiosk";
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

export async function Burn(tokenized_asset?: string) {
  const tx = new TransactionBlock();

  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
    address: owner_address,
  });

  const targetKioskId = process.env.TARGET_KIOSK as string;

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const asset_cap = process.env.ASSET_CAP_ID as string;
  const protected_tp = process.env.PROTECTED_TP as string;

  const itemType = `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE>`;
  const itemId = tokenized_asset ?? (process.env.TOKENIZED_ASSET as string);

  kioskTx.list({
    itemId,
    itemType,
    price: "0",
  });

  const [item, transferRequest] = kioskTx.purchase({
    itemType,
    itemId,
    price: "0",
    sellerKiosk: targetKioskId,
  });

  const burn_promise = tx.moveCall({
    target: `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::unlock::asset_from_kiosk_to_burn`,
    typeArguments: [
      `${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE`,
    ],
    arguments: [
      item,
      tx.object(asset_cap),
      tx.object(protected_tp),
      transferRequest,
    ],
  });

  tx.moveCall({
    target: `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::burn`,
    typeArguments: [
      `${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE`,
    ],
    arguments: [tx.object(asset_cap), item],
  });

  tx.moveCall({
    target: `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::unlock::prove_burn`,
    typeArguments: [
      `${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE`,
    ],
    arguments: [tx.object(asset_cap), burn_promise],
  });

  kioskTx.finalize();

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    options: {
      showEffects: true,
    },
  });

  console.log("Status", result.effects?.status);
  console.log("Result", result);
  return itemId;
}
