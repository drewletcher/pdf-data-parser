import { access, constants } from "node:fs/promises";
import path from "node:path";

export default async (relPath) => {
  let dir = import.meta.dirname;

  let found = false;
  let dp = path.parse(dir);
  let nm = "";

  while (!found && dir !== dp.root) {
    // Check if node_modules is readable.
    try {
      nm = path.join(dir, "node_modules");
      await access(nm, constants.R_OK);
      found = true;
    }
    catch {
      dir = dp.dir;
      dp = path.parse(dir);
    }
  }

  nm = path.join(nm, relPath).slice(2).replace(/\\/g, '/');

  return (found) ? nm : "";
}
