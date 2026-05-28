const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Replace import { motion, ... } with import { m, ... }
      content = content.replace(/import\s*\{\s*([^}]*)\bmotion\b([^}]*)\}\s*from\s*['"]framer-motion['"]/g, (match, p1, p2) => {
        let newImports = (p1 + p2).split(',').map(s => s.trim()).filter(s => s && s !== 'motion');
        newImports.unshift('m');
        return `import { ${newImports.join(', ')} } from 'framer-motion'`;
      });

      // Replace <motion.div with <m.div
      content = content.replace(/<motion\./g, '<m.');
      content = content.replace(/<\/motion\./g, '</m.');
      
      // Also motion(Component)
      content = content.replace(/\bmotion\(/g, 'm(');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir('src');
