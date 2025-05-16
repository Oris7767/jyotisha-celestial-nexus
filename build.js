import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Đảm bảo thư mục dist tồn tại
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build client (frontend)
console.log('Building client...');
exec('vite build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error building client: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Client build stderr: ${stderr}`);
  }
  console.log(`Client build stdout: ${stdout}`);
  console.log('Client build completed successfully!');
  
  // Build server
  console.log('Building server...');
  exec('tsc -p tsconfig.node.json', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error building server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Server build stderr: ${stderr}`);
    }
    console.log(`Server build stdout: ${stdout}`);
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
    
    console.log('Build process completed!');
  });
});
