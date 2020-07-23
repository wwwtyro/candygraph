const glob = require("glob");
const fs = require("fs");
const path = require("path");

const md = require("markdown-it")({
  html: true,
  linkify: true,
  typographer: true,
});

const fileNames = glob.sync("src/ex-*");

let markdown = "";

function log(str) {
  markdown += str + "\n";
}

let code = [];

function printCodeBlock() {
  while (code.length > 0 && code[0].trim().length === 0) {
    code.shift();
  }
  while (code.length > 0 && code[code.length - 1].trim().length === 0) {
    code.pop();
  }
  const block = code.join("\n");
  if (block.trim().length === 0) {
    return;
  }
  log("\n```typescript");
  log(block);
  log("```\n");
  code.length = 0;
}

for (const fileName of fileNames) {
  log("\n");
  if (fileName.endsWith(".md")) {
    log(fs.readFileSync(fileName));
    continue;
  }
  const lines = fs.readFileSync(fileName, { encoding: "utf8" }).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace("{{filename}}", path.basename(fileName));
    if (line.includes("skip-doc-next")) {
      i++;
      continue;
    } else if (line.includes("skip-doc-start")) {
      while (i < lines.length && !lines[i].includes("skip-doc-stop")) {
        i++;
      }
      continue;
    } else if (line.includes("skip-doc")) {
      continue;
    }

    if (line.trimLeft().startsWith("//")) {
      printCodeBlock();
      log(line.replace("//", "").trimLeft());
      continue;
    }

    if (line.trim().length === 0) {
      log("");
    }

    code.push(line);
  }
  printCodeBlock();
}

const html = md.render(markdown);

const template = fs.readFileSync("src/index.html.template", {
  encoding: "utf8",
});

const result = template.replace("{{ insert }}", html);

if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist");
}
fs.writeFileSync("dist/index.html", result);
