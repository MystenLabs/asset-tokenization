module asset_tokenization::fnft_factory {
    // std lib imports
    use std::string::{String};
    use std::option::{Self, Option};
    use std::ascii;
    use std::vector;

    // Sui imports
    use sui::object::{Self, UID};
    use sui::url::{Url};
    use sui::vec_map::{Self, VecMap};
    use sui::balance::{Self, Supply, Balance};
    use sui::package::{Self, Publisher};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    // Error codes. 
    const ENoSupply: u64 = 1;
    const EInsufficientTotalSupply: u64 = 2;
    const EUniqueAsset: u64 = 3;
    const ENonBurnable: u64 = 4;
    const EVecLengthMismatch: u64 = 5;
    const EInsufficientBalance: u64 = 6;
    const ENotOneTimeWitness: u64 = 7;
    const ETypeNotFromModule: u64 = 8;

    /// Special object which connects creator with asset `T` type.
    struct AssetMetadataTypeProof<phantom T: store> has key, store {
        id: UID,
        publisher: Publisher
    }
    
    struct AssetCap<phantom T> has key, store {
        id: UID,
        supply: Supply<T>, // the current circulating supply 
        total_supply: u64, // the total max supply allowed to exist at any time that was issued upon creation of Asset T
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
    }


    public fun new_asset<T: drop>(
        witness: T, 
        total_supply: u64, 
        symbol: ascii::String,
        name: String, 
        description: String, 
        icon_url: Option<Url>, 
        burnable: bool, 
        ctx: &mut TxContext): 
        (AssetCap<T>, AssetMetadata<T>){
        assert!(total_supply > 0, EInsufficientTotalSupply);
        let asset_cap = AssetCap {
            id: object::new(ctx),
            supply: balance::create_supply(witness),
            total_supply,
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

    /// Mints a TA with the specified fields
    public fun mint<T>(cap: &mut AssetCap<T>, keys: vector<String>, values: vector<String>, value: u64, ctx: &mut TxContext) : TokenizedAsset<T> {
        let supply_value = supply(cap);
        assert!(supply_value + value <= cap.total_supply, ENoSupply);
        let metadata = create_vec_map_from_arrays(keys, values);
        assert!(!vec_map::is_empty(&metadata) && value == 1 || vec_map::is_empty(&metadata) && value > 0, EUniqueAsset);
        let balance = balance::increase_supply(&mut cap.supply, value);
        let tokenized_asset = TokenizedAsset {
            id: object::new(ctx),
            balance,
            metadata,
            image_url: option::none<Url>(),
        };

        tokenized_asset
    }


    /// Split a tokenized_asset
    /// Creates a new tokenized asset of balance split_amount and updates tokenized_asset's balance accordingly
    /// If the asset is unique (NFT) it can not be split into a new TA. 
    public fun split<T>(tokenized_asset: &mut TokenizedAsset<T>, split_amount: u64, ctx: &mut TxContext): TokenizedAsset<T> {
        let ft = vec_map::is_empty(&tokenized_asset.metadata);
        assert!(ft == true, EUniqueAsset);
        let balance_value = value(tokenized_asset);
        assert!(balance_value > 1 && split_amount < balance_value, EInsufficientBalance);

        let new_balance = balance::split(&mut tokenized_asset.balance, split_amount);
        let new_tokenized_asset = TokenizedAsset {
            id: object::new(ctx),
            balance: new_balance,
            metadata: tokenized_asset.metadata,
            image_url: option::none<Url>(),
        };

        new_tokenized_asset
    }


    /// Merge tokenized_asset2's balance into tokenized_asset1's balance
    /// Tokenized_asset2 is burned
    /// If the asset is unique (NFT) it can not be merged with other TAs of type T since they describe unique variations of the underlying asset T
    public fun join<T>(tokenized_asset1: &mut TokenizedAsset<T>, tokenized_asset2: TokenizedAsset<T>) {
        let ft1 = vec_map::is_empty(&tokenized_asset1.metadata);
        let ft2 = vec_map::is_empty(&tokenized_asset2.metadata);
        assert!(ft1 == true && ft2 == true, EUniqueAsset);
        let TokenizedAsset {id, balance, metadata: _, image_url: _} = tokenized_asset2;
        object::delete(id);
        balance::join(&mut tokenized_asset1.balance, balance);
    }


    /// Destroy the tokenized asset and decrease the supply in `cap` accordingly
    public fun burn<T>(cap: &mut AssetCap<T>, tokenized_asset: TokenizedAsset<T>) {
        assert!(cap.burnable == true, ENonBurnable);
        let balance_value = value(&tokenized_asset);
        cap.total_supply = cap.total_supply - balance_value;
        let TokenizedAsset {id, balance, metadata: _, image_url: _} = tokenized_asset;
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

    /// Internal helper function used to populate a VecMap<String, String>
    public fun create_vec_map_from_arrays(keys: vector<String>, values: vector<String>): VecMap<String, String> {
        let vec_map = vec_map::empty<String, String>();

        let len = vector::length(&keys);
        assert!(len == vector::length(&values), EVecLengthMismatch);

        let i = 0;
        while (i < len) {
            vec_map::insert(&mut vec_map, *vector::borrow(&keys, i), *vector::borrow(&values, i));
            i = i + 1;
        };
        vec_map
    }

    /// Returns proof for asset `T` that the sender wants to create.
    public fun claim_asset_type_proof<OTW: drop, T: store>(
        otw: OTW, ctx: &mut TxContext
    ) {
        // Check that passed argument is a valid one-time witness.
        assert!(sui::types::is_one_time_witness(&otw), ENotOneTimeWitness);
        let publisher = package::claim(otw, ctx);
        // Check whether `T` belongs to the same module as the publisher.
        assert!(package::from_module<T>(&publisher), ETypeNotFromModule);
        transfer::transfer(AssetMetadataTypeProof<T> {
            id: object::new(ctx),
            publisher,
        }, tx_context::sender(ctx));
    }

}