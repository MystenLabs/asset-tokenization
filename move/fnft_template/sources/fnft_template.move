module fnft_template::fnft_template {

    // std lib imports
    use std::string::{Self};
    use std::ascii;
    use std::option;

    // Sui imports
    use asset_tokenization::core::{Self};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::url::{ Url };

    struct FNFT_TEMPLATE has drop {}

    const TOTAL_SUPPLY: u64 = 100;
    const BURNABLE: bool = false; 


    fun init (otw: FNFT_TEMPLATE, ctx: &mut TxContext){
        let (asset_cap, asset_metadata) = core::new_asset(
        otw, 
        TOTAL_SUPPLY, 
        ascii::string(b"Symbol"), 
        string::utf8(b"asset_name"), 
        string::utf8(b"description"), 
        option::none<Url>(), 
        BURNABLE,
        ctx
        );
        
        transfer::public_share_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx))
    }


    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(FNFT_TEMPLATE{}, ctx);
    }

}