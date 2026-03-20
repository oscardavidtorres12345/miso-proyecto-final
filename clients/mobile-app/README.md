# Mobile App — React Native 0.84.1

## Requisitos

| Herramienta     | Versión requerida       | Plataforma     |
|-----------------|-------------------------|----------------|
| Node.js         | >= 22 (v22.22.1)        | -  |
| npm             | >= 10                   | -  |
| Java (JDK)      | 17 o 22                 | Android        |
| Android SDK     | API 36                  | Android        |
| Gradle          | 8.13 (configurado)      | Android        |
| Xcode           | >= 15 (App Store)       | iOS            |
| CocoaPods       | >= 1.13                 | iOS            |
| Ruby            | >= 2.7 (incluido en macOS) | iOS          |

---

## Configuración inicial del entorno

### 1. Node.js con nvm

Este proyecto incluye un `.nvmrc` que fija la versión de Node. Instala y activa la versión correcta:

```bash
nvm install 22
nvm use
```

Para que `nvm use` se ejecute automáticamente al entrar a la carpeta, agrega esto a tu `~/.zshrc`:

```bash
autoload -U add-zsh-hook
load-nvmrc() {
  if [ -f .nvmrc ]; then nvm use; fi
}
add-zsh-hook chpwd load-nvmrc
```

### 2. Android SDK

El SDK debe estar en `~/Library/Android/sdk`. Agrega las siguientes variables de entorno a tu `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

Aplica los cambios:

```bash
source ~/.zshrc
```

### 3. Archivo local.properties

Crea el archivo `android/local.properties` (no se sube al repo, está en `.gitignore`):

```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### 4. Instalar dependencias

```bash
npm install
```

---

## Correr el proyecto en iOS

> **Requisito:** La ruta del repositorio **no debe contener espacios**. CocoaPods falla al descargar dependencias si la ruta tiene espacios (ej. `Proyecto final`). Usa un symlink si es necesario:
> ```bash
> ln -s "/ruta/con espacios/miso-proyecto-final" ~/miso-proyecto-final
> cd ~/miso-proyecto-final/clients/mobile-app
> ```

### Paso 1 — Configurar Xcode

Instala Xcode desde la App Store (~15GB), luego:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

### Paso 2 — Instalar CocoaPods >= 1.13

```bash
sudo gem install cocoapods
pod --version  # debe ser >= 1.13
```

### Paso 3 — Instalar dependencias iOS

```bash
cd ios && pod install && cd ..
```

Esto descarga los pods de React Native (~100MB la primera vez).

### Paso 4 — Iniciar Metro (en una terminal separada)

```bash
npm start
```

### Paso 5 — Compilar e instalar en simulador

```bash
npm run ios
```

---

## Correr el proyecto en Android

### Paso 1 — Iniciar un emulador

Verifica los emuladores disponibles:

```bash
emulator -list-avds
```

Inicia uno:

```bash
emulator -avd <nombre_del_avd>
```

O verifica dispositivos físicos conectados:

```bash
adb devices
```

### Paso 2 — Iniciar Metro (en una terminal separada)

```bash
npm start
```

### Paso 3 — Compilar e instalar en el dispositivo

```bash
npm run android
```

---

## Problemas conocidos y soluciones

### `Cannot find module './package.json'` al correr `npm start`
Los symlinks de `node_modules/.bin` se corrompieron (ocurre al copiar `node_modules`). Solución:
```bash
rm -rf node_modules && npm install
```

### `JvmVendorSpec IBM_SEMERU` — Build failed
Gradle 9 eliminó ese campo. El proyecto ya está configurado con Gradle 8.13 en `android/gradle/wrapper/gradle-wrapper.properties`. No cambiar esa versión.

### `SDK location not found`
Falta el archivo `android/local.properties`. Ver paso 3 de configuración inicial.

### `Qt library not found` al lanzar el emulador
Se está usando el binario equivocado. Usar siempre:
```bash
emulator -avd <nombre>
# no: ~/Library/Android/sdk/tools/emulator (obsoleto)
# sí: ~/Library/Android/sdk/emulator/emulator (correcto, vía PATH)
```

### `xcodebuild requires Xcode, but active directory is CommandLineTools`
Solo están instaladas las Command Line Tools, no Xcode completo. Instala Xcode desde la App Store y luego:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### `Invalid Podfile: undefined method 'visionos'`
CocoaPods es demasiado antiguo (< 1.13). Actualiza:
```bash
sudo gem install cocoapods
```

### `Unable to find a target named 'MobileApp' in MobileAppTemp.xcodeproj`
El Podfile hace referencia a un target que no existe en el proyecto Xcode. El target correcto es `MobileAppTemp`. El [Podfile](ios/Podfile#L17) ya está configurado correctamente con `target 'MobileAppTemp'`.

### `React-Core-prebuilt pod failed: bad component (expected absolute path)`
La ruta del proyecto contiene espacios. CocoaPods no soporta rutas con espacios. Ver la nota al inicio de la sección iOS sobre cómo usar un symlink.

### `xcodebuild failed to load a required plug-in`
Ocurre tras actualizar macOS o Xcode sin completar la configuración inicial. Solución:
```bash
sudo xcodebuild -runFirstLaunch
```
Si persiste:
```bash
sudo xcode-select --reset
```

### `iOS devices or simulators not detected`
No hay simuladores de iOS instalados. Instala uno desde Xcode → Settings → Platforms, o desde terminal:
```bash
xcodebuild -downloadPlatform iOS
```
Luego verifica los disponibles con `xcrun simctl list devices`.

### La primera compilación tarda mucho (10-20 min)
Es normal. Xcode compila todos los pods desde cero. Las compilaciones siguientes son mucho más rápidas gracias al caché.
