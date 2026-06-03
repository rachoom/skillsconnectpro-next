const fs = require('fs');

const wrapperPath = 'app/ClientWrapper.tsx';
const globalsPath = 'app/globals.css';

let code = fs.readFileSync(wrapperPath, 'utf8');

const startStr = "<style dangerouslySetInnerHTML={{ __html: `";
const endStr = "` }} />";

const startIndex = code.indexOf(startStr);
if (startIndex !== -1) {
    const endIndex = code.indexOf(endStr, startIndex);
    if (endIndex !== -1) {
        const cssContent = code.substring(startIndex + startStr.length, endIndex);
        
        // Append CSS to globals.css
        fs.appendFileSync(globalsPath, '\n/* Styles moved from ClientWrapper */\n' + cssContent);
        
        // Remove the style block completely from ClientWrapper
        const newCode = code.substring(0, startIndex) + code.substring(endIndex + endStr.length);
        fs.writeFileSync(wrapperPath, newCode);
        
        console.log("✅ Successfully moved CSS to globals.css and fixed the file!");
    }
}
