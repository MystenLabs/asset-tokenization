# Asset Tokenization
## Introduction
Asset tokenization refers to the process of representing real-world assets, such as real estate, art, commodities, stocks, or other valuable assets, as digital tokens on the blockchain network. This involves converting the ownership or rights of an asset into digital tokens, which are then recorded and managed on the blockchain.
The concept is to divide high-value assets into smaller, more affordable units, representing ownership or a fraction of the asset.
This strategy enables wider participation from investors who may not have the means to acquire the entire asset but can afford a fraction of it, thereby expanding accessibility to a broader range of investors.
For comprehensive details and instructions, please refer to the following link:
https://docs.sui.io/guides/developer/advanced/asset-tokenization
#### Asset Creation
- **Fractionalization**: Assets are divided into a total supply of fractional tokens, each representing a share of the asset.
- **Metadata**: Each asset has defined fields (name, description, etc.) forming its metadata, consistent across all fractions.
#### NFTs vs FTs Distinction
- **NFTs**: Unique assets with extra metadata, limited to a balance of 1, representing a single instance.
- **FTs**: Identical assets without additional metadata, allowing a balance greater than 1, enabling multiple instances. FTs allow merging or splitting, offering flexibility in handling varying quantities.
#### Burnability
- **Asset Burning**: Asset creators can specify if fractions are burnable, allowing removal from circulation.
- **Impact of Burning**: Decreases circulating supply but maintains the total supply, enabling minting of burned fractions to retain the predetermined total supply.
## Deployment
### Publishing
#### Publishing the asset_tokenization Package
##### Manually
In a terminal or console at the move/asset_tokenization directory of the project, run:
`sui client publish --gas-budget <GAS-BUDGET>`
Replace <GAS-BUDGET> with an appropriate value (e.g., 20000000 MIST) for the gas budget.
The package should successfully build & deploy, and you should see:
```bash
    UPDATING GIT DEPENDENCY https://github.com/MystenLabs/sui.git
    INCLUDING DEPENDENCY Sui
    INCLUDING DEPENDENCY MoveStdlib
    BUILDING asset_tokenization
    Successfully verified dependencies on-chain against source.
```
Choose and store the `package ID` and the `registry ID` from the created objects in the respective fields within your .env file.
Modify the Move.toml file under the [package] section by adding published-at = <package ID>. Also, under the [addresses] section, replace 0x0 with the same `package ID`.
##### Automatically
The fields that are automatically filled are: `SUI_NETWORK`, `ASSET_TOKENIZATION_PACKAGE_ID` and `REGISTRY`.
To publish with the bash script run:
`npm run publish-asset-tokenization`
After publishing, you can now edit the `Move.toml` file like described in the Manual flow.
#### Publishing template Package
##### Manually
To publish the template package move to the template folder and execute the same command as in the previous section.
You should choose and store the `package ID`, asset `metadata ID`, `asset cap ID` and the `Publisher ID` from the created objects in the respective fields within your **.env** file.
##### Automatically
The process of automatic deployment for the template package refers to publishing a new asset via the WASM library. Quick start steps:
- Make sure that the `asset_tokenization/Move.toml` file has its published-at field uncommented and populated with the latest deployment of the package.
- Ensure that the `asset_tokenization` package address is the same as the original deployment (if upgraded otherwise same as published-at).
- Make any changes to the template fields by changing the input parameters of the `publishNewAsset` function.
- Run `npm run publish-template`.
You should choose and store the `Template Package ID`, `asset metadata ID`, `asset cap ID` and the `Publisher ID` from the created objects in the respective fields within your **.env** file.
For more details regarding this process, please consult the setup folder’s [README](https://github.com/MystenLabs/asset-tokenization/tree/main/setup).