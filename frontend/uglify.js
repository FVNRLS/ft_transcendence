const UglifyJS = require("uglify-js");
const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "build");

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
for (const file of jsFiles) {
  const code = fs.readFileSync(file, "utf8");
  const result = UglifyJS.minify(code);

  fs.writeFileSync(file, result.code, "utf8");
}
