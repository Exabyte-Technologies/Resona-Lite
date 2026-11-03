const { withInfoPlist } = require('expo/config-plugins');
module.exports = config => withInfoPlist(config, config => {
  const modes = config.modResults.UIBackgroundModes ?? [];
  config.modResults.UIBackgroundModes = [...new Set([...modes, 'audio'])];
  return config;
});
