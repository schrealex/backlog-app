const { withGradleProperties } = require('@expo/config-plugins');

// React Native's Gradle plugin adds https://www.jitpack.io as a dependency
// repository by default. Gradle has to query it while resolving the version
// range that org.bouncycastle's POMs declare (pulled in by expo-updates),
// and JitPack occasionally times out on that metadata request, which fails
// the whole build. None of this app's dependencies need JitPack, so disable it.
module.exports = function withDisableJitpack(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'react.includeJitpackRepository',
      value: 'false',
    });
    return config;
  });
};
