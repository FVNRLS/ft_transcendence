const terser = require("terser");
const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "../build");

// Recursively get all JavaScript files in the build directory
function getJavaScriptFiles(dir) {
  const files = fs.readdirSync(dir);
  let result = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      result = result.concat(getJavaScriptFiles(filePath));
    } else if (stat.isFile() && path.extname(file) === ".js") {
      result.push(filePath);
    }
  }

  return result;
}

// Get all JavaScript files in the build directory
const jsFiles = getJavaScriptFiles(path.join(buildDir, "static/js"));

// Minify each JavaScript file and overwrite the original file
async function minifyFiles() {
  for (const file of jsFiles) {
    const code = fs.readFileSync(file, "utf8");
    try {
      const result = await terser.minify(code);
      if (result.error) {
        console.error("Minification error:", result.error);
      } else {
        fs.writeFileSync(file, result.code, "utf8");
        console.log("Minified:", file);
      }
    } catch (error) {
      console.error("An error occurred during minification:", error);
    }
  }
}

minifyFiles();





// const UglifyJS = require("uglify-js");
// const fs = require("fs");
// const path = require("path");
// const JavaScriptObfuscator = require("javascript-obfuscator");

// const buildDir = path.resolve(__dirname, "build");

// // Recursively get all JavaScript files in the build directory
// function getJavaScriptFiles(dir) {
//   const files = fs.readdirSync(dir);
//   let result = [];

//   for (const file of files) {
//     const filePath = path.join(dir, file);
//     const stat = fs.statSync(filePath);

//     if (stat.isDirectory()) {
//       result = result.concat(getJavaScriptFiles(filePath));
//     } else if (stat.isFile() && path.extname(file) === ".js") {
//       result.push(filePath);
//     }
//   }

//   return result;
// }

// // Get all JavaScript files in the build directory
// const jsFiles = getJavaScriptFiles(path.join(buildDir, "static/js"));

// // Minify and obfuscate each JavaScript file and overwrite the original file
// for (const file of jsFiles) {
//   const code = fs.readFileSync(file, "utf8");

//   // Minify the code using UglifyJS
//   const minifiedCode = UglifyJS.minify(code).code;

//   // Obfuscate the code using JavaScriptObfuscator
//   const obfuscatedCode = JavaScriptObfuscator.obfuscate(minifiedCode, {
//     compact: true,
//     controlFlowFlattening: true,
//     deadCodeInjection: true,
//     debugProtection: true,
//     debugProtectionInterval: true,
//     disableConsoleOutput: true,
//     identifierNamesGenerator: "mangled",
//     log: false,
//     renameGlobals: true,
//     rotateStringArray: true,
//     selfDefending: true,
//     stringArray: true,
//     stringArrayEncoding: true,
//     stringArrayThreshold: 0.75,
//     unicodeEscapeSequence: true,
//   }).getObfuscatedCode();

//   if (obfuscatedCode) {
//     fs.writeFileSync(file, obfuscatedCode, "utf8");
//   } else {
//     console.error("Failed to obfuscate file:", file);
//   }
// }
