#!/bin/bash

# check dependencies are available.
for i in jq sui; do
  if ! command -V ${i} 2>/dev/null; then
    echo "${i} is not installed"
    exit 1
  fi
done

# default network is localnet
NETWORK=http://localhost:9000

# If otherwise specified chose testnet or devnet
if [ $# -ne 0 ]; then
 if [ $1 = "mainnet" ]; then
    NETWORK="https://fullnode.mainnet.sui.io:443"
  fi
  if [ $1 = "testnet" ]; then
    NETWORK="https://fullnode.testnet.sui.io:443"
  fi
  if [ $1 = "devnet" ]; then
    NETWORK="https://fullnode.devnet.sui.io:443"
  fi
fi

publish_res=$(sui client publish --gas-budget 200000000 --json ../move/asset_tokenization)

echo ${publish_res} >.publish.res.json

if [[ "$publish_res" =~ "error" ]]; then
  # If yes, print the error message and exit the script
  echo "Error during move contract publishing.  Details : $publish_res"
  exit 1
fi
echo "Contract Deployment finished!"

echo "Setting up environmental variables..."
ASSET_TOKENIZATION_PACKAGE_ID=$(echo "${publish_res}" | jq -r '.effects.created[] | select(.owner == "Immutable").reference.objectId')
newObjs=$(echo "$publish_res" | jq -r '.objectChanges[] | select(.type == "created")')
UPGRADE_CAP_ID=$(echo "$newObjs" | jq -r 'select (.objectType | contains("::package::UpgradeCap")).objectId')
REGISTRY=$(echo "$newObjs" | jq -r 'select (.objectType | contains("::proxy::Registry")).objectId')

cat >.env <<-ENV
SUI_NETWORK=$NETWORK
ASSET_TOKENIZATION_PACKAGE_ID=$ASSET_TOKENIZATION_PACKAGE_ID
REGISTRY=$REGISTRY

TEMPLATE_PACKAGE_ID="Created by publishing \`template\` package"
ASSET_CAP_ID="Created by publishing \`template\` package"
ASSET_METADATA_ID="Created by publishing \`template\` package"
ASSET_PUBLISHER="Created by publishing \`template\` package"

PROTECTED_TP="Created by calling \`setup_tp\` function"
TRANSFER_POLICY="Created by calling \`setup_tp\` function"

OWNER_MNEMONIC_PHRASE=$OWNER_MNEMONIC_PHRASE
BUYER_MNEMONIC_PHRASE=$BUYER_MNEMONIC_PHRASE
TARGET_KIOSK="kiosk id"
BUYER_KIOSK="kiosk id"

TOKENIZED_ASSET="tokenized asset id (created by minting)"
FT1="tokenized asset id (to be joined)"
FT2="tokenized asset id (to be joined)"
ENV

echo "Installing dependencies..."
npm install