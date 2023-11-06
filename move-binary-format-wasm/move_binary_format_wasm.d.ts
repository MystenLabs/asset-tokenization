/* tslint:disable */
/* eslint-disable */
/**
* Get the version of the crate (useful for testing the package).
* @returns {string}
*/
export function version(): string;
/**
* Deserialize the bytecode into a JSON string.
* @param {string} binary
* @returns {any}
*/
export function deserialize(binary: string): any;
/**
* Perform an operation on a bytecode string - deserialize, patch the identifiers
* and serialize back to a bytecode string.
* @param {string} binary
* @param {any} map
* @returns {any}
*/
export function update_identifiers(binary: string, map: any): any;
/**
* Serialize the JSON module into a HEX string.
* @param {string} json_module
* @returns {any}
*/
export function serialize(json_module: string): any;
