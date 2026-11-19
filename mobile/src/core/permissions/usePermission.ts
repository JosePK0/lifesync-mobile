import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { fromOsStatus, PermissionState, transition } from './permissionMachine';

export type PermissionKind = 'camera' | 'location' | 'notifications';
type OsResponse = { status: string; canAskAgain: boolean };

const osApi: Record<PermissionKind, { get: () => Promise<OsResponse>; request: () => Promise<OsResponse> }> = {
  camera: { get: () => Camera.getCameraPermissionsAsync(), request: () => Camera.requestCameraPermissionsAsync() },
  location: { get: () => Location.getForegroundPermissionsAsync(), request: () => Location.requestForegroundPermissionsAsync() },
  notifications: {
    get: () => Notifications.getPermissionsAsync() as unknown as Promise<OsResponse>,
    request: () => Notifications.requestPermissionsAsync() as unknown as Promise<OsResponse>,
  },
};

/** Hook que expone la máquina de estados del permiso; nunca lanza excepciones. */
export function usePermission(kind: PermissionKind) {
  const [state, setState] = useState<PermissionState>('undetermined');

  const refresh = useCallback(async () => {
    try {
      const r = await osApi[kind].get();
      if (r.status === 'granted') setState('granted');
      else if (r.status !== 'undetermined') setState(r.canAskAgain ? 'denied' : 'blocked');
      else setState('undetermined');
    } catch {
      /* el estado queda como está */
    }
  }, [kind]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const request = useCallback(async (): Promise<PermissionState> => {
    setState((s) => transition(s, 'REQUEST'));
    let next: PermissionState;
    try {
      const r = await osApi[kind].request();
      next = transition('requesting', fromOsStatus(r.status, r.canAskAgain));
    } catch {
      next = 'denied';
    }
    setState(next);
    return next;
  }, [kind]);

  const openSettings = useCallback(() => Linking.openSettings(), []);
  return { state, request, refresh, openSettings };
}
