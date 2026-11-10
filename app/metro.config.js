// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Tokens e bairros vivem em ../shared e são usados pelo app e pela web.
const shared = path.resolve(__dirname, '../shared');
config.watchFolders = [...(config.watchFolders || []), shared];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  ...(config.resolver.nodeModulesPaths || []),
];

module.exports = config;
