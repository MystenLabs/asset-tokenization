module asset_tokenization::fnft_factory {
    // std lib imports
    use std::string::{String};
    use std::option::{Self, Option};
    use std::ascii;

    // Sui imports
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::url::{Url};
    use sui::vec_map::{Self, VecMap};
    use sui::balance::{Self, Supply, Balance};

    const ENoSupply: u64 = 1;
    const EInsufficientTotalSupply: u64 = 2;
    const EUniqueAsset: u64 = 3;
    const ENonUniqueAsset: u64 = 4;
    const ENonBurnable: u64 = 5;
    
    struct AssetCap<phantom T> has key, store {
        id: UID,
        supply: Supply<T>, // the current circulating supply 
        total_supply: u64, // the total max supply allowed to exist at any time that was issued upon creation of Asset T
	    unique: bool, // strictly supporting NFTs of type T or FTs of type T
	    burnable: bool // TAs of type T can be burned by an admin
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

    struct TokenizedAsset<phantom T> has key, store {
        id: UID,
        balance: Balance<T>,
        metadata: VecMap<String, String>,
        image_url: Option<Url>,
        unique: bool
    }


    public fun new_asset<T: drop>(
        witness: T, 
        total_supply: u64, 
        symbol: ascii::String,
        name: String, 
        description: String, 
        icon_url: Option<Url>, 
        unique: bool, 
        burnable: bool, 
        ctx: &mut TxContext): 
        (AssetCap<T>, AssetMetadata<T>){
        assert!(total_supply > 0, EInsufficientTotalSupply);
        let asset_cap = AssetCap {
            id: object::new(ctx),
            supply: balance::create_supply(witness),
            total_supply,
            unique,
            burnable
        };
        
        let asset_metadata = AssetMetadata {
            id: object::new(ctx),
            name,
            symbol,
            description,
            icon_url
        };
        
        (asset_cap, asset_metadata)
    }
    

    /// Create a new unique tokenized asset (NFT)
    /// Since AssetCap<T> will be owned by the creator of type T, it is admin restricted
    /// Can only be called if underlying asset is unique
    /// TAs balance defaults to 0
    public fun mint_nft<T>(cap: &mut AssetCap<T>, metadata: VecMap<String, String>, ctx: &mut TxContext): TokenizedAsset<T> {
        assert!(cap.unique == true, ENonUniqueAsset);
        let nft = mint(cap, metadata, 1, ctx);
        nft
    }


    /// Create a new non-unique tokenized asset (FT)
    /// Since AssetCap<T> will be owned by the creator of type T, it is admin restricted
    /// Can only be called if underlying asset is not unique
    public fun mint_ft<T>(cap: &mut AssetCap<T>, value: u64, ctx: &mut TxContext): TokenizedAsset<T> {
        assert!(cap.unique == false, EUniqueAsset);
        let vec = vec_map::empty();
        let ft = mint(cap, vec, value, ctx);
        ft
    }


    /// Internal helper method utilized by mint_nft & mint_ft
    /// Mints a TA with the specified fields
    fun mint<T>(cap: &mut AssetCap<T>, metadata: VecMap<String, String>, value: u64, ctx: &mut TxContext) : TokenizedAsset<T> {
        let supply_value = supply(cap);
        assert!(supply_value + value <= cap.total_supply, ENoSupply);
        let balance = balance::increase_supply(&mut cap.supply, value);
        let unique = !vec_map::is_empty(&metadata);

        let tokenized_asset = TokenizedAsset {
            id: object::new(ctx),
            balance,
            metadata,
            image_url: option::none<Url>(),
            unique
        };

        tokenized_asset
    }


    /// Split a tokenized_asset
    /// Creates a new tokenized asset of balance split_amount and updates tokenized_asset's balance accordingly
    /// If the asset is unique it can not be split into a new TA. 
    public fun split<T>(tokenized_asset: &mut TokenizedAsset<T>, split_amount: u64, ctx: &mut TxContext): TokenizedAsset<T> {
        assert!(tokenized_asset.unique == false, EUniqueAsset);
        let new_balance = balance::split(&mut tokenized_asset.balance, split_amount);
        let new_tokenized_asset = TokenizedAsset {
            id: object::new(ctx),
            balance: new_balance,
            metadata: tokenized_asset.metadata,
            image_url: option::none<Url>(),
            unique: false
        };

        new_tokenized_asset
    }


    /// Merge tokenized_asset2's balance into tokenized_asset1's balance
    /// Tokenized_asset2 is burned
    /// If the asset is unique it can not be merged with other TAs of type T since they describe unique variations of the underlying asset T
    public fun join<T>(tokenized_asset1: &mut TokenizedAsset<T>, tokenized_asset2: TokenizedAsset<T>) {
        assert!(tokenized_asset1.unique == false && tokenized_asset2.unique == false, EUniqueAsset);
        let TokenizedAsset {id, balance, metadata: _, image_url: _, unique: _} = tokenized_asset2;
        object::delete(id);
        balance::join(&mut tokenized_asset1.balance, balance);
    }


    /// Destroy the tokenized asset and decrease the supply in `cap` accordingly
    public fun burn<T>(cap: &mut AssetCap<T>, tokenized_asset: TokenizedAsset<T>) {
        assert!(cap.burnable == true, ENonBurnable);
        let TokenizedAsset {id, balance, metadata: _, image_url: _, unique: _} = tokenized_asset;
        object::delete(id);
        balance::decrease_supply(&mut cap.supply, balance);
    }


    /// Returns the value of the total supply
    public fun total_supply<T>(cap: &AssetCap<T>): u64 {
        cap.total_supply
    }


    /// Returns the value of the current circulating supply 
    public fun supply<T>(cap: &AssetCap<T>): u64 {
        let supply = balance::supply_value(&cap.supply);
        supply
    }


    /// Returns the balance value of a TokenizedAsset<T>
    public fun value<T>(tokenized_asset: &TokenizedAsset<T>): u64 {
        let balance = balance::value(&tokenized_asset.balance);
        balance
    }

}