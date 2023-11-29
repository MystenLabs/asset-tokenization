module template::template {

    // std lib imports
    use std::string::{Self};
    use std::ascii;
    use std::option;

    // Sui imports
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::url;

    // Asset tokenization imports
    use asset_tokenization::tokenized_asset::{Self};

    struct TEMPLATE has drop {}

    const TOTAL_SUPPLY: u64 = 100;
    const SYMBOL: vector<u8> = b"Symbol";
    const NAME: vector<u8> = b"Name";
    const DESCRIPTION: vector<u8> = b"Description";
    const ICON_URL: vector<u8> = b"icon_url";
    const BURNABLE: bool = true;

    fun init (otw: TEMPLATE, ctx: &mut TxContext){

        let icon_url = if (ICON_URL == b"") {
            option::none()
        } else {
            option::some(url::new_unsafe_from_bytes(ICON_URL))
        };

        let (asset_cap, asset_metadata) = tokenized_asset::new_asset(
            otw, 
            TOTAL_SUPPLY, 
            ascii::string(SYMBOL), 
            string::utf8(NAME), 
            string::utf8(DESCRIPTION), 
            icon_url, 
            BURNABLE,
            ctx
        );
        
        transfer::public_share_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx))
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(TEMPLATE{}, ctx);
    }

}