// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Template bytecode to use when working with (de)serialized bytecode.
module template::template {
    use std::option::{some, none};
    use std::ascii;
    use std::string;

    use sui::url;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use asset_tokenization::fnft_factory;

    struct TEMPLATE has drop {}

    const TOTAL_SUPPLY: u64 = 100;
    const SYMBOL: vector<u8> = b"Symbol";
    const NAME: vector<u8> = b"Name";
    const DESCRIPTION: vector<u8> = b"Description";
    const ICON_URL: vector<u8> = b"icon_url";
    const BURNABLE: bool = true;

    fun init(otw: TEMPLATE, ctx: &mut TxContext) {
        
        let symbol = ascii::string(SYMBOL);
        let name = string::utf8(NAME);
        let description = string::utf8(DESCRIPTION);
        let icon_url = if (ICON_URL == b"") {
            none()
        } else {
            some(url::new_unsafe_from_bytes(ICON_URL))
        };

        let (asset_cap, asset_metadata) = fnft_factory::new_asset<TEMPLATE>(
            otw, 
            TOTAL_SUPPLY, 
            symbol,
            name,
            description,
            icon_url,
            BURNABLE,
            ctx
        );

        transfer::public_share_object(asset_metadata);
        transfer::public_transfer(asset_cap, tx_context::sender(ctx));
    }
}
