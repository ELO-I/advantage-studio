/**
 * Runs the Tauri CLI or Cargo with the native build environment.
 *   node scripts/run-native.js tauri dev
 *   node scripts/run-native.js cargo test
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { nativeEnv, root } from './native-env.js';

const [tool, ...args] = process.argv.slice(2);
const commands = {
  tauri: {
    command: process.execPath,
    args: [join(root, 'node_modules/@tauri-apps/cli/tauri.js'), ...args],
    cwd: root,
  },
  cargo: { command: 'cargo', args, cwd: join(root, 'src-tauri') },
};
const selected = commands[tool];
if (!selected) {
  console.error('Usage: node scripts/run-native.js <tauri|cargo> [arguments]');
  process.exit(1);
}

const child = spawn(selected.command, selected.args, {
  cwd: selected.cwd,
  env: nativeEnv(),
  stdio: 'inherit',
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
