import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { KioskClient, TransferPolicyTransaction, percentageToBasisPoints } from "@mysten/kiosk";
import { SUI_NETWORK, KIOSK_NETWORK, adminPhrase, transferPolicy, tokenizedAssetType } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

const kioskClient = new KioskClient({
  client,
  network: KIOSK_NETWORK,
});

const owner_keypair = Ed25519Keypair.deriveKeypair(
  adminPhrase
);
const address = owner_keypair.toSuiAddress().toString();

export async function TransferPolicyRules(transfer_policy?: string) {
  const tx = new TransactionBlock();
  const targetPolicyID = transfer_policy ?? transferPolicy;
  // You could have more than one cap, since we can create more than one transfer policy.
  const policyCaps = await kioskClient.getOwnedTransferPoliciesByType({
    type: tokenizedAssetType,
    address: address,
  });

  const policyCap = policyCaps.find((cap) => cap.policyId === targetPolicyID);

  const tpTx = new TransferPolicyTransaction({
    kioskClient,
    transactionBlock: tx,
    cap: policyCap,
  });

  // A demonstration of using all the available rule add/remove functions.
  // You can chain these commands.
  tpTx
    .addFloorPriceRule("1000")
    .addLockRule()
    .addRoyaltyRule(percentageToBasisPoints(10), 0);
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
