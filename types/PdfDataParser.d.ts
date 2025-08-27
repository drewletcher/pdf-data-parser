export default class PdfDataParser {
    /**
     *
     * @param {Object} options
     * @param {String|URL}         [options.url] the URL or local file name of the .pdf
     * @param {String|ArrayBuffer} [options.data] pdf file data as an array, instead of using url
     * @param {String}             [options.password] password for decrypting the pdf document, optional
     * @param {Number[]}           [options.pages] array of page numbers to process, if undefined defaults to all pages
     * @param {String|RegExp}      [options.heading] PDF section heading where data is located, default: none
     * @param {String|RegExp}      [options.stopHeading] PDF section heading after data table, default: none
     * @param {Number}             [options.cells] minimum number cells in a row for output, or "min-max" e.g. "7-9"
     * @param {Boolean}            [options.newlines] preserve new lines in cell data, default: false
     * @param {Number}             [options.pageHeader] height of page header area in points, default: 0
     * @param {Number}             [options.pageFooter] height of page footer area in points, default: 0
     * @param {Boolean}            [options.hasHeader] indicates if the table has a header row, default: true
     * @param {Boolean}            [options.repeatingHeaders] indicates if table header is repeated on each page, default: true
     * @param {Boolean|Number}     [options.trim] trim whitespace, false (0) = none, true (1) = both, 2 = starting only, 3 = trailing only, default: true
     * @param {Boolean}            [options.artifacts] parse artifacts content, default: false
     * @param {Number}             [options.lineHeight] approximate line height ratio based on font size; default 1.67
     * @param {Boolean}            [options.orderXY] order cells by XY coordinates on page; default true
     * @param {Boolean}            [options.missingValues] check for blank cells by comparing XY coordinates against table header cells, default: false
     */
    constructor(options?: {
        url?: string | URL | undefined;
        data?: string | ArrayBuffer | undefined;
        password?: string | undefined;
        pages?: number[] | undefined;
        heading?: string | RegExp | undefined;
        stopHeading?: string | RegExp | undefined;
        cells?: number | undefined;
        newlines?: boolean | undefined;
        pageHeader?: number | undefined;
        pageFooter?: number | undefined;
        hasHeader?: boolean | undefined;
        repeatingHeaders?: boolean | undefined;
        trim?: number | boolean | undefined;
        artifacts?: boolean | undefined;
        lineHeight?: number | undefined;
        orderXY?: boolean | undefined;
        missingValues?: boolean | undefined;
    });
    options: {
        hasHeader: boolean;
        repeatingHeaders: boolean;
        trim: boolean;
        orderXY: boolean;
    } & {
        url?: string | URL | undefined;
        data?: string | ArrayBuffer | undefined;
        password?: string | undefined;
        pages?: number[] | undefined;
        heading?: string | RegExp | undefined;
        stopHeading?: string | RegExp | undefined;
        cells?: number | undefined;
        newlines?: boolean | undefined;
        pageHeader?: number | undefined;
        pageFooter?: number | undefined;
        hasHeader?: boolean | undefined;
        repeatingHeaders?: boolean | undefined;
        trim?: number | boolean | undefined;
        artifacts?: boolean | undefined;
        lineHeight?: number | undefined;
        orderXY?: boolean | undefined;
        missingValues?: boolean | undefined;
    };
    cellsRange: {
        min: number;
        max: number;
        heading: number;
    };
    headingFound: boolean;
    tableFound: boolean;
    tableDone: boolean;
    firstPageNumber: number;
    _cells: any[];
    _headerRow: any[];
    _rows: any[];
    headerY: number;
    footerY: number;
    started: boolean;
    paused: boolean;
    cancelled: boolean;
    /**
     * Load and parse the PDF document.
     * @returns an array of row arrays.
     * If using an event listener the return value will be an empty array.
     */
    parse(): Promise<any[] | undefined>;
    doc: any;
    page: any;
    pause(): void;
    resume(): void;
    cancel(): void;
    /**
     * Parse the content items returned by PDF.js.
     * Use PDF.js marked content to collect multiple items into cells.
     * Result is cells array contains cells in sorted x.y order.
     */
    parseMarkedPage(): Promise<void>;
    parseLinedPage(): Promise<void>;
    /**
     * Add item to cells array in x,y order.
     *
     * Order of cells is top of page (max) to bottom of page (0).
     * Within a row order is left (0) to right (max).
     * Usually cells flow in order from pdf.js, but sometimes not.
     *
     * Filters out cells in page header and page footer areas.
     *
     * @param {*} cell
     */
    insertCell(cell: any): void;
    /**
     * Iterate the cells and determine rows.
     */
    processCells(): Promise<void>;
    rowNum: number | undefined;
    inCellRange(rowlen: any): boolean;
    /**
     * Performs row filtering.
     *
     * @param {*} row is an array of cells
     */
    filters(row: any): boolean;
    /**
    *
    * @param {Object} row - the row to check
    * @param {String} heading - text to compare against
    */
    compareHeading(row: Object, heading: string): any;
    rowsEqual(row1: any, row2: any): boolean;
    /**
     * Emits or appends data to output.
     *
     * @param {*} row is an array of cells
     */
    output(row: any): Promise<void>;
}
//# sourceMappingURL=PdfDataParser.d.ts.map