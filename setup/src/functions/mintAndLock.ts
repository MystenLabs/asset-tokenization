import { Mint, LockItemInKiosk } from "./../index";

export async function mintAndLock() {
    const minted_asset = await Mint();
    await LockItemInKiosk(minted_asset);
    return minted_asset;
}

