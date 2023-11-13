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


export async function CreatingNewPersonalKiosk() {
  const tx = new TransactionBlock();
  const kioskTx = new KioskTransaction({ transactionBlock: tx, kioskClient });

  // Calls the creation function.
  // kioskTx.createPersonal();
  kioskTx
    .createPersonal() // `true` allows us to reuse the kiosk in the same PTB. If we pass false, we can only call `kioskTx.finalize()`.
    .finalize(); // finalize is always our last call.

  // Shares the kiosk and transfers the `KioskOwnerCap` to the owner.
  // kioskTx.shareAndTransferCap(address);

  // Always called as our last kioskTx interaction.
  // kioskTx.finalize();

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

CreatingNewPersonalKiosk();