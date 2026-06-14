const fs = require('fs');
const path = 'components/ClientWrapper.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the array-contains logic with a simple string equality or ilike check
code = code.replace(
    /\.contains\('services',\s*\[category\]\)/g, 
    ".ilike('category', `%${category}%`)"
);

fs.writeFileSync(path, code);
