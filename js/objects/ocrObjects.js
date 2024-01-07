
/**
 * @param {number} n
 * @param {dims} dims
 * @property {number} n - Page number (index 0)
 * @property {dims} dims - Dimensions of OCR
 * @property {number} angle - Angle of page (degrees)
 * @property {?number} left - 
 * @property {number} leftAdj - 
 * @property {Array<ocrLine>} lines - 
 */
export function ocrPage(n, dims) {
        /** @type {number} */ 
      this.n = n;
      /** @type {dims} */ 
      this.dims = dims;
      /** @type {number} - Angle of page (degrees)*/ 
      this.angle = 0;
      /** @type {?number} */ 
      this.left = null;
       /** @type {number} */ 
      this.leftAdj = 0;
      /** @type {Array<ocrLine>} */ 
      this.lines = [];
}
  

/**
 * @param {ocrPage} page
 * @param {Array<number>} bbox
 * @param {Array<number>} baseline
 * @param {?number} ascHeight - Height of median ascender character
 * @param {?number} xHeight - Height of median non-ascender/descender character
 * @property {Array<number>} bbox - bounding box for line
 * @property {Array<number>} baseline - baseline [slope, offset]
 * @property {?number} ascHeight - 
 * @property {?number} xHeight - 
 * @property {Array<ocrWord>} words - words in line
 * @property {ocrPage} page - page line belongs to
 * @property {?number} _sizeCalc - calculated line font size (using `ascHeight` and `xHeight`)
 * @property {?number} _size - line font size set (set through other means)
 *  `_size` should be preferred over `_sizeCalc` when both exist.
 * @property {?string} raw - Raw string this object was parsed from.
 *    Exists only for debugging purposes, should be `null` in production contexts.
 * @property {?{x: number, y: number}} _angleAdj - Cached x/y adjustments that must be made to coordinates when rotation is enabled. 
 */
export function ocrLine(page, bbox, baseline, ascHeight = null, xHeight = null) {
    // These inline comments are required for types to work correctly with VSCode Intellisense.
    // Unfortunately, the @property tags above are not sufficient.
    /** @type {Array<number>} */ 
    this.bbox = bbox;
    /** @type {Array<number>} - baseline [slope, offset] */ 
    this.baseline = baseline;
    /** @type {?number} */ 
    this.ascHeight = ascHeight;
    /** @type {?number} */ 
    this.xHeight = xHeight;
    /** @type {Array<ocrWord>} */ 
    this.words = [];
    /** @type {ocrPage} */ 
    this.page = page;
    /** @type {?number} */ 
    this._sizeCalc = null;
    /** @type {?number} */
    this._size = null;
    /** @type {?string} */
    this.raw = null;
    /** @type {?{x: number, y: number}} */
    this._angleAdj = null;
  }


/**
 * @param {ocrLine} line
 * @param {string} text
 * @param {Array<number>} bbox
 * @param {string} id
 */
export function ocrWord(line, text, bbox, id) {
    /** @type {boolean} */ 
    this.sup = false;
    /** @type {boolean} */ 
    this.dropcap = false;
    /** @type {string} */ 
    this.text = text;
    /** @type {("normal"|"italic"|"small-caps")} */ 
    this.style = "normal";
    /** @type {?string} */ 
    this.font = null;
    /** @type {?number} */ 
    this.size = null;
    /** @type {number} */ 
    this.conf = 0;
    /** @type {Array<number>} */ 
    this.bbox = bbox;
    /** @type {boolean} */ 
    this.compTruth = false;
    /** @type {boolean} */ 
    this.matchTruth = false;
    /** @type {string} */ 
    this.id = id;
    /** @type {ocrLine} */ 
    this.line = line;
    /** @type {?string} */
    this.raw = null;
    /** @type {?Array<ocrChar>} */
    this.chars = null;
    /** @type {?{x: number, y: number}} */
    this._angleAdj = null;
}

/**
 * 
 * @param {string} text 
 * @param {Array<number>} bbox 
 */
