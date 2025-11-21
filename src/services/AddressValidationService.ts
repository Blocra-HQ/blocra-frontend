/**
 * Address Validation Service
 * Provides chain-aware address validation for different blockchain types
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export type ChainType = 'evm' | 'starknet' | 'solana' | 'cosmos' | 'substrate';

/**
 * Validates a blockchain address based on the chain type
 * @param address - The address to validate
 * @param chainType - The blockchain type
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateAddress(address: string, chainType: ChainType): ValidationResult {
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
        return {
            isValid: false,
            error: 'Address cannot be empty'
        };
    }

    switch (chainType) {
        case 'evm':
            return validateEvmAddress(trimmedAddress);

        case 'starknet':
            return validateStarknetAddress(trimmedAddress);

        case 'solana':
            return validateSolanaAddress(trimmedAddress);

        case 'cosmos':
            return validateCosmosAddress(trimmedAddress);

        case 'substrate':
            return validateSubstrateAddress(trimmedAddress);

        default:
            return {
                isValid: false,
                error: `Unsupported chain type: ${chainType}`
            };
    }
}

/**
 * Validates EVM-compatible address (Ethereum, BSC, Polygon, etc.)
 * Format: 0x + 40 hexadecimal characters (20 bytes)
 */
function validateEvmAddress(address: string): ValidationResult {
    if (!address.startsWith('0x')) {
        return {
            isValid: false,
            error: 'EVM address must start with 0x. Example: 0x3ca17667BBFC93db8bf2866E167C784B33220ACA'
        };
    }

    if (address.length !== 42) {
        return {
            isValid: false,
            error: `EVM address must be 42 characters (0x + 40 hex characters). Got ${address.length} characters.`
        };
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        return {
            isValid: false,
            error: 'EVM address must contain only hexadecimal characters (0-9, a-f, A-F)'
        };
    }

    return { isValid: true };
}

/**
 * Validates Starknet address
 * Format: 0x + up to 64 hexadecimal characters (felt252)
 */
function validateStarknetAddress(address: string): ValidationResult {
    if (!address.startsWith('0x')) {
        return {
            isValid: false,
            error: 'Starknet address must start with 0x'
        };
    }

    // Starknet addresses can be 1-64 hex characters after 0x
    if (address.length < 3 || address.length > 66) {
        return {
            isValid: false,
            error: `Starknet address must be between 3 and 66 characters. Got ${address.length} characters.`
        };
    }

    if (!/^0x[0-9a-fA-F]{1,64}$/.test(address)) {
        return {
            isValid: false,
            error: 'Starknet address must contain only hexadecimal characters (0-9, a-f, A-F)'
        };
    }

    return { isValid: true };
}

/**
 * Validates Solana address
 * Format: Base58 encoded, typically 32-44 characters
 */
function validateSolanaAddress(address: string): ValidationResult {
    // Solana addresses should not start with 0x
    if (address.startsWith('0x')) {
        return {
            isValid: false,
            error: 'Solana addresses do not start with 0x. They are Base58 encoded strings.'
        };
    }

    // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    // (excludes 0, O, I, l to avoid confusion)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    if (!base58Regex.test(address)) {
        return {
            isValid: false,
            error: 'Invalid Solana address format. Must be 32-44 Base58 characters. Example: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        };
    }

    return { isValid: true };
}

/**
 * Validates Cosmos-based address (Cosmos Hub, Osmosis, etc.)
 * Format: Bech32 encoded with chain-specific prefix
 */
function validateCosmosAddress(address: string): ValidationResult {
    // Common prefixes: cosmos, osmo, juno, evmos, etc.
    const bech32Regex = /^[a-z]+1[a-z0-9]{38,58}$/;

    if (!bech32Regex.test(address)) {
        return {
            isValid: false,
            error: 'Invalid Cosmos address format. Must be Bech32 encoded (e.g., cosmos1..., osmo1...)'
        };
    }

    return { isValid: true };
}

/**
 * Validates Substrate-based address (Polkadot, Kusama, etc.)
 * Format: SS58 encoded
 */
function validateSubstrateAddress(address: string): ValidationResult {
    // SS58 addresses typically start with 1-5, and are 47-48 characters
    // This is a simplified validation
    const ss58Regex = /^[1-5][1-9A-HJ-NP-Za-km-z]{46,47}$/;

    if (!ss58Regex.test(address)) {
        return {
            isValid: false,
            error: 'Invalid Substrate address format. Must be SS58 encoded.'
        };
    }

    return { isValid: true };
}

/**
 * Get a user-friendly placeholder example for the given chain type
 */
export function getAddressPlaceholder(chainType: ChainType): string {
    switch (chainType) {
        case 'evm':
            return '0x3ca17667BBFC93db8bf2866E167C784B33220ACA';

        case 'starknet':
            return '0x07070d915635269ea0930fa1c538f2d026e02e5078884aeb007141c39f481eee';

        case 'solana':
            return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

        case 'cosmos':
            return 'cosmos1...';

        case 'substrate':
            return '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

        default:
            return 'Enter address...';
    }
}

/**
 * Get chain-specific address format description
 */
export function getAddressFormatDescription(chainType: ChainType): string {
    switch (chainType) {
        case 'evm':
            return 'EVM addresses are 42 characters: 0x followed by 40 hexadecimal characters';

        case 'starknet':
            return 'Starknet addresses are 0x followed by up to 64 hexadecimal characters';

        case 'solana':
            return 'Solana addresses are 32-44 Base58 encoded characters (no 0x prefix)';

        case 'cosmos':
            return 'Cosmos addresses are Bech32 encoded with chain prefix (e.g., cosmos1...)';

        case 'substrate':
            return 'Substrate addresses are SS58 encoded, typically 47-48 characters';

        default:
            return 'Enter a valid blockchain address';
    }
}
