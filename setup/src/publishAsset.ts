import { TransactionBlock, normalizeSuiObjectId } from "@mysten/sui.js";
import { fromHEX } from "@mysten/bcs";
import { packageId } from "./config";
import { getSigner } from "./helpers";
import { CompiledModule, getBytecode } from "./utils/bytecode-template";
import init, * as wasm from "move-binary-format-wasm";

const publishNewAsset = async (
  moduleName: string,
  totalSupply: string,
  symbol: string,
  asset_name: string,
  description: string,
  iconUrl: string,
  burnable: string
) => {
  let signer = getSigner();
  let admin = await signer.getAddress();

  // await init("move_binary_format_wasm_bg.wasm");
  const template = getBytecode();
  const compiledModule = new CompiledModule(
    JSON.parse(wasm.deserialize(template))
  )
    .updateConstant(0, totalSupply, "100", "u64")
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

  tx.transferObjects([upgradeCap], tx.pure(admin, "address"));

  try {
    let res = await signer.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      requestType: "WaitForLocalExecution",
      options: {
        showObjectChanges: true,
      },
    });

    console.log(
      "Collection published!",
      JSON.stringify(res.objectChanges, null, 2)
    );
  } catch (e) {
    console.error("Could not publish", e);
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
