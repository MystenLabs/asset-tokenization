import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { SUI_NETWORK, assetCap } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

type TotalSupplyFields = {
  total_supply: number
}

export async function GetTotalSupply() {
    const tx = new TransactionBlock();
  
    const asset_cap = await client.getObject({
      id: assetCap,
      options: {
        showContent:true
      }
    })
  
    let total_supply = asset_cap.data?.content?.dataType == 'moveObject' && (asset_cap.data?.content.fields as TotalSupplyFields).total_supply;
    console.log("Total Supply: ", total_supply)
    return total_supply;
}