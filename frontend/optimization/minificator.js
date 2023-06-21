const terser = require("terser");
const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "../build");

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

const jsFiles = getJavaScriptFiles(path.join(buildDir, "static/js"));

async function minifyFiles() {
  for (const file of jsFiles) {
    const code = fs.readFileSync(file, "utf8");
    try {
      const options = {};
      const result = await terser.minify(code, options);
      if (result.error) {
        console.error("Minification error:", result.error);
      } else if (result.code !== undefined) {
        fs.writeFileSync(file, result.code, "utf8");
        console.log("Minified:", file);
      }
    } catch (error) {
      console.error("An error occurred during minification:", error);
    }
  }
}

minifyFiles();
