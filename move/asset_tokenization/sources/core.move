

module asset_tokenization::core {
    // std lib imports
    use std::string::{String};
    use std::option::{Self, Option};
    use std::ascii;
    use std::vector;

    // Sui imports
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Url};
    use sui::vec_map::{Self, VecMap};
    use sui::balance::{Self, Supply, Balance};
    use sui::transfer;

    const ENoSupply: u64 = 1;
    const EInsufficientTotalSupply: u64 = 2;
    const EUniqueAsset: u64 = 3;
    const ENonBurnable: u64 = 4;
    const EVecLengthMismatch: u64 = 5;
    const EInsufficientBalance: u64 = 6;
    const EBadWitness: u64 = 7;

    /// ????
    struct AssetCap<phantom T> has key, store {
        id: UID,
        /// The current circulating supply
        supply: Supply<T>,
        /// The total max supply allowed to exist at any time that was issued
        /// upon creation of Asset T
        total_supply: u64,
        /// TAs of type T can be burned by the admin
	    burnable: bool
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

    /// ???
    struct TokenizedAsset<phantom T> has key, store {
        id: UID,
        /// ???
        balance: Balance<T>,
        /// ???
        metadata: VecMap<String, String>,
        /// ???
        image_url: Option<Url>,
    }

    /// ???
    struct PlatformCap has key, store { id: UID }

    /// ???
    struct BurnProof has drop { item: ID }

    /// Creates a PlatformCap and sends it to the sender.
    fun init(ctx: &mut TxContext) {
        transfer::public_transfer(PlatformCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx))
    }

    /// Creates a new Asset representation
    public fun new_asset<T: drop>(
        witness: T,
        total_supply: u64,
        symbol: ascii::String,
        name: String,
        description: String,
        icon_url: Option<Url>,
        burnable: bool,
        ctx: &mut TxContext
    ): (AssetCap<T>, AssetMetadata<T>) {
        assert!(sui::types::is_one_time_witness(&witness), EBadWitness);
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
    public fun mint<T>(
        cap: &mut AssetCap<T>,
        keys: vector<String>,
        values: vector<String>,
        value: u64,
        ctx: &mut TxContext
    ): TokenizedAsset<T> {
        let supply_value = supply(cap);
        assert!(supply_value + value <= cap.total_supply, ENoSupply);
        let metadata = create_vec_map_from_arrays(keys, values);
        assert!(!vec_map::is_empty(&metadata) && value == 1 || vec_map::is_empty(&metadata) && value > 0, EUniqueAsset);
        let balance = balance::increase_supply(&mut cap.supply, value);

        TokenizedAsset {
            id: object::new(ctx),
            balance,
            metadata,
            image_url: option::none<Url>(),
        }
    }

    /// Split a tokenized_asset
    /// Creates a new tokenized asset of balance split_amount and updates tokenized_asset's balance accordingly
    /// If the asset is unique (NFT) it can not be split into a new TA.
    public fun split<T>(
        self: &mut TokenizedAsset<T>,
        split_amount: u64,
        ctx: &mut TxContext
    ): TokenizedAsset<T> {
        assert!(vec_map::is_empty(&self.metadata), EUniqueAsset);
        let balance_value = value(self);
        assert!(balance_value > 1 && split_amount < balance_value, EInsufficientBalance);

        let new_balance = balance::split(&mut self.balance, split_amount);

        TokenizedAsset {
            id: object::new(ctx),
            balance: new_balance,
            metadata: self.metadata,
            image_url: option::none<Url>(),
        }
    }


    /// Merge tokenized_asset2's balance into tokenized_asset1's balance
    /// Tokenized_asset2 is burned
    /// If the asset is unique (NFT) it can not be merged with other TAs of type T since they describe unique variations of the underlying asset T
    public fun join<T>(
        self: &mut TokenizedAsset<T>,
        other: TokenizedAsset<T>
    ): BurnProof {
        let ft1 = vec_map::is_empty(&self.metadata);
        let ft2 = vec_map::is_empty(&other.metadata);
        assert!(ft1 == true && ft2 == true, EUniqueAsset);

        // TODO: what happens with `image_url`? Will there be a difference
        // between "A and B" and "B and A" scenarios?
        let item = object::id(&other);
        let TokenizedAsset { id, balance, metadata: _, image_url: _ } = other;
        balance::join(&mut self.balance, balance);
        object::delete(id);

        BurnProof { item }
    }

    /// Destroy the tokenized asset and decrease the supply in `cap` accordingly
    public fun burn<T>(
        cap: &mut AssetCap<T>,
        tokenized_asset: TokenizedAsset<T>
    ) {
        assert!(cap.burnable == true, ENonBurnable);
        // cap.total_supply = cap.total_supply - balance_value;
        // let balance_value = value(&tokenized_asset);
        let TokenizedAsset { id, balance, metadata: _, image_url: _} = tokenized_asset;
        balance::decrease_supply(&mut cap.supply, balance);
        object::delete(id);
    }

    /// Returns the value of the total supply
    public fun total_supply<T>(cap: &AssetCap<T>): u64 {
        cap.total_supply
    }

    /// Returns the value of the current circulating supply
    public fun supply<T>(cap: &AssetCap<T>): u64 {
        balance::supply_value(&cap.supply)
    }

    /// Returns the balance value of a TokenizedAsset<T>
    public fun value<T>(tokenized_asset: &TokenizedAsset<T>): u64 {
        balance::value(&tokenized_asset.balance)
    }

    /// Returns the item of a BurnProof
    public fun item(burn_proof: &BurnProof): ID {
        burn_proof.item
    }

    /// TODO: internal ???
    /// Internal helper function used to populate a VecMap<String, String>
    fun create_vec_map_from_arrays(
        keys: vector<String>,
        values: vector<String>
    ): VecMap<String, String> {
        assert!(vector::length(&keys) == vector::length(&values), EVecLengthMismatch);

        let vec_map = vec_map::empty();
        let len = vector::length(&keys);
        let i = 0;

        while (i < len) {
            vec_map::insert(
                &mut vec_map,
                vector::pop_back(&mut keys),
                vector::pop_back(&mut values),
            );
            i = i + 1;
        };
        vec_map
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx);
    }
}
