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
const owner_address = owner_keypair.toSuiAddress().toString();

const buyer_keypair = Ed25519Keypair.deriveKeypair(
  process.env.BUYER_MNEMONIC_PHRASE as string
);
const buyer_address = buyer_keypair.toSuiAddress().toString();

export async function ConvertKioskToPersonal(KioskID?: string) {
    const targetKioskId = KioskID ?? (process.env.TARGET_KIOSK as string);
    const tx = new TransactionBlock();

    const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({address:owner_address});
    // const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({address:buyer_address});

  
    const targetKioskOwnerCap = kioskOwnerCaps.find(
      (kioskCap) => kioskCap.kioskId === targetKioskId
    );
  
    console.log("Target Kiosk Owner Cap: ", targetKioskOwnerCap);
  
    const kioskTx = new KioskTransaction({
      transactionBlock: tx,
      kioskClient,
      cap: targetKioskOwnerCap,
    });
  
    kioskTx.convertToPersonal(false).finalize();
  
    const result = await client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: owner_keypair,
        // signer: buyer_keypair,
        options: {
          showEffects: true,
        },
      });
  
    console.log("Kiosk converted to personal: ", result.effects?.status, result.digest);
  };