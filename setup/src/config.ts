// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { config } from "dotenv";

config({ path: "../.env" });

export const packageId = process.env.PACKAGE_ID!;
export const publisher = process.env.PUBLISHER_ID!;
export const adminCap = process.env.ADMIN_CAP_ID!;
export const adminPhrase = process.env.ADMIN_PHRASE!;
export const SUI_NETWORK = process.env.SUI_NETWORK!;