import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { KioskClient, Network } from "@mysten/kiosk";
import { targetKioskId, tokenizedAssetType } from "../config";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const kioskClient = new KioskClient({
  client,
  network: Network.TESTNET,
});

export async function QueringKioskContent(KioskID?: string) {
  const res = await kioskClient.getKiosk({
    id: targetKioskId,
    options: {
      withKioskFields: true, // this flag also returns the `kiosk` object in the response, which includes the base setup
      withListingPrices: true, // This flag enables / disables the fetching of the listing prices.
    },
  });

  console.log(res.items);
  return res;
}

export async function QueringTargetContent(KioskID?: string) {
  const targetKiosk = KioskID ?? targetKioskId;

  let result = await QueringKioskContent(targetKiosk);

  let count = 0;
  while (count < result.items.length) {
    let itemType = result.items[count].type;
    if (
      itemType === tokenizedAssetType
    ) {
      let target = result.items[count].kioskId;
      return target;
    }
    count = count + 1;
  }

  return;
}
