const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/components/ui/navigation-menu.tsx',
  'src/pages/Auth.tsx',
  'src/pages/Diagnosis.tsx',
  'src/pages/Index.tsx',
  'src/pages/PriceForecast.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Schemes.tsx',
  'src/pages/SoilIntelligence.tsx',
  'src/pages/Weather.tsx'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import\s+\{([^}]*)\bmotion\b([^}]*)\}\s+from\s+[\"']framer-motion[\"']/g, (match, p1, p2) => {
    return `import {${p1}m${p2}} from "framer-motion"`;
  });
  content = content.replace(/<motion\./g, '<m.');
  content = content.replace(/<\/motion\./g, '</m.');
  fs.writeFileSync(file, content);
}
console.log('Done');
