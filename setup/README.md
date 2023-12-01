# Simple instructions

## Prerequisites
- Ensure **Node.js** and **npm** are installed
- Ensure that **jq** tool is installed. You can use the command `brew install jq`.

## General preparation

- Export locally in your terminal the `OWNER_MNEMONIC_PHRASE` variable and the `BUYER_MNEMONIC_PHRASE`.
  `export OWNER_MNEMONIC_PHRASE="your_owner_mnemonic_here"`
  `export BUYER_MNEMONIC_PHRASE="your_buyer_mnemonic_here"`

- Make sure your sui cli is using the same address as the `OWNER_MNEMONIC_PHRASE` variable.

## Publishing Asset Tokenization

- Make sure that the asset_tokenization/Move.toml file has its published-at field commented out or removed.
- Ensure that the asset_tokenization package address is 0x0.
- Run `npm run publish-asset-tokenization`

## Publishing Template and/or invoking publishAsset.ts script

- Make sure that the asset_tokenization/Move.toml file has its published-at field uncommented out and populated with the latest deployment of the package.
- Ensure that the asset_tokenization package address is the same as the original deployment (if upgraded otherwise same as published-at).
- If changes have been made to the packages be sure to update:
  - In the `src/utils/bytecode-template.ts` file, the `getBytecode` method
  - The `src/utils/genesis_bytecode` file with the new bytecode.
- Make any changes to the template fields by changing the input parameters of the `publishNewAsset` function.
- Run `npm run publish-template`

## Running scenarios

### Commands
- **Create Transfer Policy**
  Execute `npm run call create-tp` to create a **Transfer Policy** and **ProtectedTP**.
- **Add Rules**
  Modify **transferPolicyRules.ts** in **setup/src/functions** to define transfer rules.
  Run `npm run call tp-rules` to add these rules to the **Transfer Policy**.
- **Select Kiosk**
  Execute `npm run call select-kiosk` to obtain the **Kiosk ID**.
- **Mint**
  Edit **mint.ts** in **setup/src/functions** to mint an NFT or FT type tokenized asset.
  Execute `npm run call mint` and save the **object's ID**.
- **Lock**
  Secure the newly minted asset within your kiosk by running `npm run call lock`.
- **Mint and Lock**
  Execute `npm run call mint-lock` to mint and immediately lock the asset within the kiosk.
- **List**
  Adjust **listItem.ts** in **setup/src/functions** to specify the asset for sale.
  Run `npm run call list` to list the tokenized asset for sale.
- **Purchase**
  Modify **purchaseItem.ts** in **setup/src/functions** to set the item, price, and seller's kiosk ID.
  Execute `npm run call purchase` to purchase the listed item.
- **Join**
  Use `npm run call join` to **merge** two specified FT tokenized assets.
- **Burn**
  Execute `npm run call burn` to **destroy** a specified tokenized asset.
- **Get Balance**
  Retrieve the **balance value** of a specified tokenized asset using `npm run call get-balance`.
- **Get Supply**
  Obtain the **current circulating supply value** of the asset with `npm run call get-supply`.
- **Get Total Supply**
  Retrieve the **total circulating supply** using `npm run call get-total-supply`.
