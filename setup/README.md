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
- Run `npm run publish-asset-tokenization`. This command automatically populates the following fields in the **.env** file: _SUI_NETWORK_, _ASSET_TOKENIZATION_PACKAGE_ID_, _REGISTRY_.

## Publishing Template and/or invoking publishAsset.ts script

- Make sure that the asset_tokenization/Move.toml file has its published-at field uncommented out and populated with the latest deployment of the package.
- Ensure that the asset_tokenization package address is the same as the original deployment (if upgraded otherwise same as published-at).
- If changes have been made to the packages be sure to update:
  - Build the template package.
  - In the `src/utils/bytecode-template.ts` file, the `getBytecode` method.
  - The `src/utils/genesis_bytecode` file with the new bytecode.
  - The above two bytecodes can be obtained by running `xxd -c 0 -p build/template/bytecode_modules/<module_name>.mv | head -n 1 `
- Make any changes to the template fields by changing the input parameters of the `publishNewAsset` function.
- Run `npm run publish-template`.
- You should choose and store the _Template Package ID_, _asset metadata ID_, _asset cap ID_ and the _Publisher ID_ from the created objects in the respective fields within your **.env** file.

## Running scenarios

### Commands

- **Create Transfer Policy**
  Execute `npm run call create-tp` to create a **_Transfer Policy_** and **_ProtectedTP_**.
  Select and save the **_TransferPolicy ID_** and the **_ProtectedTP ID_** from the created objects into the respective fields within your **.env** file.
- **Add Rules**
  Modify **transferPolicyRules.ts** in **setup/src/functions** to define transfer rules.
  Run `npm run call tp-rules` to add these rules to the **_Transfer Policy_**.
- **Select Kiosk**
  Execute `npm run call select-kiosk` to obtain the **_Kiosk ID_**.
  Store the provided **_Kiosk ID_** in the appropriate field within your **.env** file.
- **Mint**
  Edit **mint.ts** in **setup/src/functions** to mint an NFT or FT type tokenized asset.
  Execute `npm run call mint` and save the **_Tokenized Asset ID_** in your **.env** file.
- **Lock**
  Secure the newly minted asset within your kiosk by running `npm run call lock`.
- **Mint and Lock**
  Execute `npm run call mint-lock` to mint and immediately lock the asset within the kiosk.
- **List**
  Run `npm run call list` to list a tokenized asset for sale. Before running the command, please ensure that the field _TOKENIZED_ASSET_ within your **.env** file is populated with the specified tokenized asset.
- **Purchase**
  Modify **purchaseItem.ts** in **setup/src/functions** to set the item, price, and seller's kiosk ID.
  Execute `npm run call purchase` to purchase the listed item. This function requires specific fields (like KioskID) in the **.env** file to be filled. Please ensure that the respective fields are populated with the desired objects before executing the command.
- **Join**
  Use `npm run call join` to **merge** two specified FT tokenized assets. Before running the command, please ensure that the fields _FT1_ and _FT2_ within your **.env** file are populated with the objects you intend to merge.
- **Burn**
  Execute `npm run call burn` to **destroy** a specified tokenized asset. Before running the command, please ensure that the field _TOKENIZED_ASSET_ within your **.env** file is populated with the object you intend to burn.
- **Get Balance**
  Retrieve the **balance value** of a specified tokenized asset using `npm run call get-balance`. Before running the command, please ensure that the field _TOKENIZED_ASSET_ within your **.env** file is populated with the specified tokenized asset.
- **Get Supply**
  Obtain the **current circulating supply value** of the asset with `npm run call get-supply`.
- **Get Total Supply**
  Retrieve the **total circulating supply** using `npm run call get-total-supply`.
