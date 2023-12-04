import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, KioskTransaction } from "@mysten/kiosk";
import { SUI_NETWORK, KIOSK_NETWORK, adminPhrase, buyerPhrase, tokenizedAssetID, tokenizedAssetType, assetTokenizationPackageId, targetKioskId } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const kioskClient = new KioskClient({
  client,
  network: KIOSK_NETWORK,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);
const address = owner_keypair.toSuiAddress().toString();

// const buyer_keypair = Ed25519Keypair.deriveKeypair(
//   buyerPhrase
// );

// const buyer_address = buyer_keypair.toSuiAddress().toString();

export async function ListItem(tokenized_asset?: string) {
  const itemId = tokenized_asset ?? tokenizedAssetID;
  const itemType = tokenizedAssetType;

  const tx = new TransactionBlock();
  const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });

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
