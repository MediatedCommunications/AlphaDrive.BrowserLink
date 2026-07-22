const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const packagePath = path.join(__dirname, 'package.json');
const packageLockPath = path.join(__dirname, 'package-lock.json');
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
const constantsPath = path.join(__dirname, 'src', 'constants', 'index.ts');
const outputPath = path.join(__dirname, 'output');

const zeroFill = (num, width) => String(num).padStart(width, '0');

function nextVersion(currentVersion, now = new Date()) {
  const fullYear = now.getFullYear();
  const yearShort = Number(String(fullYear).slice(2));
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const [oldYear, oldMonth, oldDay, oldBuild] = currentVersion.split('.');
  const sameDay =
    Number(oldYear) === yearShort &&
    Number(oldMonth) === month &&
    Number(oldDay) === day;
  const buildNumber = sameDay ? Number(oldBuild) + 1 : 1;

  return `${yearShort}.${month}.${day}.${buildNumber}`;
}

function assertVersion(version) {
  const parts = version.split('.');
  const isChromeVersion =
    parts.length === 4 &&
    parts.every(
      (part) => /^(0|[1-9]\d*)$/.test(part) && Number(part) <= 65535
    ) &&
    parts.some((part) => Number(part) > 0);
  if (!isChromeVersion) {
    throw new Error(
      `Invalid extension version "${version}". Expected four Chrome-compatible integers.`
    );
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || __dirname,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}`);
  }
}

function updateVersionFiles(version) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
  const [year, month, day, build] = version.split('.');
  const displayVersion = `20${year}.${zeroFill(month, 2)}.${zeroFill(day, 2)}.${zeroFill(build, 3)}`;

  pkg.version = version;
  packageLock.version = version;
  packageLock.packages[''].version = version;

  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    packageLockPath,
    `${JSON.stringify(packageLock, null, 2)}\n`,
    'utf8'
  );

  const constantsContent = fs.readFileSync(constantsPath, 'utf8');
  const versionExportPattern = /export const VERSION = '[^']+';/;
  if (!versionExportPattern.test(constantsContent)) {
    throw new Error('Could not find the VERSION export in src/constants/index.ts');
  }
  const updatedConstants = constantsContent.replace(
    versionExportPattern,
    `export const VERSION = '${displayVersion}';`
  );
  fs.writeFileSync(constantsPath, updatedConstants, 'utf8');
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const versionFlagIndex = process.argv.indexOf('--version');
  const requestedVersion =
    versionFlagIndex === -1 ? undefined : process.argv[versionFlagIndex + 1];
  const version = requestedVersion || nextVersion(pkg.version);
  assertVersion(version);
  updateVersionFiles(version);

  run('npm', ['run', 'check']);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.version !== version) {
    throw new Error(
      `Built manifest version ${manifest.version} does not match package version ${version}`
    );
  }

  const [year, month, day, build] = version.split('.');
  const zipFileName = `faster_law_browser_extension_v20${year}_${zeroFill(month, 2)}_${zeroFill(day, 2)}_${zeroFill(build, 3)}.zip`;
  const zipFilePath = path.join(outputPath, zipFileName);
  fs.mkdirSync(outputPath, { recursive: true });
  fs.rmSync(zipFilePath, { force: true });
  run('zip', ['-X', '-r', zipFilePath, '.', '-x', '*.DS_Store'], {
    cwd: path.join(__dirname, 'dist'),
  });

  console.log(`\nExtension package created: ${zipFilePath}`);
}

if (require.main === module) {
  main();
}

module.exports = { assertVersion, nextVersion };
