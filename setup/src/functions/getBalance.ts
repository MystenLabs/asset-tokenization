import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { SUI_NETWORK, tokenizedAssetID } from "../config";

const client = new SuiClient({ url: SUI_NETWORK });

type TokenizedAssetFields = {
  balance: number
}

export async function GetBalance(tokenized_asset?: string) {
    const tx = new TransactionBlock();
  
    const tokenized_asset_id = tokenized_asset ?? tokenizedAssetID;

    const tokenized_asset_object = await client.getObject({
      id: tokenized_asset_id,
      options: {
        showContent:true
      }
    })
  
    const tokenized_asset_balance = tokenized_asset_object.data?.content?.dataType == 'moveObject' && (tokenized_asset_object.data?.content.fields as TokenizedAssetFields).balance;

    console.log("Tokenized Asset Balance: ", tokenized_asset_balance)
    return tokenized_asset_balance;
}