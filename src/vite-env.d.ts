
/// <reference types="vite/client" />

// Khai báo modules thiếu type definitions
declare module 'react/jsx-runtime';
declare module 'react-router-dom';
declare module '@tanstack/react-query';
declare module '@hookform/resolvers/zod';
declare module 'react-hook-form';

// Đảm bảo TypeScript hiểu được JSX cho React
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