export function ocrChar(text, bbox) {
    /** @type {string} */ 
    this.text = text;
    /** @type {Array<number>} */ 
    this.bbox = bbox;
}

/**
 * 
 * @param {ocrLine} lineObj 
 */
export const getPrevLine = (lineObj) => {
    // While lines have no unique ID, word IDs are assumed unique.
    // Therefore, lines are identified using the ID of the first word.
    if (!lineObj.words[0]) throw new Error("All lines must contain >=1 word");
    const lineIndex = lineObj.page.lines.findIndex(elem => elem.words?.[0]?.id == lineObj.words[0].id);
    if (lineIndex < 1) return null;
    return lineObj.page.lines[lineIndex-1];
}


/**
 * @param {ocrPage} page
 * @param {string} id
 */
const getPageWord = (page, id) => {

    for (let i=0; i<page.lines.length; i++) {
        for (let j=0; j<page.lines[i].words.length; j++) {
            if (page.lines[i].words[j].id === id) return page.lines[i].words[j];
        }
    }

    return null;
}

// /**
//  * @param {ocrPage} page
//  * @param {string} search
//  */
// const searchPageWords = (page, search) => {

//     const matchArr = [];
//     for (let i=0; i<page.lines.length; i++) {
//         for (let j=0; j<page.lines[i].words.length; j++) {
//             if (page.lines[i].words[j].text.includes(search)) matchArr.push(page.lines[i].words[j]) ;
//         }
//     }

//     return matchArr;
// }



// /**
//  * Debugging function.  Should not be used in code.
//  * @param {string} search
//  */
// const searchCurrentPageWords = (search) => {
//     return searchPageWords(globalThis.ocrAll.active[currentPage.n], search);
// }


// TODO: When all words on a line are deleted, this should also delete the line.
/**
 * Delete word with id on a given page.
 * @param {ocrPage} page
 * @param {string} id
 * TODO: This function currently needs to be called for every word deleted. 
 * This leads to noticable lag when deleting a large number of words at the same time.
 * Rewrite to handle multiple words. 
 */
const deletePageWord = (page, id) => {
    for (let i=0; i<page.lines.length; i++) {
        for (let j=0; j<page.lines[i].words.length; j++) {
            if (page.lines[i].words[j].id === id) {
                page.lines[i].words.splice(j, 1);
                if (page.lines[i].words.length == 0) {
                    page.lines.splice(i, 1);
                }
                return;
            }
        }
    }
}

/**
 * @param {ocrPage} page
 */
const getPageWords = (page) => {
    const words = [];
    for (let i=0; i<page.lines.length; i++) {
        words.push(...page.lines[i].words);
    }
    return words;
}

/**
 * @param {ocrLine} line
 */
const getLineText = (line) => {
    let text = "";
    for (let i=0; i<line.words.length; i++) {
        text += line.words[i].text + " ";
    }
    return text;
}

/**
 * @param {ocrPage} page
 */
const getPageText = (page) => {
    let text = "";
    for (let i=0; i<page.lines.length; i++) {
        if (i < 0) text += "\n";
        text += getLineText(page.lines[i]);
    }
    return text;
}  


/**
 * Calculates adjustments to line x and y coordinates needed to auto-rotate the page.
 * @param {ocrLine} line 
 */
function calcLineAngleAdj(line) {
    if (line._angleAdj === null) {
        line._angleAdj = {x: 0, y: 0};

        const angle = line.page.angle;
        if (Math.abs(angle ?? 0) > 0.05) {

            const sinAngle = Math.sin(angle * (Math.PI / 180));
            const cosAngle = Math.cos(angle * (Math.PI / 180));

            const imgDims = line.page.dims;
            const linebox = line.bbox;
            const baseline = line.baseline;
          
            const shiftX = sinAngle * (imgDims.height * 0.5) * -1 || 0;
            const shiftY = sinAngle * ((imgDims.width - shiftX) * 0.5) || 0;
          
            const x = linebox[0];
            const y = linebox[3] + baseline[1];
          
            const xRot = x * cosAngle - sinAngle * y;
            const angleAdjXInt = x - xRot;
            const angleAdjYInt = sinAngle * (linebox[0] + angleAdjXInt / 2) * -1;

            line._angleAdj = {x: angleAdjXInt + shiftX, y: angleAdjYInt + shiftY};
        }
    }

    return line._angleAdj;
}

