module fnft_template::fnft_genesis {

    // Sui imports
    use sui::tx_context::{ TxContext};
    use sui::package::{ Self };

    struct FNFT_GENESIS has drop {}

    fun init (otw: FNFT_GENESIS, ctx: &mut TxContext){
        package::claim_and_keep(otw, ctx);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(FNFT_GENESIS{}, ctx);
    }
}