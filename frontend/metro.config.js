const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// // Exclude unnecessary directories from file watching
// config.watchFolders = [__dirname];
// config.resolver.blacklistRE = /(.*)\/(__tests__|android|ios|build|dist|.git|node_modules\/.*\/android|node_modules\/.*\/ios|node_modules\/.*\/windows|node_modules\/.*\/macos)(\/.*)?$/;

// // Alternative: use a more aggressive exclusion pattern
// config.resolver.blacklistRE = /node_modules\/.*\/(android|ios|windows|macos|__tests__|\.git|.*\.android\.js|.*\.ios\.js)$/;

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

// Exclude react-native-google-mobile-ads on web platform
const originalResolver = config.resolver.resolverMainFields;
config.resolver.resolverMainFields = ['browser', 'main'];

// Platform-specific configuration
config.resolver.platforms = ['web', 'ios', 'android'];

// Custom resolver to handle AdMob on web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-google-mobile-ads') {
    // Return a mock module path for web
    return {
      type: 'empty',
    };
  }
  
  // Default resolve for other cases
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
