export const NATIVE_ASSET_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface PaymentAssetConfig {
  symbol: string;
  kind: "native" | "trust-backed-asset";
  decimals: number;
  contractAddress: string;
  assetId?: number;
}

export interface SwitchboardTargetConfig {
  name: string;
  label: string;
  /** Backend the target talks to. Defaults to "hub" (EVM/revive) when omitted. */
  kind?: "hub" | "parachain";
  /** Hub EVM JSON-RPC. Required for hub targets; absent for parachain targets. */
  defaultEthRpcUrl?: string;
  defaultSubstrateWsUrl?: string;
  expectedChainId?: bigint;
  /** PROOF Ingress parachain WebSocket endpoint (parachain targets only). */
  defaultParachainWsUrl?: string;
  /** SS58 address format for parachain signing/display (parachain targets only). */
  ss58Format?: number;
  nativeSymbol: string;
  nativeDecimals: number;
  requiresExplicitPaymentAmount: boolean;
  assets: PaymentAssetConfig[];
}

export const HUB_USDC: PaymentAssetConfig = {
  symbol: "USDC",
  kind: "trust-backed-asset",
  assetId: 1337,
  decimals: 6,
  contractAddress: "0x0000053900000000000000000000000001200000"
};

export const HUB_USDT: PaymentAssetConfig = {
  symbol: "USDt",
  kind: "trust-backed-asset",
  assetId: 1984,
  decimals: 6,
  contractAddress: "0x000007C000000000000000000000000001200000"
};

export const HUB_DOT: PaymentAssetConfig = {
  symbol: "DOT",
  kind: "native",
  decimals: 10,
  contractAddress: NATIVE_ASSET_ADDRESS
};

export const SWITCHBOARD_TARGETS: Record<string, SwitchboardTargetConfig> = {
  "revive-local": {
    name: "revive-local",
    label: "Local revive dev node",
    defaultEthRpcUrl: "http://127.0.0.1:8545",
    defaultSubstrateWsUrl: "ws://127.0.0.1:9944",
    nativeSymbol: "DOT",
    nativeDecimals: 10,
    requiresExplicitPaymentAmount: false,
    assets: [HUB_USDC, HUB_USDT]
  },
  "polkadot-hub-testnet": {
    name: "polkadot-hub-testnet",
    label: "Polkadot Hub TestNet",
    defaultEthRpcUrl: "https://services.polkadothub-rpc.com/testnet",
    defaultSubstrateWsUrl: "wss://asset-hub-paseo-rpc.n.dwellir.com",
    expectedChainId: 420420417n,
    nativeSymbol: "PAS",
    nativeDecimals: 10,
    requiresExplicitPaymentAmount: true,
    assets: [HUB_USDC, HUB_USDT]
  },
  "polkadot-hub": {
    name: "polkadot-hub",
    label: "Polkadot Hub",
    defaultEthRpcUrl: "https://services.polkadothub-rpc.com/mainnet",
    defaultSubstrateWsUrl: "wss://polkadot-asset-hub-rpc.polkadot.io",
    expectedChainId: 420420419n,
    nativeSymbol: "DOT",
    nativeDecimals: 10,
    requiresExplicitPaymentAmount: true,
    assets: [HUB_USDC, HUB_USDT]
  },
  "proof-ingress-local": {
    name: "proof-ingress-local",
    label: "PROOF Ingress local dev parachain",
    kind: "parachain",
    defaultParachainWsUrl: "ws://127.0.0.1:9944",
    ss58Format: 42,
    nativeSymbol: "UNIT",
    nativeDecimals: 12,
    requiresExplicitPaymentAmount: false,
    assets: []
  },
  // TODO: fill defaultParachainWsUrl + ss58Format once the public PROOF Ingress
  // parachain endpoints are live.
  "proof-ingress-testnet": {
    name: "proof-ingress-testnet",
    label: "PROOF Ingress TestNet parachain",
    kind: "parachain",
    defaultParachainWsUrl: "",
    ss58Format: 42,
    nativeSymbol: "UNIT",
    nativeDecimals: 12,
    requiresExplicitPaymentAmount: false,
    assets: []
  },
  "proof-ingress": {
    name: "proof-ingress",
    label: "PROOF Ingress parachain",
    kind: "parachain",
    defaultParachainWsUrl: "",
    ss58Format: 42,
    nativeSymbol: "UNIT",
    nativeDecimals: 12,
    requiresExplicitPaymentAmount: false,
    assets: []
  }
};

export function getSwitchboardTarget(name: string): SwitchboardTargetConfig {
  const target = SWITCHBOARD_TARGETS[name];
  if (!target) {
    throw new Error(`Unknown SWITCHBOARD_TARGET "${name}". Supported targets: ${Object.keys(SWITCHBOARD_TARGETS).join(", ")}`);
  }

  return target;
}

/** True when the target is the PROOF Ingress parachain backend (vs Hub EVM). */
export function isParachainTarget(target: SwitchboardTargetConfig): boolean {
  return target.kind === "parachain";
}
