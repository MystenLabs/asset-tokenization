import { normalizeSuiObjectId } from "@mysten/sui.js/utils";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { fromHEX } from "@mysten/bcs";
import { assetTokenizationPackageId, SUI_NETWORK } from "./config";
import { SuiClient } from "@mysten/sui.js/client";
import { getSigner } from "./helpers";
import { CompiledModule, getBytecode } from "./utils/bytecode-template";
import init, * as wasm from "move-binary-format-wasm";
import { bytecode as genesis_bytecode } from "./utils/genesis_bytecode";

const client = new SuiClient({
  url: SUI_NETWORK,
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
  )
    .updateConstant(0, totalSupply, "100", "u64")
    .updateConstant(1, symbol, "Symbol", "string")
    .updateConstant(2, asset_name, "Name", "string")
    .updateConstant(3, description, "Description", "string")
    .updateConstant(4, iconUrl, "icon_url", "string")
    .updateConstant(5, burnable, "true", "bool")
    .changeIdentifiers({
      template: moduleName,
      TEMPLATE: moduleName.toUpperCase(),
    });

  const bytesToPublish = wasm.serialize(JSON.stringify(compiledModule));

  const tx = new TransactionBlock();
  tx.setGasBudget(100000000);
  const [upgradeCap] = tx.publish({
    modules: [[...fromHEX(bytesToPublish)], [...fromHEX(genesis_bytecode)]],
    dependencies: [
      normalizeSuiObjectId("0x1"),
      normalizeSuiObjectId("0x2"),
      normalizeSuiObjectId(assetTokenizationPackageId),
    ],
  });

  tx.transferObjects(
    [upgradeCap],
    tx.pure(signer.getPublicKey().toSuiAddress(), "address")
  );

  const txRes = await client
    .signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer,
      requestType: "WaitForLocalExecution",
      options: {
        showEvents: true,
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
        showInput: true,
      },
    })
    .catch((e) => console.error(e)! || null);

  if (txRes?.effects?.status.status === "success") {
    // console.log("New asset published!", JSON.stringify(txRes, null, 2));
    console.log("New asset published! Digest:", txRes.digest);
    const packageId = txRes.effects.created?.find(
      (item) => item.owner === "Immutable"
    )?.reference.objectId;
    console.log("Package ID:", packageId);
  } else {
    console.log("Error: ", txRes?.effects?.status);
    throw new Error("Publishing failed");
  }
};

publishNewAsset(
  "magical_asset",
  "200",
  "MA",
  "Magical Asset",
  "A magical Asset that can be used for magical things!",
  "new-icon_url",
  "true"
);
