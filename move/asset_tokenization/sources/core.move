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
    use sui::package::{Self, Publisher};
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap, TransferRequest};
    use sui::display::{Self, Display};
    use sui::transfer;

    const ENoSupply: u64 = 1;
    const EInsufficientTotalSupply: u64 = 2;
    const EUniqueAsset: u64 = 3;
    const ENonBurnable: u64 = 4;
    const EVecLengthMismatch: u64 = 5;
    const EInsufficientBalance: u64 = 6;
    const EBadWitness: u64 = 7;
    const ETypeNotFromModule: u64 = 8;
    const ENotExpectedBalance: u64 = 9;
    const ENotPromisedItem: u64 = 10;
    const ENotBurnedItem: u64 = 11;
    const ENotExpectedSupply: u64 = 12;
    const EWrongItem: u64 = 13;
    
    struct CORE has drop {}

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

    struct PlatformCap has key, store {
        id: UID
    }

    struct Registry has key {
        id: UID,
        publisher: Publisher
    }

    struct ProtectedTP<phantom T> has key, store {
        id: UID,
        transfer_policy: TransferPolicy<T>
    }

    struct JoinPromise {
        item: ID,
        burned: ID,
        expected_balance: u64
    }

    struct BurnPromise {
        expected_supply: u64
    }

    struct BurnProof has drop {
        item: ID
    }

    /// Creates the Publisher object, wraps it inside the Registry and shares the Registry object. 
    /// It also creates a PlatformCap and sends it to the sender.
    fun init(otw: CORE, ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            publisher: package::claim(otw, ctx)
        };

        let platform_cap = PlatformCap {
            id: object::new(ctx)
        };

        transfer::share_object(registry);
        transfer::public_transfer(platform_cap, tx_context::sender(ctx))
    }
    
    /// Uses the fnft_factory Publisher that is nested inside the registry along with the sender's Publisher 
    /// to create a Transfer Policy for the type TokenizedAsset<T>, where T is contained within the Publisher object. 
    public fun setup_tp<T: drop>(registry: &Registry, publisher: &Publisher, ctx: &mut TxContext): 
		(TransferPolicy<TokenizedAsset<T>>, TransferPolicyCap<TokenizedAsset<T>>) {
            let type_argument = package::from_package<T>(publisher);
            assert!(type_argument, ETypeNotFromModule);

            create_protected_tp<T>(registry, ctx);

            let (policy, cap) = transfer_policy::new<TokenizedAsset<T>>(&registry.publisher, ctx);

            (policy, cap)
        }

    /// Internal method that creates an empty TP and shares a ProtectedTP<T> object. 
    /// This can be used to bypass the lock rule under specific conditions.
    /// Invoked inside setup_tp()
    fun create_protected_tp<T: drop>(registry: &Registry, ctx: &mut TxContext){
        let (policy, cap) = transfer_policy::new<T>(&registry.publisher, ctx);
        let protected_tp = ProtectedTP {
            id: object::new(ctx),
            transfer_policy: policy
        };

        transfer::public_share_object(protected_tp);    
        transfer::public_transfer(cap, tx_context::sender(ctx));
    }

    /// Uses the fnft_factory Publisher that is nested inside the registry along with the sender's Publisher 
    /// to create and return an empty Display for the type TokenizedAsset<T>, where T is contained within the Publisher object.
    public fun setup_display<T: drop>(registry: &Registry, publisher: &Publisher, ctx: &mut TxContext): Display<TokenizedAsset<T>> {
        let type_argument = package::from_package<T>(publisher);
        assert!(type_argument, ETypeNotFromModule);

        let display = display::new<TokenizedAsset<T>>(&registry.publisher, ctx);

        display
    }

    /// A way for the platform to access the publisher mutably
    public fun publisher_mut(_: &PlatformCap, registry: &mut Registry): &mut Publisher {
        let publisher_mut = &mut registry.publisher;

        publisher_mut
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
        ctx: &mut TxContext): 
        (AssetCap<T>, AssetMetadata<T>){
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

    /// A helper method that can be utilized to join kiosk locked TAs. 
    /// Assists in unlocking the TA with a promise that another TA of the same type will contain its balance at the end.
    public fun unlock_join_ta<T>(self: &TokenizedAsset<T>, to_burn: &TokenizedAsset<T>, protected_tp: &ProtectedTP<T>, transfer_request: TransferRequest<T>): JoinPromise {
        let (item, _paid, _from) = transfer_policy::confirm_request(&protected_tp.transfer_policy, transfer_request);
        let burned = object::uid_to_inner(&to_burn.id);
        assert!(item == burned, EWrongItem);

        let self_balance = value(self);
        let to_burn_balance = value(to_burn);
        let expected_balance = self_balance + to_burn_balance;

        let promise_item = object::uid_to_inner(&self.id);

        let join_promise = JoinPromise {
            item: promise_item,
            burned,
            expected_balance
        };

        join_promise
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

    /// A method to prove that the unlocked TA has been burned and its balance has been added inside an existing TA.
    public fun prove_join<T>(self: &TokenizedAsset<T>, promise: JoinPromise, proof: BurnProof) {
        let JoinPromise {item, burned, expected_balance} = promise;
        let balance = value(self);
        let id = object::uid_to_inner(&self.id);
        assert!(balance == expected_balance, ENotExpectedBalance);
        assert!(id == item, ENotPromisedItem);
        assert!(proof.item == burned, ENotBurnedItem);
    }

    /// A helper method that can be utilized to burn kiosk locked TAs. 
    /// Assists in unlocking the TA with a promise that the total supply will be reduced.
    public fun unlock_burn_ta<T>(to_burn: &TokenizedAsset<T>, asset_cap: &AssetCap<T>, protected_tp: &ProtectedTP<T>, transfer_request: TransferRequest<T>): BurnPromise {
        let (item, _paid, _from) = transfer_policy::confirm_request(&protected_tp.transfer_policy, transfer_request);
        let burned = object::uid_to_inner(&to_burn.id);
        assert!(burned == item, EWrongItem);

        let to_burn_balance = value(to_burn);
        let current_supply = supply(asset_cap);

        let expected_supply = current_supply - to_burn_balance;

        let burn_promise = BurnPromise {
            expected_supply
        };

        burn_promise
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

    /// Ensures that the amount burned has in fact reduced the total supply of the asset cap. 
    public fun prove_burn<T>(asset_cap: &AssetCap<T>, promise: BurnPromise) {
        let BurnPromise {expected_supply} = promise;
        let current_supply = supply(asset_cap);
        assert!(current_supply == expected_supply, ENotExpectedSupply);
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

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(CORE {}, ctx);
  }

    #[test_only]
    public fun test_registry(ctx: &mut TxContext): Registry{
        let registry = Registry {
            id: object::new(ctx),
            publisher: package::claim(CORE {}, ctx)
        };
        registry
    }

    #[test_only]
    public fun test_burn_registry(registry: Registry) {
        let Registry {id, publisher} = registry;
        object::delete(id);
        package::burn_publisher(publisher);
    }

}