// Global state
let tableData = JSON.parse(JSON.stringify(TABLE_DATA));
let headers = [...TABLE_HEADERS];
let searchResults = null;
let zoomLevels = { table1: 1, table2: 1, table3: 1, table4: 1, table5: 1, table6: 1 };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTable1();
    setupZoom();
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});

// ============ ZOOM FEATURE ============
function setupZoom() {
    ['table1Wrapper', 'table2Wrapper', 'table3Wrapper', 'table4Wrapper', 'table5Wrapper', 'table6Wrapper'].forEach(id => {
        const wrapper = document.getElementById(id);
        if (!wrapper) return;
        wrapper.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const tableKey = id.replace('Wrapper', '');
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                zoomLevels[tableKey] = Math.max(0.3, Math.min(3, zoomLevels[tableKey] + delta));
                applyZoom(tableKey);
            }
        }, { passive: false });
    });
}

function zoomIn(tableId) {
    zoomLevels[tableId] = Math.min(3, zoomLevels[tableId] + 0.15);
    applyZoom(tableId);
}

function zoomOut(tableId) {
    zoomLevels[tableId] = Math.max(0.3, zoomLevels[tableId] - 0.15);
    applyZoom(tableId);
}

function zoomReset(tableId) {
    zoomLevels[tableId] = 1;
    applyZoom(tableId);
}

function applyZoom(tableId) {
    const wrapper = document.getElementById(tableId + 'Wrapper');
    if (!wrapper) return;
    const inner = wrapper.querySelector('.table-inner');
    if (inner) {
        inner.style.transform = `scale(${zoomLevels[tableId]})`;
        inner.style.transformOrigin = 'top left';
    }
}

