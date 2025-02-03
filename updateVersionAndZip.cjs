const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Path to your package.json, manifest.json, and src/constants/index.ts
const packagePath = path.join(__dirname, 'package.json');
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
const constantsPath = path.join(__dirname, 'src', 'constants', 'index.ts');

// Read the VERSION constant from src/constants/index.ts
const constantsData = fs.readFileSync(constantsPath, 'utf8');
const versionMatch = constantsData.match(/export const VERSION = '([^']+)';/);
if (!versionMatch) {
  throw new Error('VERSION constant not found in src/constants/index.ts');
}
const version = versionMatch[1];

// Read the current version from package.json
const packageData = fs.readFileSync(packagePath);
const pkg = JSON.parse(packageData);

// Update the version in package.json
pkg.version = version;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2)); // Write updated package.json back to disk

// Read the current version from the manifest
const data = fs.readFileSync(manifestPath);
const manifest = JSON.parse(data);

// Update the version in manifest.json
manifest.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2)); // Write updated manifest back to disk

// Extract the date components from the version for the zip file name
const [yearShort, month, day, patchNumber] = version.split('.');

// Zip the contents of dist folder with a specific name format including the full year in the filename
const zipFileName = `faster_law_browser_extension_v${yearShort}_${month}_${day}_${patchNumber}.zip`;

exec(
  `cd dist && zip -r ../output/${zipFileName} ./*`,
  (error, stdout, stderr) => {
    if (error) {
      console.error('Error zipping files:', error);
      return;
    }
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    } else {
      console.log(`Zip file created: ${zipFileName}`);
    }
  }
);
