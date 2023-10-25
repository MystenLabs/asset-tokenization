import { normalizeSuiObjectId } from '@mysten/sui.js/utils';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromHEX } from "@mysten/bcs";
import { packageId, SUI_NETWORK } from "./config";
import { SuiClient } from '@mysten/sui.js/client';
import { getSigner } from "./helpers";
import { CompiledModule, getBytecode } from "./utils/bytecode-template";
import init, * as wasm from "move-binary-format-wasm";

const client = new SuiClient({
  url: SUI_NETWORK
});

const publishNewAsset = async (
  moduleName: string,
  totalSupply: string,
  symbol: string,
  asset_name: string,
  description: string,
  iconUrl: string,
  burnable: string
) => {
  const signer = getSigner();

  const template = getBytecode();

  const compiledModule = new CompiledModule(
    JSON.parse(wasm.deserialize(template))
  ).updateConstant(0, totalSupply, "100", "u64")
    // .updateConstant(1, symbol, "Symbol", "{ Vector: 'U8' }")
    // .updateConstant(2, asset_name, "Name", "string")
    // .updateConstant(3, description, "Description", "string")
    // .updateConstant(4, iconUrl, "icon_url", "string")
    // .updateConstant(5, burnable, "true", "boolean")
    .changeIdentifiers({
      template: moduleName,
      TEMPLATE: moduleName.toUpperCase(),
    });

  const bytesToPublish = wasm.serialize(JSON.stringify(compiledModule));

  const tx = new TransactionBlock();
  const [upgradeCap] = tx.publish({
    modules: [[...fromHEX(bytesToPublish)]],
    dependencies: [
      normalizeSuiObjectId("0x1"),
      normalizeSuiObjectId("0x2"),
      normalizeSuiObjectId(packageId),
    ],
  });

  tx.transferObjects([upgradeCap], tx.pure(signer.getPublicKey().toSuiAddress(), "address"));
  
  const res = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer,
    requestType: "WaitForLocalExecution",
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
      showBalanceChanges: true,
      showInput: true,
    }
  }).catch((e) => console.error(e)! || null);

  if (res === null) {
    throw new Error('Publishing failed');
  }
};

publishNewAsset(
  "magical_asset",
  "200",
  "new_symbol",
  "new_name",
  "new_description",
  "new-icon_url",
  "false"
);
