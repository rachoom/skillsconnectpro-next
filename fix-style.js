const fs = require('fs');
const path = 'app/ClientWrapper.tsx';
let code = fs.readFileSync(path, 'utf8');

const cssStartStr = "<style dangerouslySetInnerHTML={{ __html: `";
const cssEndStr = "` }} />";

if (code.includes(cssStartStr) && code.includes(cssEndStr)) {
    const startIndex = code.indexOf(cssStartStr) + cssStartStr.length;
    const endIndex = code.indexOf(cssEndStr, startIndex);
    const cssContent = code.substring(startIndex, endIndex);
    const styleTagIndex = code.indexOf(cssStartStr);
    const beforeStyle = code.substring(0, styleTagIndex);
    const lastReturnIndex = beforeStyle.lastIndexOf('return (');

    if (lastReturnIndex !== -1) {
        const part1 = code.substring(0, lastReturnIndex);
        const varDeclaration = `const myCustomStyles = \`${cssContent}\`;\n\n  return (\n`;
        const part2 = code.substring(lastReturnIndex + 8, styleTagIndex);
        const safeStyleTag = "<style dangerouslySetInnerHTML={{ __html: myCustomStyles }} />";
        const part3 = code.substring(endIndex + cssEndStr.length);
        
        fs.writeFileSync(path, part1 + varDeclaration + part2 + safeStyleTag + part3);
        console.log("✅ Successfully fixed ClientWrapper.tsx!");
    }
}
