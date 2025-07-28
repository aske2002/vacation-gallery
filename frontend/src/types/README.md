# Noise-C.wasm TypeScript Types

This directory contains comprehensive TypeScript type definitions for the `noise-c.wasm` library, which provides WebAssembly bindings for the Noise Protocol implementation.

## Files

- `noise-c.d.ts` - Complete type definitions for the noise-c.wasm library
- `../examples/noise-examples.ts` - Comprehensive usage examples with full type safety

## Overview

The `noise-c.wasm` library provides a JavaScript/TypeScript interface to the Noise Protocol, which is a framework for building crypto protocols. The library includes:

- **CipherState**: Symmetric encryption/decryption
- **SymmetricState**: Key derivation and authenticated encryption
- **HandshakeState**: Noise protocol handshake management
- **CreateKeyPair**: Key pair generation for Curve25519 and Curve448
- **Constants**: All protocol constants (ciphers, hashes, curves, actions, errors)

## Key Features

### Type Safety
- Full TypeScript support with comprehensive interfaces
- Proper typing for all parameters and return values
- Optional parameters correctly typed
- Union types for constants

### Memory Management
- All objects have `free()` methods to prevent memory leaks
- Clear documentation about when to call `free()`
- Automatic cleanup in error cases (where applicable)

### Error Handling
- Typed error constants
- Proper error propagation
- Clear error messages matching the C library constants

## Usage Examples

### Basic Initialization
```typescript
import createNoise, { NoiseLibrary } from 'noise-c.wasm';

const noise = await new Promise<NoiseLibrary>((resolve) => {
  createNoise((noise) => resolve(noise));
});
```

### Key Pair Generation
```typescript
const [privateKey, publicKey] = noise.CreateKeyPair(noise.constants.NOISE_DH_CURVE25519);
```

### Handshake Setup
```typescript
const handshake = new noise.HandshakeState(
  'Noise_XX_25519_ChaChaPoly_BLAKE2b',
  noise.constants.NOISE_ROLE_INITIATOR
);

handshake.Initialize(null, privateKey);
```

### Encryption/Decryption
```typescript
const cipher = new noise.CipherState(noise.constants.NOISE_CIPHER_CHACHAPOLY);
cipher.InitializeKey(key);

const ciphertext = cipher.EncryptWithAd(ad, plaintext);
const decrypted = cipher.DecryptWithAd(ad, ciphertext);
```

## Constants

The library provides all necessary constants:

### Ciphers
- `NOISE_CIPHER_CHACHAPOLY` - ChaCha20-Poly1305
- `NOISE_CIPHER_AESGCM` - AES-GCM

### Hashes
- `NOISE_HASH_BLAKE2s` - BLAKE2s
- `NOISE_HASH_BLAKE2b` - BLAKE2b
- `NOISE_HASH_SHA256` - SHA-256
- `NOISE_HASH_SHA512` - SHA-512

### Curves
- `NOISE_DH_CURVE25519` - Curve25519
- `NOISE_DH_CURVE448` - Curve448

### Roles
- `NOISE_ROLE_INITIATOR` - Handshake initiator
- `NOISE_ROLE_RESPONDER` - Handshake responder

### Actions
- `NOISE_ACTION_WRITE_MESSAGE` - Ready to write message
- `NOISE_ACTION_READ_MESSAGE` - Ready to read message
- `NOISE_ACTION_SPLIT` - Ready to split into cipher states
- `NOISE_ACTION_FAILED` - Handshake failed

## Protocol Names

Common protocol names follow the format: `Noise_PATTERN_DH_CIPHER_HASH`

Examples:
- `Noise_N_25519_ChaChaPoly_BLAKE2b`
- `Noise_X_25519_ChaChaPoly_BLAKE2b`
- `Noise_XX_25519_ChaChaPoly_BLAKE2b`
- `Noise_IK_25519_ChaChaPoly_BLAKE2b`

## Memory Management

⚠️ **Important**: Always call `free()` on objects when you're done with them to prevent memory leaks:

```typescript
const handshake = new noise.HandshakeState(protocol, role);
// ... use handshake ...
handshake.free(); // Don't forget this!
```

For automatic cleanup, consider using a wrapper:

```typescript
function withHandshake<T>(
  noise: NoiseLibrary,
  protocol: string,
  role: number,
  fn: (handshake: HandshakeState) => T
): T {
  const handshake = new noise.HandshakeState(protocol, role);
  try {
    return fn(handshake);
  } finally {
    handshake.free();
  }
}
```

## Error Handling

The library throws errors with messages that match the constant names:

```typescript
try {
  handshake.WriteMessage();
} catch (error) {
  if (error.message === 'NOISE_ERROR_INVALID_STATE') {
    // Handle invalid state error
  }
}
```

## Examples

See `../examples/noise-examples.ts` for comprehensive usage examples including:
- Basic initialization
- Key pair generation
- Handshake patterns
- Encryption/decryption
- Error handling
- Memory management

## Contributing

When updating these types:

1. Check the actual JavaScript implementation in `node_modules/noise-c.wasm/src/index.js`
2. Verify constants in `node_modules/noise-c.wasm/src/constants.js`
3. Update the type definitions accordingly
4. Add examples for new functionality
5. Test with TypeScript compilation

## References

- [Noise Protocol Specification](https://noiseprotocol.org/noise.html)
- [noise-c.wasm GitHub Repository](https://github.com/nazar-pc/noise-c.wasm)
- [Original noise-c Library](https://github.com/rweather/noise-c)
