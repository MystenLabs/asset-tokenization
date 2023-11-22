import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";

config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

type TotalSupplyFields = {
  total_supply: number
}

export async function GetTotalSupply() {
    const tx = new TransactionBlock();
    const asset_cap_id = process.env.ASSET_CAP_ID as string;
  
    const asset_cap = await client.getObject({
      id: asset_cap_id,
      options: {
        showContent:true
      }
    })
  
    let total_supply = asset_cap.data?.content?.dataType == 'moveObject' && (asset_cap.data?.content.fields as TotalSupplyFields).total_supply;
    console.log("Total Supply", total_supply)
    return total_supply;
}