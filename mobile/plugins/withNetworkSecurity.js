// Plugin de configuración: bloquea todo tráfico HTTP sin cifrar.
//  - Android: res/xml/network_security_config.xml con cleartextTrafficPermitted="false"
//  - iOS: NSAppTransportSecurity (NSAllowsArbitraryLoads = false)
// Excepción SOLO en builds de desarrollo (APP_VARIANT != production): localhost/10.0.2.2 para `adb reverse`.
const { withAndroidManifest, withDangerousMod, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const isProd = () => process.env.APP_VARIANT === 'production';

function xml() {
  const dev = isProd()
    ? ''
    : `
    <!-- SOLO DESARROLLO: no se genera en builds de producción -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="false">10.0.2.2</domain>
    </domain-config>`;
  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>${dev}
</network-security-config>
`;
}

module.exports = (config) => {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'network_security_config.xml'), xml());
      return cfg;
    },
  ]);
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    app.$['android:usesCleartextTraffic'] = 'false';
    app.$['android:allowBackup'] = 'false';
    return cfg;
  });
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: false,
      ...(isProd() ? {} : { NSAllowsLocalNetworking: true }),
    };
    return cfg;
  });
  return config;
};
