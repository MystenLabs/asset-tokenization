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

export async function QueringKioskContent(KioskID?: string) {
  const targetKioskId = KioskID ?? (process.env.TARGET_KIOSK as string);

  const res = await kioskClient.getKiosk({
    id: targetKioskId,
    options: {
        withKioskFields: true, // this flag also returns the `kiosk` object in the response, which includes the base setup
        withListingPrices: true, // This flag enables / disables the fetching of the listing prices.
    }
  });

  console.log(res.items);
  return res;
}


export async function QueringTargetContent(KioskID?: string) {

  const targetKioskId = KioskID ?? (process.env.TARGET_KIOSK as string);

  let result = await QueringKioskContent(targetKioskId);

  let count = 0;
  while (count < result.items.length) {
    let itemType = result.items[count].type;
    if (itemType ===  `${process.env.PACKAGE_ID_ASSET_TOKENIZATION}::tokenized_asset::TokenizedAsset<${process.env.PACKAGE_ID_FNFT_TEMPLATE}::fnft_template::FNFT_TEMPLATE>`){
      let target = result.items[count].kioskId;
      return target;
    }
    count = count + 1;
  };

  return;
}
