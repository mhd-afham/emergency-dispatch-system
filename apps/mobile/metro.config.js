const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the workspace
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPath = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Configure Metro to resolve modules from workspace packages
config.resolver.disableHierarchicalLookup = false;

// 4. Add support for workspace protocol
config.resolver.unstable_enablePackageExports = true;

// 5. Enable symlinks for workspace packages
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
