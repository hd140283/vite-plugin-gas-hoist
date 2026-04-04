import { sayHello } from './say-hello.js';

// Exported functions are hoisted to the global scope by vite-plugin-gas-hoist.
// Internal helpers (e.g. greet) are NOT hoisted — only entry point exports are.
export { sayHello };
