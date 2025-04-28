const fs = require("fs");
const path = require("path");
const { version } = require("./package.json");
const { Command } = require("commander");
const markdownToWordpress = require("./markdownToWordpress");

const program = new Command();

program.version(version);

program
  .option(
    "-i, --input <path>",
    "path where markdown files live (this is not recursive)"
  )
  .option(
    "-o, --output <file>",
    "file to put WordPress XML. Defaults to wordpress-import.xml"
  );

program.parse(process.argv);
const options = program.opts();

if (!options.input) {
  program.help();
  process.exit();
}

const pathname = path.resolve(process.cwd(), options.input);
const output = path.resolve(
  process.cwd(),
  options.file || "wordpress-import.xml"
);

const files = fs
  .readdirSync(pathname)
  .map((file) => ({
    path: path.join(pathname, file),
    slug: path.basename(file, ".md"),
  }))
  .filter((file) => !fs.lstatSync(file.path).isDirectory())
  .filter((file) => file.path.match(/\.md$/))
  .map((file) => ({
    ...file,
    content: fs.readFileSync(file.path, "utf8"),
  }));

const xml = markdownToWordpress({ fileArray: files });

fs.writeFileSync(output, xml);

console.log(`WordPress XML export generated: ${output}`);
