import { config } from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
config({});

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

type SupplyFields = {
    supply: {
      fields: {
        value: number
      }
    }
}

export async function Supply() {
  const tx = new TransactionBlock();
  const asset_cap_id = process.env.ASSET_CAP_ID as string;

  const asset_cap = await client.getObject({
    id: asset_cap_id,
    options: {
      showContent:true
    }
  })

  let supply = asset_cap.data?.content?.dataType == 'moveObject' && (asset_cap.data?.content.fields as SupplyFields).supply.fields.value;
  console.log("Supply", supply)
}

Supply();