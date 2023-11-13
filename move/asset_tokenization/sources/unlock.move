module asset_tokenization::unlock {

    // Sui imports
    use sui::object::{Self, ID};
    use sui::transfer_policy::{Self, TransferRequest};

    use asset_tokenization::core::{Self, TokenizedAsset, BurnProof, AssetCap};
    use asset_tokenization::proxy::{Self, ProtectedTP};

    const EWrongItem: u64 = 1;
    const ENotExpectedSupply: u64 = 2;
    const ENotExpectedBalance: u64 = 3;
    const ENotPromisedItem: u64 = 4;
    const ENotBurnedItem: u64 = 5;

    struct JoinPromise {
        item: ID,
        burned: ID,
        expected_balance: u64
    }

    ///
    struct BurnPromise {
        expected_supply: u64
    }

    // Kiosk [ A, B ]
    // Merge: A <- B = A
    // Borrow A
    // Eject B: "B, TransferRequest<()>"

    /// A helper method that can be utilized to join kiosk locked TAs.
    /// Assists in unlocking the TA with a promise that another TA of the same type will contain its balance at the end.
    public fun unlock_join_ta<T>(
        self: &TokenizedAsset<T>, // a
        to_burn: &TokenizedAsset<T>, // b
        protected_tp: &ProtectedTP<TokenizedAsset<T>>, // unlocker
        transfer_request: TransferRequest<TokenizedAsset<T>> // transfer request for b
    ): JoinPromise {
        let transfer_policy_ref = proxy::transfer_policy(protected_tp);
        let (item, _paid, _from) = transfer_policy::confirm_request(
            transfer_policy_ref, transfer_request
        );
        let burned = object::id(to_burn);
        assert!(item == burned, EWrongItem);

        let self_balance = core::value(self);
        let to_burn_balance = core::value(to_burn);
        let expected_balance = self_balance + to_burn_balance;

        let promise_item = object::id(self);

        JoinPromise {
            item: promise_item,
            burned,
            expected_balance
        }
    }


    /// A method to prove that the unlocked TA has been burned and its balance has been added inside an existing TA.
    public fun prove_join<T>(self: &TokenizedAsset<T>, promise: JoinPromise, proof: BurnProof) {
        let JoinPromise {item, burned, expected_balance} = promise;
        let balance = core::value(self);
        let id = object::id(self);
        assert!(balance == expected_balance, ENotExpectedBalance);
        assert!(id == item, ENotPromisedItem);
        assert!(core::item(&proof) == burned, ENotBurnedItem);
    }

    /// A helper method that can be utilized to burn kiosk locked TAs.
    /// Assists in unlocking the TA with a promise that the total supply will be reduced.
    public fun unlock_burn_ta<T>(
        to_burn: &TokenizedAsset<T>,
        asset_cap: &AssetCap<T>,
        protected_tp: &ProtectedTP<TokenizedAsset<T>>,
        transfer_request: TransferRequest<TokenizedAsset<T>>,
    ): BurnPromise {
        let transfer_policy_ref = proxy::transfer_policy(protected_tp);
        let (item, _paid, _from) = transfer_policy::confirm_request(transfer_policy_ref, transfer_request);
        let burned = object::id(to_burn);

        assert!(burned == item, EWrongItem);

        let to_burn_balance = core::value(to_burn);
        let current_supply = core::supply(asset_cap);

        let expected_supply = current_supply - to_burn_balance;

        BurnPromise {
            expected_supply
        }
    }

    /// Ensures that the amount burned has in fact reduced the total supply of the asset cap.
    public fun prove_burn<T>(asset_cap: &AssetCap<T>, promise: BurnPromise) {
        let BurnPromise { expected_supply } = promise;
        let current_supply = core::supply(asset_cap);
        assert!(current_supply == expected_supply, ENotExpectedSupply);
    }
}