/**
 * Calculates adjustments to word x and y coordinates needed to auto-rotate the page.
 * The numbers returned are *in addition* to the adjustment applied to the entire line (calculated by `calcLineAngleAdj`).
 * 
 * @param {ocrWord} word 
 */
function calcWordAngleAdj(word) {

    // if (word._angleAdj === null) {
    if (true) {
        word._angleAdj = {x: 0, y: 0};

        const angle = word.line.page.angle;

        if (Math.abs(angle ?? 0) > 0.05) {

            const sinAngle = Math.sin(angle * (Math.PI / 180));
            const cosAngle = Math.cos(angle * (Math.PI / 180));

            const x = word.bbox[0] - (word.line.bbox[0]);
            const y = word.bbox[3] - (word.line.bbox[3] + word.line.baseline[1]);

            if (word.sup || word.dropcap) {

                const tanAngle = sinAngle / cosAngle;
                const angleAdjYSup = (y - (x * tanAngle)) * cosAngle - y;

                const angleAdjXSup = angle > 0 ? 0 : angleAdjYSup * tanAngle;

                word._angleAdj = { x: 0 - angleAdjXSup, y: angleAdjYSup };

            } else {
                const angleAdjXBaseline = x / cosAngle - x;
                word._angleAdj = { x: angleAdjXBaseline, y: 0 };
            }
        }
    }

    return word._angleAdj;

}

/**
 * Replace ligatures with individual ascii characters.
 * @param {string} text
 */
function replaceLigatures(text) {
    return text.replace(/ﬂ/g, "fl").replace(/ﬁ/g, "fi").replace(/ﬀ/g, "ff").replace(/ﬃ/g, "ffi").replace(/ﬄ/g, "ffl");
}
  
/**
 * Escapes XML in a string
 * @memberOf fabric.util.string
 * @param {String} string String to escape
 * @return {String} Escaped version of a string
 */
