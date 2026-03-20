import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'today-to-do',
  brand: {
    displayName: '오늘할일',
    primaryColor: '#3182f6',
    icon: 'https://today-todo-sigma.vercel.app/logo.png',
  },
  permissions: [],
  navigationBar: {
    withBackButton: false,
    withHomeButton: false,
  },
  webViewProps: {
    type: 'partner',
    allowsBackForwardNavigationGestures: false,
  },
  web: {
    port: 5174,
    commands: {
      dev: 'npm run dev',
      build: 'npm run build',
    },
  },
  outdir: 'dist',
});
