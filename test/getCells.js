/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

// Builds upon getContent.js
//
// Advanced example that gets content items with marked content
// and groups the text into cells by comparing x, y coordinates of items.
//
// Output is an array of arrays.
//

//import pdfjsLib from "pdfjs-dist";
//pdfjsLib.GlobalWorkerOptions.workerSrc = '../../lib/pdfjs-dist/build/pdf.worker.js';

import Cell from "../lib/cell.js";
import fs from "node:fs";
import path from "node:path";
import modulesPath from "../lib/modulesPath.js";

var pdfPath;
var doc;

async function getContent() {
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

    var loadingTask = getDocument({
      url: pdfPath,
      fontExtraProperties: true,
      standardFontDataUrl: await modulesPath("./pdfjs-dist/standard_fonts/")
    });
    doc = await loadingTask.promise;
    console.log("# Document Loaded");

    let output = {};
    const numPages = doc.numPages;
    console.log("Number of Pages: " + numPages);
    output[ "Number of Pages" ] = numPages;

    let { info, metadata } = await doc.getMetadata();
    console.log("# Metadata Loaded");

    console.log("## Info");
    output.info = info;
    console.log(JSON.stringify(info, null, 2));
    console.log();

    if (metadata) {
      console.log("## Metadata");
      output.metadata = metadata.get("dc:format");
      console.log(JSON.stringify(output.metadata, null, 2));
      console.log();
    }

    let markInfo = await doc.getMarkInfo();
    console.log("Marked = " + (markInfo && markInfo.Marked));
    output.MarkInfo = markInfo;

    let outputFile = "./test/output/getCells/" + path.parse(pdfPath).name + "_header.json";
    console.log("output: " + outputFile);
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

    for (let pn = 1; pn <= numPages; pn++) {
      if (markInfo?.Marked)
        await parseMarkedPage(pn);
      else
        await parseLinedPage(pn);
    }

    console.log("# End of Document");
  }
  catch (err) {
    console.error("Error: " + err);
  }
}

async function parseMarkedPage(pageNum) {
  let page = await doc.getPage(pageNum);
  console.log("# Page " + pageNum);

  const { width, height } = page.getViewport({ scale: 1.0 });
  console.log("Size: " + width + "x" + height);

  let content = await page.getTextContent({ includeMarkedContent: true, disableNormalization: false, disableCombineTextItems: false });

  let rows = [];
  let row = [];
  let cell = new Cell();
  let prevCell = new Cell();
  let paragraph = false;
  let span = false;
  let prevItem;

  for (let item of content.items) {
    if (item.type === "beginMarkedContent") {
      console.log(item.type + " " + item.tag);

      switch (item.tag) {
        case "Artifact":
          break;
        default:
      }
    }
    else if (item.type === "beginMarkedContentProps") {
      console.log(item.type + " " + item.tag + " " + item.id);

      switch (item.tag) {
        case 'P':
          if (!span)
            paragraph = true;  // starting new paragraph
          else
            span = false;
          break;
        case "Span":
          span = true;  // span inside paragraph
          break;
        default:
      }
    }
    else if (item.type === "endMarkedContent") {
      console.log(item.type + " " + cell.count);
    }
    else if (item.type) {
      // unknown type
      console.log(item.type + " " + item.tag + " " + item.id);
    }
    else {
      // a string item
      if (item.dir !== 'ltr')  // expect direction left-to-right
        console.log(item.dir);

      let x = item.transform[ 4 ];
      let y = item.transform[ 5 ];

      // determine if cell should be added to row
      // when new paragraph or span isn't adjacent to previous text
      if (paragraph || (span && !cell.isAdjacent(item))) {
        if (cell.count) {
          let text = cell.text.trimStart();
          row.push(text);
          prevCell = cell;
          cell = new Cell();
        }
      }

      // determine if row should be added to rows
      if (paragraph && item.str !== ' ' && row.length > 0) {
        if (x <= prevCell.x2 && y < prevCell.y2) {
          rows.push(row);
          row = [];
          prevCell = new Cell();
        }
      }

      cell.addItem(item);

      paragraph = false;
      if (item.width && item.str !== ' ')
        prevItem = item;
    }
  }

  // process last cell
  if (cell.count) {
    let text = cell.text.trimStart();
    row.push(text);
  }
  if (row.length > 0) {
    rows.push(row);
  }

  let output = "./test/output/getCells/" + path.parse(pdfPath).name + "_cells_p" + pageNum + ".json";
  console.log("output: " + output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(rows, null, 2));

  // Release page resources.
  await page.cleanup();

  console.log();
}

async function parseLinedPage(pageNum) {
  let page = await doc.getPage(pageNum);
  console.log("# Page " + pageNum);

  const { width, height } = page.getViewport({ scale: 1.0 });
  console.log("Size: " + width + "x" + height);

  let content = await page.getTextContent({ disableNormalization: false, disableCombineTextItems: false });

  let rows = [];
  let row = [];
  let cell = new Cell();
  let wasEOL = false;

  for (let item of content.items) {
    if (item.dir !== 'ltr')  // expect direction left-to-right
      console.warn(item.dir.yellow);

    let aligns = cell.alignment(item);

    if (!aligns.adjacent && cell.count > 0) {
      // add cell to row
      let text = cell.text.trimStart();
      row.push(text);
      cell = new Cell();
    }

    if (wasEOL && (aligns.top || ((aligns.left || aligns.right) && aligns.adjacent))) {
      // ignore newline in the middle of a line, e.g. a split heading
      // may be sensitive to normal line spacing and heading line spacing
      wasEOL = false;
    }

    if (wasEOL) {
      if (cell.count > 0) {
        // add cell to row
        let text = cell.text.trimStart();
        row.push(text);
        cell = new Cell();
      }

      let item_y = item.transform[ 5 ];
      let newline = cell.y1 ? item_y < cell.y1 : true;
      if (newline && row.length > 0) {
        rows.push(row);
        row = [];
      }
    }

    cell.addItem(item);
    wasEOL = item.hasEOL;
  }

  // process last cell
  if (cell.count) {
    let text = cell.text.trimStart();
    row.push(text);
  }
  // process last row
  if (row.length > 0) {
    rows.push(row);
  }

  let output = "./test/output/getCells/" + path.parse(pdfPath).name + "_cells_p" + pageNum + ".json";
  console.log("output: " + output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(rows, null, 2));

  // Release page resources.
  await page.cleanup();

  console.log();
}

(async () => {
  pdfPath = process.argv[ 2 ] || "./test/data/pdf/helloworld.pdf";
  await getContent();
  pdfPath = "./test/data/pdf/ClassCodes.pdf";
  await getContent();
  pdfPath = "./test/data/pdf/Nat_State_Topic_File_formats.pdf";
  await getContent();
  pdfPath = "./test/data/pdf/CoJul22.pdf";
  await getContent();
  pdfPath = "./test/data/pdf/CongJul22.pdf";
  await getContent();
  pdfPath = "./test/data/pdf/state_voter_registration_jan2024.pdf";
  await getContent();
})();
