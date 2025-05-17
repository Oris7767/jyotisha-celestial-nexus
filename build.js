
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('Building server...');

// Create a temporary tsconfig for the server build with explicit settings
const tsConfigServer = {
  compilerOptions: {
    target: "ES2020",
    useDefineForClassFields: true,
    lib: ["ES2020"],
    module: "NodeNext",
    skipLibCheck: true,
    moduleResolution: "NodeNext",
    allowImportingTsExtensions: false,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: false,
    outDir: "dist",
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    declaration: false,
    emitDeclarationOnly: false,
  },
  include: ["src/index.ts", "src/server.ts", "src/services/**/*.ts"],
  exclude: ["src/**/*.tsx", "node_modules", "src/components/**/*", "src/pages/**/*", "src/hooks/**/*"]
};

// Write temporary tsconfig
fs.writeFileSync('tsconfig.server.json', JSON.stringify(tsConfigServer, null, 2));

// Execute build commands sequentially
exec('tsc -p tsconfig.server.json', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error building server: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Server build stderr: ${stderr}`);
  }
  console.log(`Server build stdout: ${stdout}`);
  
  // Clean up temporary tsconfig
  fs.unlinkSync('tsconfig.server.json');
  
  console.log('Server build completed successfully!');
  
  // Copy ephemeris files
  const epheSource = path.join(process.cwd(), 'ephe');
  const epheTarget = path.join(process.cwd(), 'dist', 'ephe');
  
  if (fs.existsSync(epheSource)) {
    console.log('Copying ephemeris files...');
    fs.mkdirSync(epheTarget, { recursive: true });
    
    const files = fs.readdirSync(epheSource);
    files.forEach(file => {
      const sourceFile = path.join(epheSource, file);
      const targetFile = path.join(epheTarget, file);
      if (fs.statSync(sourceFile).isFile()) {
        fs.copyFileSync(sourceFile, targetFile);
      }
    });
    
    console.log('Ephemeris files copied successfully!');
  } else {
    console.warn('Warning: ephemeris directory not found at', epheSource);
  }

  // Create .env file in dist if needed
  console.log('Creating .env file in dist directory...');
  const envContent = `PORT=${process.env.PORT || 10000}
EPHE_PATH=${process.env.EPHE_PATH || './ephe'}
NODE_ENV=${process.env.NODE_ENV || 'production'}
`;
  fs.writeFileSync('dist/.env', envContent);
  console.log('.env file created in dist directory.');
  
  console.log('Build process completed!');
});
