import {
    TransactionBlock,
    normalizeSuiObjectId,
} from '@mysten/sui.js';
import { fromHEX } from '@mysten/bcs';
import { packageId, adminCap } from "./config";
import { getSigner } from "./helpers";
import { getBytecode } from './utils/bytecode-template';
import init, * as wasm from '../../move-binary-format';

const publishCollection = async () => {
    let signer = getSigner();
    let admin = await signer.getAddress();

    await init('move_binary_format_bg.wasm');
    // const template = getBytecode();
    // const compiledModule = new CompiledModule(JSON.parse(wasm.deserialize(template)))
    //     // In the template we have only one constant with value `10` with type `U32`
    //     // Please, look at the function description for more details and use with care.
    //     .updateConstant(0, totalSupply, '10', 'u32')
    //     .changeIdentifiers({
    //         template: moduleName,
    //         TEMPLATE: moduleName.toUpperCase(),
    //         Template: typeName[0].toUpperCase() + typeName.slice(1),
    //     });

    const bytesToPublish = getBytecode();

    const tx = new TransactionBlock();
    const [upgradeCap] = tx.publish({
        modules: [[...fromHEX(bytesToPublish)]],
        dependencies: [
            normalizeSuiObjectId('0x1'),
            normalizeSuiObjectId('0x2'),
            normalizeSuiObjectId(packageId),
        ],
    });

    tx.transferObjects([upgradeCap], tx.pure(admin, 'address'));


    try {
        let res = await signer.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            requestType: "WaitForLocalExecution",
            options: {
                showObjectChanges: true,
            },
        })

        console.log('Collection published!', JSON.stringify(res.objectChanges, null, 2));
    } catch (e) {
        console.error("Could not publish", e);
    }

};

publishCollection();