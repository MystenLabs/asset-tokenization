// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Template bytecode to use when working with (de)serialized bytecode.
module template::template {
    use sui::tx_context::TxContext;
    use asset_tokenization::fnft_factory;

    struct TEMPLATE has drop {}
    struct Template has store {}

    fun init(otw: TEMPLATE, ctx: &mut TxContext) {
        fnft_factory::claim_asset_type_proof<
            TEMPLATE,
            Template
        >(otw, ctx)
    }
}
