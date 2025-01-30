const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Path to your manifest file
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');

// Read the current version from the manifest
const data = fs.readFileSync(manifestPath);
const manifest = JSON.parse(data);

// Update the version in the format: MMDDYYYY
const date = new Date();
const month = ('0' + (date.getMonth() + 1)).slice(-2); // Month is zero-based
const day = ('0' + date.getDate()).slice(-2);
const year = date.getFullYear();
manifest.version = `${month}.${day}.${year}`;

// Write the updated manifest back to disk
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Zip the contents of dist folder with a specific name format
const zipFileName = `faster_law_browser_extension_v${month}_${day}_${year}.zip`;
exec(`cd dist && zip -r ../${zipFileName} ./*`, (error, stdout, stderr) => {
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
});
