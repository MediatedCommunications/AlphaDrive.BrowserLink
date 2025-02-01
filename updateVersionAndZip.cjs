const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Path to your package.json, manifest.json, and dist folder
const packagePath = path.join(__dirname, 'package.json');
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');

// Read the current version from package.json
const packageData = fs.readFileSync(packagePath);
const pkg = JSON.parse(packageData);

// Prepare the new version number based on date and patch count
const date = new Date();
const month = ('0' + (date.getMonth() + 1)).slice(-2); // Month is zero-based
const day = ('0' + date.getDate()).slice(-2);
const yearShort = date.getFullYear().toString().slice(-2);
let patchNumber = pkg.version ? parseInt(pkg.version.split('.')[3] || '1') : 0;
patchNumber += 1; // Increment the patch number for each run of this script

// Update the version in the format: YYYY.MM.DD.PatchNumber
const newVersion = `${yearShort}.${month}.${day}.${('00' + patchNumber).slice(
  -3
)}`;
pkg.version = newVersion; // Update package.json version
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2)); // Write updated package.json back to disk

// Read the current version from the manifest
const data = fs.readFileSync(manifestPath);
const manifest = JSON.parse(data);
manifest.version = newVersion; // Update manifest version
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2)); // Write updated manifest back to disk

// Zip the contents of dist folder with a specific name format including the full year in the filename
const zipFileName = `faster_law_browser_extension_v${yearShort}_${month}_${day}_${(
  '00' + patchNumber
).slice(-3)}.zip`;

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
