import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, Network, TransferPolicyTransaction, percentageToBasisPoints } from "@mysten/kiosk";
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

export async function transferPolicyRules() { 
    const tx = new TransactionBlock();
    // You could have more than one cap, since we can create more than one transfer policy.
    const policyCaps = await kioskClient.getOwnedTransferPoliciesByType({
        type: `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::core::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>`,
        address: address,
    });
    const targetPolicy = process.env.TRANSFER_POLICY as string;
  
    const policyCap = policyCaps.find((cap) => cap.policyId === targetPolicy)

    const tpTx = new TransferPolicyTransaction({ 
        kioskClient, 
        transactionBlock: tx, 
        cap: policyCap 
    });

    // A demonstration of using all the available rule add/remove functions.
    // You can chain these commands.
    tpTx
        .addFloorPriceRule('1000')
        .addLockRule()
        .addRoyaltyRule(percentageToBasisPoints(10), 0)
        // .addPersonalKioskRule()
        // .removeFloorPriceRule()
        // .removeLockRule()
        // .removeRoyaltyRule()
        // .removePersonalKioskRule()
    
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

transferPolicyRules();