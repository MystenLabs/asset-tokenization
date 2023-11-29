# Simples instructions, to exapand.

## Publishing Asset Tokenization

- Make sure that the asset_tokenization/Move.toml file has its published-at field commented out or removed.
- Ensure that the asset_tokenization package address is 0x0.
- Run `npm run publish-asset-tokenization`

## Publishing Template and/or invoking publishAsset.ts script

- Make sure that the template/Move.toml file has its published-at field uncommented out and populated with the latest deployment of the package.
- Ensure that the template package address is the same as the original deployment (if upgraded otherwise same as published-at).
- If changes have been made to the packages be sure to update:
  - In the `src/utils/bytecode-template.ts` file, the `getBytecode` method
  - The `src/utils/genesis_bytecode` file with the new bytecode.
- Make any changes to the template fields by changing the input parameters of the `publishNewAsset` function.
- Run `npm run publish-template`

## Running scenarios

todo
