# Web App — React + TypeScript + Vite

Web application built with React 18, TypeScript, and Vite.

## Prerequisites

- [Node.js](https://nodejs.org) v22 (see [.nvmrc](.nvmrc))

If you use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm), run the following to switch to the correct version automatically:
```bash
nvm use
# or
fnm use
```

## Getting Started

**1. Install dependencies**
```bash
npm install
```

**2. Start the development server**
```bash
npm run dev
```

The server will be available at `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot-reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the code with ESLint |

## Tech Stack

- [React 18](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) with [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## ESLint Configuration

For production applications, it is recommended to enable type-aware lint rules. Update `eslint.config.js`:

```js
export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

Replace `tseslint.configs.recommended` with `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`.