function escapeXml(string) {
    return string.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Re-calculate bbox for line
export function calcLineBbox(line) {
    const wordBoxArr = line.words.map(x => x.bbox);
    const lineBoxNew = new Array(4);
    lineBoxNew[0] = Math.min(...wordBoxArr.map(x => x[0]));
    lineBoxNew[1] = Math.min(...wordBoxArr.map(x => x[1]));
    lineBoxNew[2] = Math.max(...wordBoxArr.map(x => x[2]));
    lineBoxNew[3] = Math.max(...wordBoxArr.map(x => x[3]));
    line.bbox = lineBoxNew;
}

/**
 * Rotates bounding box.
 * Should not be used for lines--use `rotateLine` instead.
 * @param {Array<number>} bbox
 * @param {number} cosAngle
 * @param {number} sinAngle
 * @param {number} width
 * @param {number} height
 */
export function rotateBbox(bbox, cosAngle, sinAngle, width, height) {

    // This math is technically only correct when the angle is 0, as that is the only time when
    // the left/top/right/bottom bounds exactly match the corners of the rectangle the line was printed in.
    // This is generally fine for words (as words are generally short),
    // but results in significantly incorrect results for lines.
  
    const bboxOut = [...bbox];

    const xCenter = width / 2;
    const yCenter = height / 2;

    bboxOut[0] = cosAngle * (bbox[0] - xCenter) - sinAngle * (bbox[3] - yCenter) + xCenter;
    bboxOut[2] = cosAngle * (bbox[2] - xCenter) - sinAngle * (bbox[3] - yCenter) + xCenter;
    bboxOut[1] = sinAngle * (bbox[0] - xCenter) + cosAngle * (bbox[1] - yCenter) + yCenter;
    bboxOut[3] = sinAngle * (bbox[0] - xCenter) + cosAngle * (bbox[3] - yCenter) + yCenter;

    return bboxOut;
}

/**
 * Rotates line bounding box (modifies in place).
 * @param {ocrLine} line
 * @param {number} angle
 * @param {?dims} dims
 */
export function rotateLine(line, angle, dims = null) {

    // If the angle is 0 (or very close) return early.
    if (Math.abs(angle) <= 0.05) return;

    const dims1 = dims || line.page.dims;

    const sinAngle = Math.sin(angle * (Math.PI / 180));
    const cosAngle = Math.cos(angle * (Math.PI / 180));
    
    // Add preprocessing angle to baseline angle
    const baseline = line.baseline;
    const baselineAngleRadXML = Math.atan(baseline[0]);
    const baselineAngleRadAdj = angle * (Math.PI / 180);
    const baselineAngleRadTotal = Math.tan(baselineAngleRadXML + baselineAngleRadAdj);
  
    for (let i=0; i<line.words.length; i++) {
        const word = line.words[i];
        word.bbox = rotateBbox(word.bbox, cosAngle, sinAngle, dims1.width, dims1.height);
    }
  
    // Re-calculate line bbox by rotating original line bbox
    const lineBoxRot = rotateBbox(line.bbox, cosAngle, sinAngle, dims1.width, dims1.height);
  
    // Re-calculate line bbox by taking union of word bboxes
    calcLineBbox(line);
  
    // Adjust baseline
    const baselineOffsetAdj = lineBoxRot[3] - line.bbox[3];
  
    const baselineOffsetTotal = baseline[1] + baselineOffsetAdj;
  
    line.baseline[0] = baselineAngleRadTotal;
    line.baseline[1] = baselineOffsetTotal;
  
}

/**
 * Clones line and included words.  Does not clone page.
 * Should be used rather than `structuredClone` for performance reasons.
 * @param {ocrLine} line
 */
function cloneLine(line) {
    const lineNew = new ocrLine(line.page, line.bbox.slice(), line.baseline.slice(), line.ascHeight, line.xHeight);
    for (let i=0; i<line.words.length; i++) {
        const word = line.words[i];
        const wordNew = new ocrWord(lineNew, word.text, word.bbox, word.id);
        wordNew.conf = word.conf;
        wordNew.sup = word.sup;
        wordNew.dropcap = word.dropcap;
        wordNew.font = word.font;
        wordNew.size = word.size;
        wordNew.style = word.style;
        wordNew.compTruth = word.compTruth;
        wordNew.matchTruth = word.matchTruth;
        lineNew.words.push(wordNew);
    }
    return lineNew;
}

/**
 * Clones word.  Does not clone line or page.
 * Should be used rather than `structuredClone` for performance reasons.
 * @param {ocrWord} word
 */
function cloneWord(word) {
    const wordNew = new ocrWord(word.line, word.text, word.bbox.slice(), word.id);
    wordNew.conf = word.conf;
    wordNew.sup = word.sup;
    wordNew.dropcap = word.dropcap;
    wordNew.font = word.font;
    wordNew.size = word.size;
    wordNew.style = word.style;
    wordNew.compTruth = word.compTruth;
    wordNew.matchTruth = word.matchTruth;
    return wordNew;
}

const ocr = {
    ocrPage: ocrPage,
    ocrLine: ocrLine,
    ocrWord: ocrWord,
    ocrChar: ocrChar,
    calcLineAngleAdj : calcLineAngleAdj,
    calcLineBbox: calcLineBbox,
    calcWordAngleAdj: calcWordAngleAdj,
    getPageWord: getPageWord,
    getPageWords: getPageWords,
    getPageText: getPageText,
    getPrevLine: getPrevLine,
    cloneLine: cloneLine,
    cloneWord: cloneWord,
    rotateLine: rotateLine,
    deletePageWord: deletePageWord,
    replaceLigatures: replaceLigatures,
    escapeXml: escapeXml,
}

export default ocr;
// Making global for debugging purposes.  This should not be relied upon in code.
// globalThis.ocr = ocr;
