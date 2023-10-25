#[test_only]

module asset_tokenization::fnft_factory_tests {
    // Imports
    use sui::test_scenario::{Self};
    use asset_tokenization::fnft_factory::{Self};
    use std::string::{Self};
    use sui::url;
    use sui::transfer;
    use sui::tx_context::{Self};
    use std::ascii;
    use std::option;
    use std::string::{String};
    use std::vector::{Self};

    struct ASSET_TESTS has drop {}

    // Constants
    const EWrongTotalSupply: u64 = 1;
    const EWrongSupply: u64 = 2;
    const EWrongBalanceValue: u64 = 3;

    const ADMIN: address = @0xAAAA;
    const USER: address = @0xBBBB;

    // Functions
    #[test]
    fun test_create_new_asset() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);

        let total_supply = fnft_factory::total_supply(&asset_cap);
        let supply = fnft_factory::supply(&asset_cap);

        assert!(total_supply == 100, EWrongTotalSupply);
        assert!(supply == 0, EWrongSupply);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code=fnft_factory::EInsufficientTotalSupply)]
    fun test_create_new_asset_with_insufficient_total_supply() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 0, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        test_scenario::end(scenario);
    }


    #[test]
    fun test_mint_ft() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);

        let keys = vector::empty<String>();
        let values = vector::empty<String>();

        let ft = fnft_factory::mint(&mut asset_cap, keys, values, 1, ctx);
        let value = fnft_factory::value(&ft);

        assert!(value == 1, EWrongBalanceValue);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(ft, USER);
        test_scenario::end(scenario);
    }


    #[test]
    #[expected_failure(abort_code=fnft_factory::ENoSupply)]
    fun test_no_supply_to_mint() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 5, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, ctx);

        let keys = vector::empty<String>();
        let values = vector::empty<String>();

        let ft = fnft_factory::mint(&mut asset_cap, keys, values, 6, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(ft, USER);
        test_scenario::end(scenario);
    }


    #[test]
    fun test_mint_nft() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);

        let (keys, values) = create_vectors();

        let nft = fnft_factory::mint(&mut asset_cap, keys, values, 1, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(nft, USER);
        test_scenario::end(scenario);
    }


   #[test]
   #[expected_failure(abort_code=fnft_factory::EUniqueAsset)]
    fun test_mint_non_unit_nft() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, ctx);

        let (keys, values) = create_vectors();

        let nft = fnft_factory::mint(&mut asset_cap, keys, values, 5, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(nft, USER);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_split_fts() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, ctx);

        let keys = vector::empty<String>();
        let values = vector::empty<String>();

        let ft = fnft_factory::mint(&mut asset_cap, keys, values, 5, ctx);

        let new_tokenized_asset = fnft_factory::split(&mut ft, 3, ctx);

        let ft_decreased_balance = fnft_factory::value(&ft);
        let new_tokenized_asset_balance = fnft_factory::value(&new_tokenized_asset);

        assert!(ft_decreased_balance == 2, EWrongBalanceValue);
        assert!(new_tokenized_asset_balance == 3, EWrongBalanceValue);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(ft, USER);
        transfer::public_transfer(new_tokenized_asset, USER);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code=fnft_factory::EInsufficientBalance)]
        fun test_split_fts_with_insufficient_balance() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);
        
        let keys = vector::empty<String>();
        let values = vector::empty<String>();

        let ft = fnft_factory::mint(&mut asset_cap, keys, values, 3, ctx);

        let new_tokenized_asset = fnft_factory::split(&mut ft, 5, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(ft, USER);
        transfer::public_transfer(new_tokenized_asset, USER);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code=fnft_factory::EUniqueAsset)]
        fun test_split_nfts() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);
        
        let (keys, values) = create_vectors();

        let nft = fnft_factory::mint(&mut asset_cap, keys, values, 1, ctx);

        let new_tokenized_asset = fnft_factory::split(&mut nft, 1, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(nft, USER);
        transfer::public_transfer(new_tokenized_asset, USER);
        test_scenario::end(scenario);
    }


    #[test]
    fun test_join_fts() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);

        let keys = vector::empty<String>();
        let values = vector::empty<String>();

        let ft1 = fnft_factory::mint(&mut asset_cap, keys, values, 2, ctx);
        let ft2 = fnft_factory::mint(&mut asset_cap, keys, values, 3, ctx);

        fnft_factory::join(&mut ft1, ft2);

        let joined_balance = fnft_factory::value(&ft1);
        assert!(joined_balance == 5, EWrongBalanceValue);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(ft1, USER);
        test_scenario::end(scenario);
    }


    #[test]
    #[expected_failure(abort_code=fnft_factory::EUniqueAsset)]
        fun test_join_nfts() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);
        
        let (keys1, values1) = create_vectors();
        let nft1 = fnft_factory::mint(&mut asset_cap, keys1, values1, 1, ctx);

        let (keys2, values2) = create_vectors();
        let nft2 = fnft_factory::mint(&mut asset_cap, keys2, values2, 1, ctx);

        fnft_factory::join(&mut nft1, nft2);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(nft1, USER);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_burn() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, ctx);

        let keys = vector::empty<String>();
        let values = vector::empty<String>();
        let tokenized_asset = fnft_factory::mint(&mut asset_cap, keys, values, 1, ctx);

        fnft_factory::burn(&mut asset_cap, tokenized_asset);

        let supply = fnft_factory::supply(&asset_cap);
        assert!(supply == 0, EWrongSupply);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        test_scenario::end(scenario);
    }


    #[test]
    #[expected_failure(abort_code=fnft_factory::ENonBurnable)]
    fun test_burn_unburnable() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, ctx);

        let keys = vector::empty<String>();
        let values = vector::empty<String>();
        let tokenized_asset = fnft_factory::mint(&mut asset_cap, keys, values, 1, ctx);

        fnft_factory::burn(&mut asset_cap, tokenized_asset);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code=fnft_factory::EVecLengthMismatch)]
    fun test_create_vec_map_from_arrays() {
        let (keys, values) = create_vectors();
        vector::push_back(&mut values, string::utf8(b"No"));

        let _vec_map = fnft_factory::create_vec_map_from_arrays(keys, values);
    }


    // Helper function: create key value vectors
    fun create_vectors(): (vector<String>, vector<String>) {

        let keys = vector[
            string::utf8(b"Piece"),
            string::utf8(b"Is it Amazing?"),
            string::utf8(b"In a scale from 1 to 10, how good?"),
        ];

        let values = vector[
            string::utf8(b"1/100"),
            string::utf8(b"Yes"),
            string::utf8(b"11"),
        ];

        (keys, values)
    }
}