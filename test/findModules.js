import modulesPath from "../lib/modulesPath.js";

(async () => {
  console.log(await modulesPath("./pdfjs-dist/standard_fonts/"));
}
)();
