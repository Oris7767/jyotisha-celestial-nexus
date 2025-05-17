
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo thư mục dist tồn tại
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build server
console.log('Building server...');

// Create a temporary tsconfig for the server build with explicit settings
const tsConfigServer = {
  compilerOptions: {
    target: "ES2020",
    useDefineForClassFields: true,
    lib: ["ES2020", "DOM", "DOM.Iterable"],
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
  include: ["src/**/*.ts"],
  exclude: ["src/**/*.tsx", "node_modules"]
};

// Write temporary tsconfig
fs.writeFileSync('tsconfig.server.json', JSON.stringify(tsConfigServer, null, 2));

// Thực thi các lệnh build một cách tuần tự
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
  
  // Sao chép thư mục ephe nếu cần
  const epheSource = path.join(process.cwd(), 'ephe');
  const epheTarget = path.join(process.cwd(), 'dist', 'ephe');
  
  if (fs.existsSync(epheSource) && !fs.existsSync(epheTarget)) {
    console.log('Copying ephemeris files...');
    fs.mkdirSync(epheTarget, { recursive: true });
    
    const files = fs.readdirSync(epheSource);
    files.forEach(file => {
      const sourceFile = path.join(epheSource, file);
      const targetFile = path.join(epheTarget, file);
      fs.copyFileSync(sourceFile, targetFile);
    });
    
    console.log('Ephemeris files copied successfully!');
  }

  // Tạo file môi trường trong dist nếu cần
  if (!fs.existsSync('dist/.env')) {
    console.log('Creating .env file in dist directory...');
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', 'dist/.env');
      console.log('.env file copied to dist directory.');
    } else {
      // Tạo file .env mặc định nếu không có
      fs.writeFileSync('dist/.env', `PORT=10000\nEPHE_PATH=./ephe\nNODE_ENV=production\n`);
      console.log('Default .env file created in dist directory.');
    }
  }
  
  console.log('Build process completed!');
});
