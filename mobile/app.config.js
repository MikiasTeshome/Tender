export default ({config}) => ({
  ...config,
  ios: {
    ...config.ios,
  },
  android: {
    ...config.android,
    ...(process.env.GOOGLE_SERVICES_JSON ? {googleServicesFile: process.env.GOOGLE_SERVICES_JSON} : {}),
  },
  extra: {
    ...config.extra,
    ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? {eas: {projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID}} : {}),
  },
});
