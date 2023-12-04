import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { SUI_NETWORK, assetOTW, assetTokenizationPackageId, adminPhrase, assetCap } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);

function getVecMapValues() {
  // const keys = [
  //   "Piece",
  //   "Is it Amazing?",
  //   "In a scale from 1 to 10, how good?",
  // ];
  // const values = ["8/100", "Yes", "11"];
  const keys: string[] = [];
  const values: string[] = [];

  return { keys, values };
}

export async function Mint() {
  const { keys, values } = getVecMapValues();

  const tx = new TransactionBlock();

  let tokenized_asset = tx.moveCall({
    target: `${assetTokenizationPackageId}::tokenized_asset::mint`,
    typeArguments: [assetOTW],
    arguments: [
      tx.object(assetCap),
      tx.pure(keys, "vector<string>"),
      tx.pure(values, "vector<string>"),
      tx.pure(3),
    ],
  });

  tx.transferObjects(
    [tokenized_asset],
    owner_keypair.getPublicKey().toSuiAddress()
  );

  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    options: {
      showEffects: true,
    },
  });

  console.log("Status", result.effects?.status);
  console.log("Result", result);

  const tokenized_asset_id = (result.effects?.created &&
    result.effects?.created[0].reference.objectId) as string;
  console.log("Minted Tokenized Asset :", tokenized_asset_id);

  return tokenized_asset_id;
}
