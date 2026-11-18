import { useEffect, useState } from 'react';
import {
  detectDevices,
  readDeviceLayout,
  type Device,
  type DeviceLayout,
} from '../../services/platform';
import { useI18n } from '../../i18n/context';

const SCAN_INTERVAL_MS = 3000;

/** Polls mounted drives for an Advantage2 v-Drive while `enabled`. */
export function useDeviceScan(
  enabled: boolean,
  onError: (message: string) => void,
) {
  const { errorMessage } = useI18n();
  const [devices, setDevices] = useState<Device[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let scanning = false;
    const scan = async () => {
      if (scanning) return;
      scanning = true;
      try {
        const found = await detectDevices();
        if (active) setDevices(found);
      } catch (error) {
        if (active) onError(errorMessage(error));
      } finally {
        scanning = false;
      }
    };
    void scan();
    const interval = setInterval(() => void scan(), SCAN_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [enabled, onError, errorMessage]);
  return devices;
}

/**
 * Reads the layout file currently on the keyboard. Its fingerprint proves,
 * at transfer time, that nobody changed the file in between.
 */
export function useDeviceLayout(
  device: Device | null,
  filename: string,
  onError: (message: string) => void,
): DeviceLayout | null {
  const { errorMessage } = useI18n();
  const [loaded, setLoaded] = useState<{
    root: string;
    filename: string;
    layout: DeviceLayout;
  } | null>(null);
  useEffect(() => {
    if (!device || !filename) return;
    let active = true;
    readDeviceLayout(filename)
      .then((layout) => {
        if (active) setLoaded({ root: device.root, filename, layout });
      })
      .catch((error: unknown) => {
        if (active) onError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [device, filename, onError, errorMessage]);
  const isCurrent =
    loaded && loaded.root === device?.root && loaded.filename === filename;
  return isCurrent ? loaded.layout : null;
}
