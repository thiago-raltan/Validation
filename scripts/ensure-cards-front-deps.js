const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const projectDir = path.join(__dirname, '..', 'cards-front');
const nodeModulesDir = path.join(projectDir, 'node_modules');
const angularBuilderPackage = path.join(
  nodeModulesDir,
  '@angular-devkit',
  'build-angular',
  'package.json'
);

if (existsSync(nodeModulesDir) && existsSync(angularBuilderPackage)) {
  process.exit(0);
}

const installArgs = existsSync(nodeModulesDir) ? ['install'] : ['ci'];

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, installArgs, {
  cwd: projectDir,
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}