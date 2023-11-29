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

const buyer_keypair = Ed25519Keypair.deriveKeypair(
  process.env.BUYER_MNEMONIC_PHRASE as string
);

const buyer_address = buyer_keypair.toSuiAddress().toString();

const itemId = process.env.TOKENIZED_ASSET as string;

export async function ListItem(tokenized_asset?: string) {
  const itemId = tokenized_asset ?? (process.env.TOKENIZED_ASSET as string);
  const itemType = `${process.env.ASSET_TOKENIZATION_PACKAGE_ID}::tokenized_asset::TokenizedAsset<${process.env.TEMPLATE_PACKAGE_ID}::fnft_template::FNFT_TEMPLATE>`;

  const tx = new TransactionBlock();
  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

  const targetKioskId = process.env.TARGET_KIOSK as string;

  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId);
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const SALE_PRICE = "100000";
  kioskTx
    .list({
      itemId,
      itemType,
      price: SALE_PRICE,
    })
    .finalize();

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    // signer: buyer_keypair,
    options: {
      showEffects: true,
    },
  });

  const listing_df = (result.effects?.created &&
    result.effects?.created[0].reference.objectId) as string;
  console.log("Execution status", result.effects?.status);
  console.log("Result", result.effects);
  console.log("Listing Dynamic Field: ", listing_df);
  return listing_df;
}
