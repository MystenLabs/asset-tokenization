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

const buyer_keypair = Ed25519Keypair.deriveKeypair(
    process.env.BUYER_MNEMONIC_PHRASE as string
  );

const buyer_address = buyer_keypair.toSuiAddress().toString();

export async function PurchaseItem(tokenized_asset?: string) {
  const tx = new TransactionBlock();
  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({address:buyer_address});

  const buyerKioskId = process.env.BUYER_KIOSK as string;
  
  const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === buyerKioskId)
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCap,
  });

  const item = {
    itemType: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::tokenized_asset::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>`,
    itemId: tokenized_asset ?? process.env.TOKENIZED_ASSET as string,
    price: '100000',
    sellerKiosk: `${process.env.TARGET_KIOSK}`,
  };
   
  await kioskTx.purchaseAndResolve({
    itemType: item.itemType,
    itemId: item.itemId,
    price: item.price,
    sellerKiosk: item.sellerKiosk,
  });
   
  kioskTx.finalize();

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: buyer_keypair,
    options: {
      showEffects: true,
    },
  });
  
  console.log("Execution status", result.effects?.status);
  console.log("Result", result.effects);
}