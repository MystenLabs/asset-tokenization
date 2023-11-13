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

const itemId = process.env.TOKENIZED_ASSET as string;

export async function TakeFromKiosk() {  
    const tx = new TransactionBlock();
    const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address });
    
    const targetKioskId = process.env.TARGET_KIOSK as string;
  
    const kioskCap = kioskOwnerCaps.find((cap) => cap.kioskId === targetKioskId)
    const kioskTx = new KioskTransaction({
      transactionBlock: tx,
      kioskClient,
      cap: kioskCap,
    });
    
    // Take item from kiosk.
    const item = kioskTx.take({
      itemId,
      itemType: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::core::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>`,
    });
    
    // Do something with `item`, like transfer it to someone else.
    tx.transferObjects([item], address);
    
    // Finalize the kiosk Tx.
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
  }

  TakeFromKiosk();