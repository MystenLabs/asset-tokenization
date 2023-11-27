// // In this file we are testing an E2E flow of the asset tokenization system.
// //
// // We assume that the user has already created the asset they wish to tokenize by publishing their 'fnft_template' package.
// // From now on, we shall refer to the user who created the asset as the 'owner'.
// // Owner creates a transfer policy and adds rules to it.
// // Owner mints and locks tokenized asset.
// // Join two tokenized asset.
// // Split a tokenized asset.
// // Owner lists minted tokenized_asset for sale.
// // Buyer buys listed asset.

import * as index from "./index";

export async function Main() {
    // create transfer policy and transfer policy rules
    // console.log("---Create Transfer Policy---");
    // const transfer_policy = await index.CreateTransferPolicy();
    // await index.TransferPolicyRules(transfer_policy);
    // console.log("Transfer Policy", transfer_policy);
    
    // mint and lock assets
    console.log("---Mint and Lock---");
    const minted_asset1 = await index.mintAndLock();
    const balance1 = await index.GetBalance(minted_asset1);
    console.log("Minted tokenized asset 1:", minted_asset1);
    console.log("Balance:", balance1);

    const minted_asset2 = await index.mintAndLock();
    const balance2 = await index.GetBalance(minted_asset2);
    console.log("Minted tokenized asset 2:", minted_asset2);
    console.log("Balance:", balance2);

    // join TAs
    console.log('\n', "---Join Assets---");
    const remaining_asset = await index.Join(minted_asset1, minted_asset2);
    const joined_balance = await index.GetBalance(remaining_asset);
    console.log("Joined balance: ", joined_balance);


    // split TA
    console.log('\n', "---Split Asset---");
    const new_tokenized_asset = await index.Split(minted_asset1);
    const new_ta_balance = await index.GetBalance(new_tokenized_asset);
    const existed_ta_balance = await index.GetBalance(minted_asset1);
    let supply = await index.GetSupply();
    console.log("Existed tokenized asset: ", minted_asset1, "Balance: ", existed_ta_balance);
    console.log("Newly created tokenized asset: ", new_tokenized_asset, "Balance: ", new_ta_balance);

    // burn TA
    console.log('\n', "---Burn Tokenized Asset---")
    const burned_item = await index.Burn(new_tokenized_asset);
    console.log("Burned Item: ", burned_item);
    supply = await index.GetSupply();

    // list TA
    console.log('\n', "---List Item---");
    const listing_digest = await index.ListItem(minted_asset1);

    // purchase TA
    console.log('\n', "---Purchase Item---");
    const purchasing_digest = await index.PurchaseItem(minted_asset1);
}