import { config } from "dotenv";

config({});
export const SUI_NETWORK = process.env.SUI_NETWORK!;
export const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS!;
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY!;

export const packageId = process.env.PACKAGE_ID!;
export const publisher = process.env.PUBLISHER_ID!;
export const adminPhrase = process.env.ADMIN_PHRASE!;

const keys = Object.keys(process.env);
console.log("env contains ADMIN_ADDRESS:", keys.includes("ADMIN_ADDRESS"));
console.log(
  "env contains ADMIN_SECRET_KEY:",
  keys.includes("ADMIN_SECRET_KEY")
);
