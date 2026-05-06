# Mobile App (Expo SDK 54)

App mobile en React Native con Expo (bare workflow), compatible con Expo Go `54.x`.

## Inicio rapido (Expo Go)

```bash
npm install
npm start
```

Abre Expo Go y escanea el QR.

## Requisitos minimos

- Node `>=20.19.4` (recomendado Node 22 LTS)
- npm `>=10`
- Android: JDK 17+, Android SDK y un emulador (o dispositivo fisico)
- iOS (solo macOS): Xcode 16+, CocoaPods 1.13+

## Comandos principales

```bash
# Desarrollo
npm start

# Build local nativa
npm run start:android
npm run start:ios

# Tests
npm run test:unit
npm run test:e2e:android
npm run test:e2e:ios
```

## Expo Go vs build nativo

- `npm start`: levanta el servidor de desarrollo de Expo.
- Expo usa Metro internamente como bundler.
- `npm run start:android` / `npm run start:ios`: compilan e instalan la app nativa localmente.

## E2E con Detox

Configuraciones definidas en `.detoxrc.js`:

- iOS simulador: `ios.sim.debug` (dispositivo `iPhone 17`)
- Android emulador: `android.emu.debug` (AVD `Pixel_9`)
- Android fisico: `android.att.debug`

Flujo recomendado:

1. Tener emulador/simulador disponible con esos nombres (o ajustar `.detoxrc.js`).
2. Ejecutar:

```bash
npm run test:e2e:android
# o
npm run test:e2e:ios
```

Estos scripts arrancan `npm start`, esperan `http://localhost:8081/status` y luego corren Detox.

## Troubleshooting breve

- `Project is incompatible with this version of Expo Go`
  - Verifica Expo Go `54.x` y `expo` en `package.json` (`~54.0.0`).

- `SDK location not found` (Android)
  - Crea `android/local.properties` con:
  ```bash
  echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
  ```

- `Cannot find module './package.json'` al correr scripts
  - Reinstala dependencias:
  ```bash
  rm -rf node_modules package-lock.json && npm install
  ```
