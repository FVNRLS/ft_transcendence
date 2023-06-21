const path = require("path");
const fs = require("fs");
const JavaScriptObfuscator = require("javascript-obfuscator");

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

// Obfuscate each JavaScript file and overwrite the original file
for (const file of jsFiles) {
	const code = fs.readFileSync(file, "utf8");
  
	const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
		compact: true,
		controlFlowFlattening: true,
		deadCodeInjection: true,
		debugProtection: true,
		debugProtectionInterval: 1000,
		disableConsoleOutput: true,
		identifierNamesGenerator: "mangled",
		log: false,
		renameGlobals: true,
		rotateStringArray: true,
		selfDefending: true,
		stringArray: true,
		stringArrayEncoding: ["base64", "rc4"],
		stringArrayThreshold: 0.75,
		unicodeEscapeSequence: true,
	  }).getObfuscatedCode();
  
	if (obfuscatedCode) {
	  fs.writeFileSync(file, obfuscatedCode, "utf8");
	} else {
	  console.error("Failed to obfuscate file:", file);
	}
}