// ============ TABLE 1: Fixed/Editable Table ============
function renderTable1() {
    const wrapper = document.getElementById('table1Wrapper');
    wrapper.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'table-inner';
    const table = document.createElement('table');
    table.id = 'table1';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'No.';
    rowNumTh.className = 'row-number';
    headerRow.appendChild(rowNumTh);

    headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.forEach((row, ri) => {
        const tr = document.createElement('tr');
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.textContent = ri + 1;
        tr.appendChild(rowNumTd);

        row.forEach((cell, ci) => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.className = 'editable';
            td.onclick = () => editCell(ri, ci, td);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    inner.appendChild(table);
    wrapper.appendChild(inner);
}

function editCell(ri, ci, td) {
    const currentVal = tableData[ri][ci];
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentVal;
    input.style.width = '40px';
    input.style.textAlign = 'center';
    input.style.background = '#0f3460';
    input.style.color = '#fff';
    input.style.border = '1px solid #00d4ff';

    input.onblur = () => {
        let val = input.value.trim();
        if (val !== '') {
            try {
                let num = parseInt(val);
                val = String(num).padStart(3, '0');
            } catch (e) { }
        }
        tableData[ri][ci] = val;
        td.textContent = val;
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') input.blur();
    };

    td.textContent = '';
    td.appendChild(input);
    input.focus();
}

function addColumn() {
    const newHeader = prompt('Enter new column name:');
    if (newHeader === null) return;
    headers.push(newHeader);
    tableData.forEach(row => row.push('000'));
    renderTable1();
    if (searchResults) {
        renderTable2();
        renderTable3();
        renderTable4();
    }
}

// ============ SEARCH LOGIC ============
function performSearch() {
    const input = document.getElementById('searchInput').value.trim();
    if (!input) return;

    // Check if it's an All Table search (All=123,456,...)
    const allMatch = input.match(/^all=(.+)$/i);
    if (allMatch) {
        performAllSearch(allMatch[1]);
        return;
    }

    // Check if it's a Probably Table search (Xp=DIGITS)
    const probMatch = input.match(/^(\d+)p=(.+)$/i);
    if (probMatch) {
        performProbablySearch(parseInt(probMatch[1]), probMatch[2]);
        return;
    }

    const parsed = parseSearchInput(input);
    if (!parsed) {
        alert('Invalid format. Use: top134,334,789 or middle245,751,359 or last356,280,103 or 0p=246');
        return;
    }

    const { position, numbers } = parsed;

    searchResults = {
        position: position,
        highlights: []
    };

    const colors = ['yellow', 'green', 'red'];

    for (let i = 0; i < numbers.length && i < 3; i++) {
        const digits = numbers[i].split('').map(Number);
        const squares = findSquares(position, digits);
        searchResults.highlights.push({
            color: colors[i],
            digits: digits,
            squares: squares
        });
    }

    document.getElementById('table2Section').style.display = 'block';
    document.getElementById('table3Section').style.display = 'block';
    document.getElementById('table4Section').style.display = 'block';
    document.getElementById('table5Section').style.display = 'none';

    renderTable2();
    renderTable3();
    renderTable4();
}

function parseSearchInput(input) {
    let position = '';
    let rest = '';

    if (input.toLowerCase().startsWith('top')) {
        position = 'top';
        rest = input.substring(3);
    } else if (input.toLowerCase().startsWith('middle')) {
        position = 'middle';
        rest = input.substring(6);
    } else if (input.toLowerCase().startsWith('last')) {
        position = 'last';
        rest = input.substring(4);
    } else {
        return null;
    }

    // A top/middle/last search is exactly three triples: yellow, green, red.
    // If more are entered, keep only the first three valid triples.
    const numbers = rest
        .split(',')
        .map(s => s.trim())
        .filter(s => /^\d{3}$/.test(s))
        .slice(0, 3);
    if (numbers.length === 0) return null;

    return { position, numbers };
}

function getDigitAtPosition(cellValue, position) {
    if (!cellValue || cellValue.length < 3) return -1;
    if (position === 'top') return parseInt(cellValue[0]);
    if (position === 'middle') return parseInt(cellValue[1]);
    if (position === 'last') return parseInt(cellValue[2]);
    return -1;
}

function findSquares(position, digits) {
    const squares = [];
    const numRows = tableData.length;
    const numCols = headers.length;
    const totalCells = numRows * numCols;
    const target = [...digits].sort().join('');

    // Read three cells vertically, top-to-bottom. After the last row of a
    // column, continue at the first row of the next column.
    for (let startLinear = 0; startLinear <= totalCells - 3; startLinear++) {
        const cells = [0, 1, 2].map(offset => {
            const linear = startLinear + offset;
            const col = Math.floor(linear / numRows);
            const row = linear % numRows;
            return { row, col, value: tableData[row][col] };
        });

        const foundDigits = cells.map(cell => getDigitAtPosition(cell.value, position));
        if (foundDigits.some(digit => digit < 0)) continue;
        const found = foundDigits.sort().join('');

        if (found === target) {
            squares.push({
                col: cells[0].col,
                startRow: cells[0].row,
                cells: cells.map(({ row, col }) => ({ row, col }))
            });
        }
    }

    return squares;
}

// ============ TABLE 2: Search Results ============
function renderTable2() {
    const wrapper = document.getElementById('table2Wrapper');
    wrapper.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'table-inner';
    const table = document.createElement('table');
    table.id = 'table2';

    const highlightMap = buildHighlightMap();

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'No.';
    rowNumTh.className = 'row-number';
    headerRow.appendChild(rowNumTh);

    headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.forEach((row, ri) => {
        const tr = document.createElement('tr');
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.textContent = ri + 1;
        tr.appendChild(rowNumTd);

        row.forEach((cell, ci) => {
            const td = document.createElement('td');
            td.textContent = cell;
            const key = `${ri}-${ci}`;
            if (highlightMap[key]) {
                td.className = `highlight-${highlightMap[key]}`;
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    inner.appendChild(table);
    wrapper.appendChild(inner);
}

function buildHighlightMap() {
    const map = {};
    if (!searchResults) return map;

    searchResults.highlights.forEach(h => {
        h.squares.forEach(sq => {
            const cells = sq.cells || [
                { row: sq.startRow, col: sq.col },
                { row: sq.startRow + 1, col: sq.col },
                { row: sq.startRow + 2, col: sq.col }
            ];
            cells.forEach(({ row, col }) => {
                const key = `${row}-${col}`;
                if (!map[key]) map[key] = h.color;
            });
        });
    });

    return map;
}

// ============ TABLE 3: Gap Calculation Left to Right ============
function renderTable3() {
    const wrapper = document.getElementById('table3Wrapper');
    wrapper.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'table-inner';
    const table = document.createElement('table');
    table.id = 'table3';

    const connections = calculateGapConnectionsLTR();
    const connectionCells = buildConnectionCellMap(connections);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'No.';
    rowNumTh.className = 'row-number';
    headerRow.appendChild(rowNumTh);

    headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.forEach((row, ri) => {
        const tr = document.createElement('tr');
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.textContent = ri + 1;
        tr.appendChild(rowNumTd);

        row.forEach((cell, ci) => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.setAttribute('data-row', ri);
            td.setAttribute('data-col', ci);

            const key = `${ri}-${ci}`;
            if (connectionCells[key]) {
                td.className = `highlight-${connectionCells[key]}`;
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    inner.appendChild(table);
    wrapper.appendChild(inner);

    // Draw blue lines after render
    setTimeout(() => drawConnectionLines(wrapper, table, connections), 200);
}

// ============ TABLE 4: Gap Calculation Right to Left ============
function renderTable4() {
    const wrapper = document.getElementById('table4Wrapper');
    wrapper.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'table-inner';
    const table = document.createElement('table');
    table.id = 'table4';

    const connections = calculateGapConnectionsRTL();
    const connectionCells = buildConnectionCellMap(connections);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'No.';
    rowNumTh.className = 'row-number';
    headerRow.appendChild(rowNumTh);

    headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.forEach((row, ri) => {
        const tr = document.createElement('tr');
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.textContent = ri + 1;
        tr.appendChild(rowNumTd);

        row.forEach((cell, ci) => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.setAttribute('data-row', ri);
            td.setAttribute('data-col', ci);

            const key = `${ri}-${ci}`;
            if (connectionCells[key]) {
                td.className = `highlight-${connectionCells[key]}`;
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    inner.appendChild(table);
    wrapper.appendChild(inner);

    setTimeout(() => drawConnectionLines(wrapper, table, connections), 200);
}

// ============ GAP CALCULATION: LEFT TO RIGHT ============
// Logic: Start from leftmost column (col 69), scan left to right
// Find yellow first, then find green after it, calculate row gap
// If gap goes beyond 24 rows, continue to next column
// Then find red at same gap from green
// Only show connection if yellow→green gap == green→red gap
function calculateGapConnectionsLTR() {
    if (!searchResults || searchResults.highlights.length < 3) return [];

    const connections = [];
    const yellowSquares = searchResults.highlights[0].squares;
    const greenSquares = searchResults.highlights[1].squares;
    const redSquares = searchResults.highlights[2].squares;
    const numRows = tableData.length; // 24

    // Linear position for LTR: col_index * 24 + startRow
    // This allows gap to span across columns
    yellowSquares.forEach(yellow => {
        const yellowLinear = yellow.col * numRows + yellow.startRow;

        greenSquares.forEach(green => {
            const greenLinear = green.col * numRows + green.startRow;
            const gapYG = greenLinear - yellowLinear;

            if (gapYG <= 0) return; // green must come after yellow

            // Find red at same gap from green
            redSquares.forEach(red => {
                const redLinear = red.col * numRows + red.startRow;
                const gapGR = redLinear - greenLinear;

                if (gapYG === gapGR) {
                    connections.push({
                        yellow: yellow,
                        green: green,
                        red: red,
                        gap: gapYG
                    });
                }
            });
        });
    });

    return connections;
}

// ============ GAP CALCULATION: RIGHT TO LEFT ============
// Logic: Start from rightmost column (col 26), scan right to left
// Same gap logic but reversed direction
function calculateGapConnectionsRTL() {
    if (!searchResults || searchResults.highlights.length < 3) return [];

    const connections = [];
    const yellowSquares = searchResults.highlights[0].squares;
    const greenSquares = searchResults.highlights[1].squares;
    const redSquares = searchResults.highlights[2].squares;
    const numRows = tableData.length; // 24
    const numCols = headers.length;

    // Linear position for RTL: (numCols - 1 - col_index) * 24 + startRow
    // Rightmost column gets position 0, leftmost gets highest position
    yellowSquares.forEach(yellow => {
        const yellowLinear = (numCols - 1 - yellow.col) * numRows + yellow.startRow;

        greenSquares.forEach(green => {
            const greenLinear = (numCols - 1 - green.col) * numRows + green.startRow;
            const gapYG = greenLinear - yellowLinear;

            if (gapYG <= 0) return;

            redSquares.forEach(red => {
                const redLinear = (numCols - 1 - red.col) * numRows + red.startRow;
                const gapGR = redLinear - greenLinear;

                if (gapYG === gapGR) {
                    connections.push({
                        yellow: yellow,
                        green: green,
                        red: red,
                        gap: gapYG
                    });
                }
            });
        });
    });

    return connections;
}

// ============ BUILD CONNECTION CELL MAP ============
// Only cells that are part of valid connections get colored
// If no valid connection, cells stay uncolored (original)
function buildConnectionCellMap(connections) {
    const map = {};

    connections.forEach(conn => {
        [
            ['yellow', conn.yellow],
            ['green', conn.green],
            ['red', conn.red]
        ].forEach(([color, square]) => {
            const cells = square.cells || [
                { row: square.startRow, col: square.col },
                { row: square.startRow + 1, col: square.col },
                { row: square.startRow + 2, col: square.col }
            ];
            cells.forEach(({ row, col }) => {
                map[`${row}-${col}`] = color;
            });
        });
    });

    return map;
}

// ============ DRAW BLUE CONNECTION LINES ============
function drawConnectionLines(wrapper, table, connections) {
    // Remove existing SVG
    const existingSvg = wrapper.querySelector('.svg-overlay');
    if (existingSvg) existingSvg.remove();

    if (connections.length === 0) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('svg-overlay');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = table.scrollWidth + 'px';
    svg.style.height = table.scrollHeight + 'px';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '15';
    svg.setAttribute('width', table.scrollWidth);
    svg.setAttribute('height', table.scrollHeight);

    const tableRect = table.getBoundingClientRect();

    connections.forEach(conn => {
        // Use the middle item of each actual three-cell traversal.
        const middleCell = square => {
            const cells = square.cells || [
                { row: square.startRow, col: square.col },
                { row: square.startRow + 1, col: square.col },
                { row: square.startRow + 2, col: square.col }
            ];
            return getTableCell(table, cells[1].row, cells[1].col);
        };
        const yellowCell = middleCell(conn.yellow);
        const greenCell = middleCell(conn.green);
        const redCell = middleCell(conn.red);

        if (yellowCell && greenCell) {
            svg.appendChild(createSvgLine(yellowCell, greenCell, tableRect));
        }
        if (greenCell && redCell) {
            svg.appendChild(createSvgLine(greenCell, redCell, tableRect));
        }
    });

    wrapper.querySelector('.table-inner').style.position = 'relative';
    wrapper.querySelector('.table-inner').appendChild(svg);
}

function getTableCell(table, rowIdx, colIdx) {
    const rows = table.querySelectorAll('tbody tr');
    if (rowIdx < 0 || rowIdx >= rows.length) return null;
    const cells = rows[rowIdx].querySelectorAll('td');
    // cells[0] is row number, cells[colIdx+1] is the data cell
    if (colIdx + 1 >= cells.length) return null;
    return cells[colIdx + 1];
}

function createSvgLine(cell1, cell2, tableRect) {
    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();

    const x1 = rect1.left - tableRect.left + rect1.width / 2;
    const y1 = rect1.top - tableRect.top + rect1.height / 2;
    const x2 = rect2.left - tableRect.left + rect2.width / 2;
    const y2 = rect2.top - tableRect.top + rect2.height / 2;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#007bff');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-opacity', '0.9');
    line.setAttribute('stroke-linecap', 'round');
    return line;
}

// ============ PROBABLY TABLE ============
// Search format: Xp=DIGITS
// X = gap (0=adjacent rows, 1=1 row gap between each, etc.)
// DIGITS = sequence of digits to find (3-4 digits)
// 0p=246: find 2 in row1, 4 in row2, 6 in row3 (adjacent)
// 1p=246: find 2 in row1, 4 in row3, 6 in row5 (1 row gap)
// Must find ALL digits to show result (if only partial, don't show)
// Column overflow: if rows run out, continue to next column row1

function performProbablySearch(gap, digitsStr) {
    const digits = digitsStr.split('').map(Number);
    if (digits.length < 3 || digits.some(isNaN)) {
        alert('Invalid digits. Use at least 3 digits (e.g. 0p=246 or 1p=4567)');
        return;
    }

    // Hide other tables, show probably table
    document.getElementById('table2Section').style.display = 'none';
    document.getElementById('table3Section').style.display = 'none';
    document.getElementById('table4Section').style.display = 'none';
    document.getElementById('table5Section').style.display = 'block';

    const numRows = tableData.length; // 24
    const numCols = headers.length;
    const totalCells = numRows * numCols;
    const step = gap + 1; // 0p = step 1 (adjacent), 1p = step 2, etc.

    const results = []; // Each result: array of {col, row, digit, cellValue}

    // Scan every starting position (linear: col*24 + row)
    for (let startLinear = 0; startLinear < totalCells; startLinear++) {
        const sequence = [];
        let valid = true;

        for (let d = 0; d < digits.length; d++) {
            const linearPos = startLinear + d * step;
            if (linearPos >= totalCells) {
                valid = false;
                break;
            }

            const col = Math.floor(linearPos / numRows);
            const row = linearPos % numRows;

            if (col >= numCols) {
                valid = false;
                break;
            }

            const cellValue = tableData[row][col];
            if (!cellValue || cellValue.length < 3) {
                valid = false;
                break;
            }

            // Check if digit exists in any position of the 3-digit number
            const cellDigits = cellValue.split('').map(Number);
            if (!cellDigits.includes(digits[d])) {
                valid = false;
                break;
            }

            sequence.push({ col, row, digit: digits[d], cellValue });
        }

        if (valid && sequence.length === digits.length) {
            results.push(sequence);
        }
    }

    renderProbablyTable(results, gap, digits);
}

function renderProbablyTable(results, gap, digits) {
    const inner = document.getElementById('table5Inner');
    inner.innerHTML = '';

    if (results.length === 0) {
        inner.innerHTML = '<p style="color:#fbbf24;padding:20px;">No probably patterns found for this search.</p>';
        return;
    }

    // Build a full table showing all data with highlights and curved arrows
    const numRows = tableData.length;
    const numCols = headers.length;

    // Build highlight map: key = "row-col" => color
    const highlightMap = {};
    const arrowPairs = []; // [{from: {row,col}, to: {row,col}, colorIdx}]

    const pairColors = ['#fbbf24', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];

    results.forEach((seq, seqIdx) => {
        const colorIdx = seqIdx % pairColors.length;
        seq.forEach((item, itemIdx) => {
            const key = `${item.row}-${item.col}`;
            if (!highlightMap[key]) {
                highlightMap[key] = colorIdx;
            }
            // Draw arrows between consecutive items in the sequence
            if (itemIdx > 0) {
                arrowPairs.push({
                    from: { row: seq[itemIdx - 1].row, col: seq[itemIdx - 1].col },
                    to: { row: item.row, col: item.col },
                    colorIdx: colorIdx
                });
            }
        });
    });

    // Create table
    const table = document.createElement('table');
    table.id = 'probTable';
    table.className = 'data-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'No.';
    rowNumTh.className = 'row-number';
    headerRow.appendChild(rowNumTh);

    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let ri = 0; ri < numRows; ri++) {
        const tr = document.createElement('tr');
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.textContent = ri + 1;
        tr.appendChild(rowNumTd);

        for (let ci = 0; ci < numCols; ci++) {
            const td = document.createElement('td');
            td.textContent = tableData[ri][ci];
            td.id = `prob-cell-${ri}-${ci}`;

            const key = `${ri}-${ci}`;
            if (highlightMap[key] !== undefined) {
                const cIdx = highlightMap[key];
                td.style.backgroundColor = pairColors[cIdx];
                td.style.color = '#000';
                td.style.fontWeight = 'bold';
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    inner.appendChild(table);

    // Info text
    const info = document.createElement('div');
    info.style.padding = '10px';
    info.style.color = '#aaa';
    info.innerHTML = `<strong style="color:#fbbf24">Probably Table</strong> | Gap: ${gap}p | Digits: ${digits.join('')} | Found: ${results.length} pattern(s)`;
    inner.insertBefore(info, table);

    // Draw curved arrows after render
    setTimeout(() => drawProbablyArrows(arrowPairs, table, pairColors), 200);
}

function drawProbablyArrows(arrowPairs, table, pairColors) {
    const inner = document.getElementById('table5Inner');
    if (!inner || !table) return;

    // Remove existing SVG
    const existing = inner.querySelector('.svg-overlay');
    if (existing) existing.remove();

    if (arrowPairs.length === 0) return;

    const w = table.scrollWidth;
    const h = table.scrollHeight;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add('svg-overlay');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '15';
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);

    // Arrowhead markers
    const defs = document.createElementNS(svgNS, 'defs');
    pairColors.forEach((col, i) => {
        const marker = document.createElementNS(svgNS, 'marker');
        marker.setAttribute('id', 'prob-arr-' + i);
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '8');
        marker.setAttribute('refX', '6');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', 'M0,0 L6,3 L0,6 Z');
        path.setAttribute('fill', col);
        marker.appendChild(path);
        defs.appendChild(marker);
    });
    svg.appendChild(defs);

    const tableRect = table.getBoundingClientRect();

    arrowPairs.forEach(pair => {
        const cellA = document.getElementById(`prob-cell-${pair.from.row}-${pair.from.col}`);
        const cellB = document.getElementById(`prob-cell-${pair.to.row}-${pair.to.col}`);
        if (!cellA || !cellB) return;

        const rA = cellA.getBoundingClientRect();
        const rB = cellB.getBoundingClientRect();

        const x1 = rA.left - tableRect.left + rA.width / 2;
        const y1 = rA.top - tableRect.top + rA.height / 2;
        const x2 = rB.left - tableRect.left + rB.width / 2;
        const y2 = rB.top - tableRect.top + rB.height / 2;

        // Curved arrow (bezier)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bend = Math.min(80, Math.max(30, dist * 0.3));
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const px = -dy / (dist || 1);
        const py = dx / (dist || 1);
        const cx = mx + px * bend;
        const cy = my + py * bend;

        const colorIdx = pair.colorIdx;
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', pairColors[colorIdx]);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-opacity', '0.8');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('marker-end', `url(#prob-arr-${colorIdx})`);
        svg.appendChild(path);
    });

    inner.style.position = 'relative';
    inner.appendChild(svg);
}

// ============ ALL TABLE ============
// Search format: All=123,456,489 (minimum 2 numbers, comma separated)
// Logic:
// 1. Each number (e.g. 123) represents a cell value to find in the fix table
// 2. Find which ROW each number is in (search entire fix table)
// 3. From those rows, extract:
//    - Hundreds digits (first digit of each cell in those rows) → form a 3-digit combo
//    - Tens digits (second digit) → form a 3-digit combo  
//    - Last digits (third digit) → form a 3-digit combo
// 4. Search the fix table for cells containing those digit combos (permutations)
// 5. Display results with yellow highlight on the searched rows

function performAllSearch(numbersStr) {
    const numbers = numbersStr
        .split(',')
        .map(s => s.trim())
        .filter(s => /^\d{3}$/.test(s));

    if (numbers.length === 0) {
        alert('All Table: ဂဏန်းသုံးလုံးတွဲ အနည်းဆုံးတစ်ခု ထည့်ပါ။ (e.g. All=123,456,489)');
        return;
    }

    document.getElementById('table2Section').style.display = 'none';
    document.getElementById('table3Section').style.display = 'none';
    document.getElementById('table4Section').style.display = 'none';
    document.getElementById('table5Section').style.display = 'none';
    document.getElementById('table6Section').style.display = 'block';

    const numRows = tableData.length;
    const numCols = headers.length;
    const totalCells = numRows * numCols;
    const targets = new Set(numbers);
    const permutations = value => new Set(getPermutations3(value));

    // Each window is three consecutive cells in column-major order:
    // row 1-3, row 2-4, ... row 22-24, row 23 -> next column row 1, etc.
    const allFoundCells = [];
    const qualifyingWindows = [];

    for (let startLinear = 0; startLinear <= totalCells - 3; startLinear++) {
        const cells = [0, 1, 2].map(offset => {
            const linear = startLinear + offset;
            const col = Math.floor(linear / numRows);
            const row = linear % numRows;
            return { row, col, value: tableData[row][col] };
        });

        if (cells.some(cell => !/^\d{3}$/.test(cell.value))) continue;

        const digitCombos = {
            hundreds: cells.map(cell => cell.value[0]).join(''),
            tens: cells.map(cell => cell.value[1]).join(''),
            units: cells.map(cell => cell.value[2]).join('')
        };

        const matchedTypes = Object.entries(digitCombos)
            .filter(([, combo]) => [...permutations(combo)].some(value => targets.has(value)))
            .map(([type]) => type);

        // A window is displayed only when at least two of the three digit
        // types match. Two matches are yellow; all three matches are red.
        if (matchedTypes.length < 2) continue;

        const color = matchedTypes.length === 3 ? 'red' : 'yellow';
        qualifyingWindows.push({ cells, matchedTypes, digitCombos, color });
        cells.forEach(cell => {
            allFoundCells.push({
                row: cell.row,
                col: cell.col,
                type: matchedTypes.join(','),
                color,
                combo: digitCombos
            });
        });
    }

    const highlightMap = {};
    qualifyingWindows.forEach(window => {
        window.cells.forEach(({ row, col }) => {
            const key = `${row}-${col}`;
            // Red has priority if a cell belongs to both a two-type and a
            // three-type qualifying window.
            if (window.color === 'red' || !highlightMap[key]) {
                highlightMap[key] = window.color;
            }
        });
    });

    renderAllTable(highlightMap, qualifyingWindows, allFoundCells, numbers);
}

function getPermutations3(str) {
    // Get all unique permutations of a string of digits (length 2-4)
    const perms = new Set();
    const chars = str.split('');
    
    if (chars.length === 2) {
        perms.add(chars[0] + chars[1]);
        perms.add(chars[1] + chars[0]);
        return Array.from(perms);
    }
    
    if (chars.length === 3) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (j === i) continue;
                for (let k = 0; k < 3; k++) {
                    if (k === i || k === j) continue;
                    perms.add(chars[i] + chars[j] + chars[k]);
                }
            }
        }
        return Array.from(perms);
    }
    
    if (chars.length === 4) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (j === i) continue;
                for (let k = 0; k < 4; k++) {
                    if (k === i || k === j) continue;
                    // Take 3 at a time from 4 digits
                    perms.add(chars[i] + chars[j] + chars[k]);
                }
            }
        }
        return Array.from(perms);
    }
    
    // For other lengths, just return the string itself
    perms.add(str);
    return Array.from(perms);
}

function renderAllTable(highlightMap, validRows, foundCells, searchNumbers) {
    const inner = document.getElementById('table6Inner');
    inner.innerHTML = '';
    
    const numRows = tableData.length;
    const numCols = headers.length;
    
    // Info header
    const info = document.createElement('div');
    info.style.padding = '10px';
    info.style.color = '#aaa';
    const redWindows = validRows.filter(window => window.color === 'red').length;
    const yellowWindows = validRows.filter(window => window.color === 'yellow').length;
    info.innerHTML = `<strong style="color:#fbbf24">All Table</strong> | Search: ${searchNumbers.join(', ')} | ` +
        `Qualifying 3-row windows: ${validRows.length} | Yellow: ${yellowWindows} | Red: ${redWindows}`;
    inner.appendChild(info);
    
    // Create table
    const table = document.createElement('table');
    table.id = 'allTable';
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'No.';
    rowNumTh.className = 'row-number';
    headerRow.appendChild(rowNumTh);
    
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    for (let ri = 0; ri < numRows; ri++) {
        const tr = document.createElement('tr');
        const rowNumTd = document.createElement('td');
        rowNumTd.className = 'row-number';
        rowNumTd.textContent = ri + 1;
        tr.appendChild(rowNumTd);
        
        for (let ci = 0; ci < numCols; ci++) {
            const td = document.createElement('td');
            td.textContent = tableData[ri][ci];
            td.id = `all-cell-${ri}-${ci}`;
            
            const key = `${ri}-${ci}`;
            if (highlightMap[key] === 'yellow') {
                td.className = 'highlight-yellow';
            } else if (highlightMap[key] === 'red') {
                td.className = 'highlight-red';
            } else if (highlightMap[key] === 'green') {
                td.className = 'highlight-green';
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    inner.appendChild(table);
    
    // Results are represented directly by the qualifying three-row windows;
    // the old arrows depended on the removed fixed-row search model.
}
