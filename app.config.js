const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
const googleAndroidCertSha1 = process.env.GOOGLE_ANDROID_CERT_SHA1?.replace(/:/g, '').trim();

module.exports = {
  expo: {
    name: 'SafeWay',
    slug: 'safeway-fe-mobile',
    owner: 'gustavosptech',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'safeway',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.safeway.mobile',
    },
    android: {
      package: 'com.safeway.mobile',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      softwareKeyboardLayoutMode: 'pan',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-status-bar',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          backgroundColor: '#ffffff',
          resizeMode: 'contain',
          imageWidth: 200,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'O SafeWay precisa acessar suas fotos para o perfil.',
          cameraPermission: 'O SafeWay precisa da câmera para a foto de perfil.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'O SafeWay usa sua localização para mostrar a van no mapa durante a rota.',
        },
      ],
      ...(googleMapsApiKey
        ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
        : []),
    ],
    extra: {
      googleMaps: {
        ...(googleMapsApiKey ? { apiKey: googleMapsApiKey } : {}),
        ...(googleAndroidCertSha1 ? { androidCertSha1: googleAndroidCertSha1 } : {}),
      },
      eas: {
        projectId: '3f6f8e0b-8311-42ad-a9bd-e2f5b78c31a9',
      },
    },
  },
};
