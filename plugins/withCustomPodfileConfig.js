const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const modifyPodfile = (podfilePath) => {
  let podfileContents = fs.readFileSync(podfilePath, 'utf-8');
  
  // Modifica las líneas específicas para FirebaseAuth y FirebaseCore
  podfileContents = podfileContents.replace(
    /pod 'FirebaseAuth'/,
    `pod 'FirebaseAuth', :modular_headers => true`
  );
  podfileContents = podfileContents.replace(
    /pod 'FirebaseCore'/,
    `pod 'FirebaseCore', :modular_headers => true`
  );
  podfileContents = podfileContents.replace(
    /pod 'GoogleUtilities'/,
    `pod 'GoogleUtilities', :modular_headers => true`
  );
  
  fs.writeFileSync(podfilePath, podfileContents);
};

const withCustomPodfileConfig = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      modifyPodfile(podfilePath);
      return config;
    },
  ]);
};

module.exports = withCustomPodfileConfig;
