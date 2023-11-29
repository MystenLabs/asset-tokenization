import * as index from "./index";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Please provide a function name as an argument.");
} else {
  const functionName = args[0];
  switch (functionName) {
    case "create-tp":
      index.CreateTransferPolicy();
      break;
    case "tp-rules":
      index.TransferPolicyRules();
      break;
    case "mint":
      index.Mint();
      break;
    case "quering-kiosk":
      index.QueringKiosks();
      break;
    case "quering-kiosk-content":
      index.QueringKioskContent();
      break;
    case "select-kiosk":
      index.ForcePersonalKiosk();
      break;
    case "lock":
      index.LockItemInKiosk();
      break;
    case "place":
      index.PlaceItemInKiosk();
      break;
    case "take-from-kiosk":
      index.TakeFromKiosk();
      break;
    case "mint-lock":
      index.mintAndLock();
      break;
    case "get-balance":
      index.GetBalance();
      break;
    case "get-supply":
      index.GetSupply();
      break;
    case "get-total-supply":
      index.GetTotalSupply();
      break;
    case "split":
      index.Split();
      break;
    case "list":
      index.ListItem();
      break;
    case "delist":
      index.DelistItem();
      break;
    case "purchase":
      index.PurchaseItem();
      break;
    case "join":
      index.Join();
      break;
    case "burn":
      index.Burn();
      break;
    case "convert-to-personal":
      index.ConvertKioskToPersonal();
      break;
    case "create-kiosk":
      index.CreateNewKiosk();
      break;
    case "create-personal-kiosk":
      index.CreateNewPersonalKiosk();
      break;
    case "e2e":
      index.Main();
      break;
    default:
      console.log(`Function '${functionName}' not found.`);
      break;
  }
}
