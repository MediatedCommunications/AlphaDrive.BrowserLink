# Fasterlaw Browser Extension

This is the new version of the Fasterlaw browser extension, built with TypeScript, Vite, and Manifest V3.

## Getting Started

### Prerequisites

*   Node.js and npm (or yarn) installed.

### Installation

1.  Clone the repository:
    
    ```bash
    git clone <repository-url>
    ```
    
2.  Navigate to the project directory:
    
    ```bash
    cd courtlistener-browser-extension
    ```
    
3.  Install dependencies:
    
    ```bash
    npm install
    ```
    

### Development

1.  Start the development server:
    
    ```bash
    npm run dev
    ```
    
2.  Load the extension in Chrome:
    
    *   Open Chrome and go to `chrome://extensions/`.
    *   Enable "Developer mode" in the top right corner.
    *   Click "Load unpacked".
    *   Select the `dist` folder in the project directory.
    

### Building for Production

1.  Build the extension:
    
    ```bash
    npm run build
    ```
    
2.  The production-ready files will be in the `dist` folder.
    

## Codebase Structure

*   `src`
    
    *   `background`: Contains the background script (`index.ts`).
    *   `content`: Contains the content scripts (`clio.ts`, `index.ts`).
    *   `manifest.ts`: Generates the `manifest.json` file.
    *   `settings`: Contains the settings page scripts (`index.ts`).
    *   `utils`: Contains utility functions (`utils.ts`).
    

*   `dist`: Contains the built extension files.
    
*   `public`: Contains static assets.
    

## Functionality

This version of the extension primarily focuses on enhancing the Clio Documents and PACER experience. It includes features like:

*   Improved document linking.
*   Enhanced document display.
*   Settings page for customization.
    

## License

This project is licensed under the Apache License - see the `LICENSE` file for details.