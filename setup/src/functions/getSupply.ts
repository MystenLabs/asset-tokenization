import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { assetCap } from "../config";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

type SupplyFields = {
    supply: {
      fields: {
        value: number
      }
    }
}

export async function GetSupply() {
  const tx = new TransactionBlock();

  const asset_cap = await client.getObject({
    id: assetCap,
    options: {
      showContent:true
    }
  })

  const supply = asset_cap.data?.content?.dataType == 'moveObject' && (asset_cap.data?.content.fields as SupplyFields).supply.fields.value;
  console.log("Current Supply: ", supply)
  return supply;
}