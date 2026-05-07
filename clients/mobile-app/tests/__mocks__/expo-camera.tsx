import React from 'react';
import { View } from 'react-native';

export function CameraView(props: any) {
  return <View testID="mock-camera-view" {...props} />;
}

export function useCameraPermissions() {
  return [
    { granted: true },
    async () => ({ granted: true }),
  ] as const;
}
