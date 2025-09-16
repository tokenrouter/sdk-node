/**
 * ES Module wrapper for TokenRouter SDK
 * This file ensures clean ES module imports work properly
 */
import pkg from '../dist/index.js';

// Extract the TokenRouter class from the CommonJS export
const TokenRouter = pkg.TokenRouter || pkg.default?.TokenRouter || pkg.default;

// Re-export everything
export * from '../dist/index.js';

// Default export for clean imports (like OpenAI SDK)
export default TokenRouter;