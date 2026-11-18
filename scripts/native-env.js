import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));

/**
 * Environment for Rust builds. On a normal installation it is the process
 * environment unchanged. When the optional Linux build dependencies were
 * extracted into `work/native` (no system install), they are added here.
 */
export function nativeEnv() {
  const env = { ...process.env };
  const prepend = (name, ...paths) => {
    env[name] = [...paths, env[name]].filter(Boolean).join(delimiter);
  };
  const native = join(root, 'work/native/usr');
  if (
    process.platform === 'linux' &&
    existsSync(join(native, 'lib64/pkgconfig/gtk+-3.0.pc'))
  ) {
    // Some packages (dbus…) install their .pc files under share/pkgconfig.
    prepend(
      'PKG_CONFIG_PATH',
      join(native, 'lib64/pkgconfig'),
      join(native, 'share/pkgconfig'),
    );
    prepend('LIBRARY_PATH', join(native, 'lib64'));
    prepend('CPATH', join(native, 'include'));
  }
  const cargoCache = join(root, 'work/cargo-home');
  if (!env.CARGO_HOME && existsSync(cargoCache)) env.CARGO_HOME = cargoCache;
  return env;
}
