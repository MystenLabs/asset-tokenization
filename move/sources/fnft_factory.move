module asset_tokenization::fnft_factory {
    // std lib imports
    use std::string::{String};
    use std::option::{Self, Option};
    use std::ascii;

    // Sui imports
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::package::{Self};
    use sui::transfer;
    use sui::url::{Self, Url};
    use sui::vec_map::{Self, VecMap};
    use sui::balance::{Self, Supply};
    
    struct AssetCap<phantom T> {
        id: UID,
        supply: Supply<T>, // the current available supply
        total_supply: u64 // the total supply that was issued upon creation of Asset T
    }

    struct AssetMetadata<phantom T> has key, store {
        id: UID,
        /// Name of the asset
        name: String,
        /// Symbol for the asset
        symbol: ascii::String,
        /// Description of the asset
        description: String,
        /// URL for the asset logo
        icon_url: Option<Url>
    }

    struct TokenizedAsset<phantom T> {
        id: UID,
        // balance: BalanceGuard<T>, //TODO: Add BalanceGuard module
        metadata: VecMap<String, String>,
        image_url: Option<Url>
    }

}