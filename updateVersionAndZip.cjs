const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// File paths
const packagePath = path.join(__dirname, 'package.json');
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
const constantsPath = path.join(__dirname, 'src', 'constants', 'index.ts');

// Helper to zero-fill numbers
const zeroFill = (num, width) => String(num).padStart(width, '0');

// Get today’s date parts
const now = new Date();
const fullYear = now.getFullYear(); // e.g. 2025
const yearShort = String(fullYear).slice(2); // e.g. 25
const month = zeroFill(now.getMonth() + 1, 2);
const day = zeroFill(now.getDate(), 2);

// Get current version from package.json
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const [oldYear, oldMonth, oldDay, oldBuild] = pkg.version.split('.');

// Determine new version
let buildNumber;
if (oldYear === yearShort && oldMonth === month && oldDay === day) {
  // Same day – increment build
  buildNumber = zeroFill(Number(oldBuild) + 1, 3);
} else {
  // New day – reset build
  buildNumber = '001';
}

// Compose new versions
const newPackageVersion = `${yearShort}.${month}.${day}.${buildNumber}`; // For package.json and manifest.json
const newConstantVersion = `${fullYear}.${month}.${day}.${buildNumber}`; // For index.ts
const zipVersion = `v${fullYear}_${month}_${day}_${buildNumber}`; // For zip file

// Update package.json
pkg.version = newPackageVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf8');

// Update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = newPackageVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

// Update src/constants/index.ts VERSION export
let constantsContent = fs.readFileSync(constantsPath, 'utf8');
constantsContent = constantsContent.replace(
  /export const VERSION = '[^']+';/,
  `export const VERSION = '${newConstantVersion}';`
);
fs.writeFileSync(constantsPath, constantsContent, 'utf8');

// Create zip file
const zipFileName = `faster_law_browser_extension_${zipVersion}.zip`;

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
      console.log(`✅ Zip file created: ${zipFileName}`);
    }
  }
);
