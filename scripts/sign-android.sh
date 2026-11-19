#!/usr/bin/env bash
# Crea (si no existe) una llave privada de firma y la conecta a Gradle en modo Release.
# Ejecutar después de `expo prebuild`. La keystore y keystore.properties NO se versionan.
set -e
cd "$(dirname "$0")/../mobile/android"
KS=app/lifesync-release.keystore
if [ ! -f "$KS" ]; then
  PASS=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)
  keytool -genkeypair -storetype PKCS12 -keystore "$KS" -alias lifesync -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" -dname "CN=LifeSync, OU=Mobile, O=LifeSync, C=MX"
  printf "storeFile=lifesync-release.keystore\nstorePassword=%s\nkeyAlias=lifesync\nkeyPassword=%s\n" "$PASS" "$PASS" > keystore.properties
  chmod 600 keystore.properties "$KS"
fi
python3 - <<'PY'
import re
p = 'app/build.gradle'
s = open(p).read()
if 'keystore.properties' not in s:
    s = s.replace("android {", """def ksProps = new Properties()
def ksFile = rootProject.file('keystore.properties')
if (ksFile.exists()) { ksFile.withInputStream { ksProps.load(it) } }

android {""", 1)
    s = s.replace("    signingConfigs {", """    signingConfigs {
        release {
            storeFile file(ksProps['storeFile'])
            storePassword ksProps['storePassword']
            keyAlias ksProps['keyAlias']
            keyPassword ksProps['keyPassword']
        }""", 1)
    i = s.index("buildTypes {")
    j = s.index("release {", i)
    s = s[:j] + s[j:].replace("signingConfig signingConfigs.debug", "signingConfig signingConfigs.release", 1)
    open(p, 'w').write(s)
PY
echo "Firma Release configurada con $KS"
