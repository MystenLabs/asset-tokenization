import {TransactionBlock} from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, KioskTransaction, Network } from "@mysten/kiosk";
import { assetCap, adminPhrase, tokenized_asset_type, otw, assetTokenizationPackageId, protectedTP, tokenizedAssetID, targetKioskId } from "../config";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);

const owner_address = owner_keypair.toSuiAddress().toString();

export async function Burn(tokenized_asset?: string) {
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

  const itemType = tokenized_asset_type;
  const itemId = tokenized_asset ?? tokenizedAssetID;

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
    target: `${assetTokenizationPackageId}::unlock::asset_from_kiosk_to_burn`,
    typeArguments: [otw],
    arguments: [
      item,
      tx.object(assetCap),
      tx.object(protectedTP),
      transferRequest,
    ],
  });

  tx.moveCall({
    target: `${assetTokenizationPackageId}::tokenized_asset::burn`,
    typeArguments: [otw],
    arguments: [tx.object(assetCap), item],
  });

  tx.moveCall({
    target: `${assetTokenizationPackageId}::unlock::prove_burn`,
    typeArguments: [otw],
    arguments: [tx.object(assetCap), burn_promise],
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
