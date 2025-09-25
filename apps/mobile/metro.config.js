const { getDefaultConfig } = require("@expo/metro-config");

// Get the default Metro configuration
const config = getDefaultConfig(__dirname);

// Since we're using isolated apps without shared packages,
// we can use the standard Metro configuration
module.exports = config;
