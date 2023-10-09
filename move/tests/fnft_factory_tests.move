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
    use sui::vec_map::{Self};


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
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, false, ctx);

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
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, false, ctx);

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
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, false, ctx);

        let ft = fnft_factory::mint_ft(&mut asset_cap, 1, ctx);
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
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, false, ctx);

        let ft = fnft_factory::mint_ft(&mut asset_cap, 6, ctx);

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
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, false, ctx);
        let metadata = vec_map::empty();
        vec_map::insert(&mut metadata, string::utf8(b"name"), string::utf8(b"tokenized asset"));
        vec_map::insert(&mut metadata, string::utf8(b"description"), string::utf8(b"description"));
        let nft = fnft_factory::mint_nft(&mut asset_cap, metadata, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(nft, USER);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_split_asset() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, false, ctx);

        let ft = fnft_factory::mint_ft(&mut asset_cap, 5, ctx);

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
    #[expected_failure(abort_code=fnft_factory::EUniqueAsset)]
        fun test_split_unique_asset() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, false, ctx);
        
        let metadata = vec_map::empty();
        vec_map::insert(&mut metadata, string::utf8(b"name"), string::utf8(b"tokenized asset"));
        vec_map::insert(&mut metadata, string::utf8(b"description"), string::utf8(b"description"));
        let nft = fnft_factory::mint_nft(&mut asset_cap, metadata, ctx);

        let new_tokenized_asset = fnft_factory::split(&mut nft, 1, ctx);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(nft, USER);
        transfer::public_transfer(new_tokenized_asset, USER);
        test_scenario::end(scenario);
    }


    #[test]
    fun test_join_asset() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, true, ctx);

        let ft1 = fnft_factory::mint_ft(&mut asset_cap, 2, ctx);
        let ft2 = fnft_factory::mint_ft(&mut asset_cap, 3, ctx);

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
        fun test_join_unique_asset() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, false, ctx);
        
        let metadata1 = vec_map::empty();
        vec_map::insert(&mut metadata1, string::utf8(b"name"), string::utf8(b"tokenized asset1"));
        vec_map::insert(&mut metadata1, string::utf8(b"description"), string::utf8(b"description"));
        let nft1 = fnft_factory::mint_nft(&mut asset_cap, metadata1, ctx);

        let metadata2 = vec_map::empty();
        vec_map::insert(&mut metadata2, string::utf8(b"name"), string::utf8(b"tokenized asset2"));
        vec_map::insert(&mut metadata2, string::utf8(b"description"), string::utf8(b"description"));
        let nft2 = fnft_factory::mint_nft(&mut asset_cap, metadata2, ctx);

        fnft_factory::join(&mut nft1, nft2);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        transfer::public_transfer(nft1, USER);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_burn_ft() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), false, true, ctx);

        let ft = fnft_factory::mint_ft(&mut asset_cap, 1, ctx);

        fnft_factory::burn(&mut asset_cap, ft);

        let supply = fnft_factory::supply(&asset_cap);
        assert!(supply == 0, EWrongSupply);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        test_scenario::end(scenario);
    }


    #[test]
    #[expected_failure(abort_code=fnft_factory::ENonBurnable)]
    fun test_burn_nft() {
        let scenario= test_scenario::begin(ADMIN);
        let test = &mut scenario;
        let ctx = test_scenario::ctx(test);
        let witness = ASSET_TESTS{};

        let (asset_cap, asset_metadata) = fnft_factory::new_asset(witness, 100, ascii::string(b"ASSET_TESTS"), 
            string::utf8(b"asset_name"), string::utf8(b"description"), option::some(url::new_unsafe_from_bytes(b"icon_url")), true, false, ctx);
        let metadata = vec_map::empty();
        vec_map::insert(&mut metadata, string::utf8(b"name"), string::utf8(b"tokenized asset"));
        vec_map::insert(&mut metadata, string::utf8(b"description"), string::utf8(b"description"));
        let nft = fnft_factory::mint_nft(&mut asset_cap, metadata, ctx);

        fnft_factory::burn(&mut asset_cap, nft);

        transfer::public_freeze_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
        test_scenario::end(scenario);
    }
}