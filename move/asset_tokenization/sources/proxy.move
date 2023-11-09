module asset_tokenization::proxy {

    // Sui imports
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::package::{Self, Publisher};
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap};
    use sui::display::{Self, Display};
    use sui::transfer;

    // Core imports
    use asset_tokenization::core::{TokenizedAsset, PlatformCap};

    const ETypeNotFromPackage: u64 = 1;

    struct Registry has key {
        id: UID,
        publisher: Publisher
    }

    struct ProtectedTP<phantom T> has key, store {
        id: UID,
        transfer_policy: TransferPolicy<T>
    }

    struct PROXY has drop {}

    /// Creates the Publisher object, wraps it inside the Registry and shares the Registry object. 
    fun init(otw: PROXY, ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            publisher: package::claim(otw, ctx)
        };

        transfer::share_object(registry);
    }

    /// A way for the platform to access the publisher mutably
    public fun publisher_mut(_: &PlatformCap, registry: &mut Registry): &mut Publisher {
        let publisher_mut = &mut registry.publisher;

        publisher_mut
    }
    
    /// Uses the fnft_factory Publisher that is nested inside the registry along with the sender's Publisher 
    /// to create a Transfer Policy for the type TokenizedAsset<T>, where T is contained within the Publisher object. 
    public fun setup_tp<T: drop>(registry: &Registry, publisher: &Publisher, ctx: &mut TxContext): 
		(TransferPolicy<TokenizedAsset<T>>, TransferPolicyCap<TokenizedAsset<T>>) {
            let type_argument = package::from_package<T>(publisher);
            assert!(type_argument, ETypeNotFromPackage);

            create_protected_tp<T>(registry, ctx);

            let (policy, cap) = transfer_policy::new<TokenizedAsset<T>>(&registry.publisher, ctx);

            (policy, cap)
        }

    /// Internal method that creates an empty TP and shares a ProtectedTP<T> object. 
    /// This can be used to bypass the lock rule under specific conditions.
    /// Invoked inside setup_tp()
    fun create_protected_tp<T: drop>(registry: &Registry, ctx: &mut TxContext){
        let (policy, cap) = transfer_policy::new<TokenizedAsset<T>>(&registry.publisher, ctx);
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
        assert!(type_argument, ETypeNotFromPackage);

        let display = display::new<TokenizedAsset<T>>(&registry.publisher, ctx);

        display
    }

    /// Returns the Transfer Policy for the type TokenizedAsset<T>
    public fun transfer_policy<T>(protected_tp: &ProtectedTP<T>): &TransferPolicy<T> {
        &protected_tp.transfer_policy
    }

    #[test_only]
    public fun test_registry(ctx: &mut TxContext): Registry{
        let registry = Registry {
            id: object::new(ctx),
            publisher: package::claim(PROXY {}, ctx)
        };
        registry
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(PROXY {}, ctx);
    }

    #[test_only]
    public fun test_burn_registry(registry: Registry) {
        let Registry {id, publisher} = registry;
        object::delete(id);
        package::burn_publisher(publisher);
    }

}

