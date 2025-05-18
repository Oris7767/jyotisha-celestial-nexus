
/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Khai báo modules thiếu type definitions
declare module 'react/jsx-runtime';
declare module 'react-router-dom';
declare module '@tanstack/react-query';
declare module '@hookform/resolvers/zod';
declare module 'react-hook-form';

// Khai báo modules Radix UI
declare module '@radix-ui/react-accordion';
declare module '@radix-ui/react-alert-dialog';
declare module '@radix-ui/react-checkbox';
declare module '@radix-ui/react-collapsible';
declare module '@radix-ui/react-hover-card';
declare module '@radix-ui/react-label';
declare module '@radix-ui/react-popover';
declare module '@radix-ui/react-progress';
declare module '@radix-ui/react-radio-group';
declare module '@radix-ui/react-scroll-area';
declare module '@radix-ui/react-switch';
declare module '@radix-ui/react-tabs';
declare module '@radix-ui/react-toggle';
declare module '@radix-ui/react-toggle-group';
declare module '@radix-ui/react-tooltip';

// Đảm bảo TypeScript hiểu được JSX cho React
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
