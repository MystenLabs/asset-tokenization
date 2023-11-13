import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const owner_keypair = Ed25519Keypair.deriveKeypair(
  process.env.OWNER_MNEMONIC_PHRASE as string
);
const address = owner_keypair.toSuiAddress().toString();


export async function CreateTransferPolicy() {  
  const tx = new TransactionBlock();
  const registry = process.env.REGISTRY as string;
  const publisher = process.env.ASSET_PUBLISHER as string;

  const [policy, cap] = tx.moveCall({
    target: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::core::setup_tp`,
    typeArguments: [
      `${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE`,
    ],
    arguments: [
      tx.object(registry),
      tx.object(publisher),
    ],
  });
  console.log("Cap", cap);
  console.log("Policy", policy);
  tx.transferObjects([cap], address);

  tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [`0x0000000000000000000000000000000000000000000000000000000000000002::transfer_policy::TransferPolicy<${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::core::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>>`],
    arguments: [
      policy
    ],
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
}

CreateTransferPolicy();
  