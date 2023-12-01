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
- Run `npm run publish-asset-tokenization`. This command automatically populates the following fields in the **.env** file: *SUI_NETWORK*, *ASSET_TOKENIZATION_PACKAGE_ID*, *REGISTRY*.

## Publishing Template and/or invoking publishAsset.ts script

- Make sure that the asset_tokenization/Move.toml file has its published-at field uncommented out and populated with the latest deployment of the package.
- Ensure that the asset_tokenization package address is the same as the original deployment (if upgraded otherwise same as published-at).
- If changes have been made to the packages be sure to update:
  - In the `src/utils/bytecode-template.ts` file, the `getBytecode` method
  - The `src/utils/genesis_bytecode` file with the new bytecode.
- Make any changes to the template fields by changing the input parameters of the `publishNewAsset` function.
- Run `npm run publish-template`.
- You should choose and store the *Template Package ID*, *asset metadata ID*, *asset cap ID* and the *Publisher ID* from the created objects in the respective fields within your **.env** file.

## Running scenarios

### Commands
- **Create Transfer Policy**
  Execute `npm run call create-tp` to create a ***Transfer Policy*** and ***ProtectedTP***.
  Select and save the ***TransferPolicy ID*** and the ***ProtectedTP ID*** from the created objects into the respective fields within your **.env** file.
- **Add Rules**
  Modify **transferPolicyRules.ts** in **setup/src/functions** to define transfer rules.
  Run `npm run call tp-rules` to add these rules to the ***Transfer Policy***.
- **Select Kiosk**
  Execute `npm run call select-kiosk` to obtain the ***Kiosk ID***.
  Store the provided ***Kiosk ID*** in the appropriate field within your **.env** file.
- **Mint**
  Edit **mint.ts** in **setup/src/functions** to mint an NFT or FT type tokenized asset.
  Execute `npm run call mint` and save the ***Tokenized Asset ID*** in your **.env** file.
- **Lock**
  Secure the newly minted asset within your kiosk by running `npm run call lock`.
- **Mint and Lock**
  Execute `npm run call mint-lock` to mint and immediately lock the asset within the kiosk.
- **List**
  Run `npm run call list` to list a tokenized asset for sale. Before running the command, please ensure that the field *TOKENIZED_ASSET* within your **.env** file is populated with the specified tokenized asset.
- **Purchase**
  Modify **purchaseItem.ts** in **setup/src/functions** to set the item, price, and seller's kiosk ID.
  Execute `npm run call purchase` to purchase the listed item. This function requires specific fields (like KioskID) in the **.env** file to be filled. Please ensure that the respective fields are populated with the desired objects before executing the command.
- **Join**
  Use `npm run call join` to **merge** two specified FT tokenized assets. Before running the command, please ensure that the fields *FT1* and *FT2* within your **.env** file are populated with the objects you intend to merge.
- **Burn**
  Execute `npm run call burn` to **destroy** a specified tokenized asset. Before running the command, please ensure that the field *TOKENIZED_ASSET* within your **.env** file is populated with the object you intend to burn.
- **Get Balance**
  Retrieve the **balance value** of a specified tokenized asset using `npm run call get-balance`. Before running the command, please ensure that the field *TOKENIZED_ASSET* within your **.env** file is populated with the specified tokenized asset.
- **Get Supply**
  Obtain the **current circulating supply value** of the asset with `npm run call get-supply`.
- **Get Total Supply**
  Retrieve the **total circulating supply** using `npm run call get-total-supply`.
