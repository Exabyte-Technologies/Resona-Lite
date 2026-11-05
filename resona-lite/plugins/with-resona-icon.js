const path = require('node:path');
const { withFinalizedMod, XML } = require('expo/config-plugins');

module.exports = config => {
  if (!config.android?.adaptiveIcon) return config;

  return withFinalizedMod(config, ['android', async config => {
    // Adaptive foregrounds occupy a 108-unit layer, but launchers display its
    // central 72 units. Fit the complete iOS artwork in that visible area so
    // Android preserves its existing margins instead of enlarging the mark.
    const inset = `${(1 - 72 / 108) / 2 * 100}%`;
    for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
      const file = path.join(config.modRequest.platformProjectRoot,
        'app/src/main/res/mipmap-anydpi-v26', name);
      const xml = await XML.readXMLAsync({ path: file });
      const icon = xml['adaptive-icon'];
      const foreground = icon.foreground[0];
      const drawable = foreground.$?.['android:drawable'] ??
        foreground.inset?.[0].$?.['android:drawable'];
      if (!drawable) throw new Error(`Missing adaptive icon foreground in ${name}`);
      icon.foreground[0] = {
        inset: [{ $: {
          'android:drawable': drawable,
          'android:insetLeft': inset,
          'android:insetTop': inset,
          'android:insetRight': inset,
          'android:insetBottom': inset,
        } }],
      };
      await XML.writeXMLAsync({ path: file, xml });
    }
    return config;
  }]);
};
