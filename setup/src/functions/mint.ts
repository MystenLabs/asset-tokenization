import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Console } from "console";
config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const owner_keypair = Ed25519Keypair.deriveKeypair(
  process.env.OWNER_MNEMONIC_PHRASE as string
);


function getVecMapValues() {
  // const keys = [
  //   "Piece",
  //   "Is it Amazing?",
  //   "In a scale from 1 to 10, how good?",
  // ];
  // const values = ["8/100", "Yes", "11"];
  const keys : string[] = [];
  const values : string[] = [];

  return { keys, values };
}


export async function Mint() {
  const { keys, values } = getVecMapValues();

  const tx = new TransactionBlock();

  let tokenized_asset = tx.moveCall({
    target: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::tokenized_asset::mint`,
    typeArguments: [`${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE`],
    arguments: [
      tx.object(process.env.ASSET_CAP_ID as string),
      tx.pure(keys, "vector<string>"),
      tx.pure(values, "vector<string>"),
      tx.pure(3)
    ],
  });

  tx.transferObjects([tokenized_asset], owner_keypair.getPublicKey().toSuiAddress());
  
  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: owner_keypair,
    options: {
      showEffects: true,
    },
  });

  console.log("Status", result.effects?.status);
  console.log("Result", result);
  
  const created = result.effects?.created;
  const tokenized_asset_id = (result.effects?.created && result.effects?.created[0].reference.objectId) as string;
  console.log(tokenized_asset_id);

  return tokenized_asset_id
}

