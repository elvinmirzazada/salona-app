# Salona App - React + TypeScript + Vite

Professional Beauty Business Management Platform - Frontend Application

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router DOM
- Axios

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
salona-app/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable components
│   ├── pages/       # Page components
│   ├── styles/      # CSS files
│   ├── config/      # Configuration files
│   ├── types/       # TypeScript types
│   ├── utils/       # Utility functions
│   ├── App.tsx      # Main app component
│   └── main.tsx     # Entry point
├── index.html
├── vite.config.ts
└── tsconfig.json
```

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_BASE_URL=http://127.0.0.1:8011/api
```

## API Integration

The app connects to the FastAPI backend running at `http://127.0.0.1:8011`

## Features

- Modern, responsive design
- Smooth animations and transitions
- Mobile-friendly navigation
- Dark/light mode support (coming soon)
- Internationalization support (coming soon)

## License

ISC

