// Global state
let tableData = JSON.parse(JSON.stringify(TABLE_DATA));
let headers = [...TABLE_HEADERS];
let searchResults = null;
let zoomLevels = { table1: 1, table2: 1, table3: 1, table4: 1 };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTable1();
    setupZoom();
});

// ============ ZOOM FEATURE ============
function setupZoom() {
    ['table1Wrapper', 'table2Wrapper', 'table3Wrapper', 'table4Wrapper'].forEach(id => {
        const wrapper = document.getElementById(id);
        if (!wrapper) return;
        wrapper.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const tableKey = id.replace('Wrapper', '');
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                zoomLevels[tableKey] = Math.max(0.3, Math.min(2.5, zoomLevels[tableKey] + delta));
                const table = wrapper.querySelector('table');
                if (table) {
                    table.style.transform = `scale(${zoomLevels[tableKey]})`;
                    table.style.transformOrigin = 'top left';
                }
            }
        }, { passive: false });
    });
}

function zoomIn(tableId) {
    const key = tableId;
    zoomLevels[key] = Math.min(2.5, zoomLevels[key] + 0.1);
    applyZoom(key);
}

function zoomOut(tableId) {
    const key = tableId;
    zoomLevels[key] = Math.max(0.3, zoomLevels[key] - 0.1);
    applyZoom(key);
}

function zoomReset(tableId) {
    zoomLevels[tableId] = 1;
    applyZoom(tableId);
}

function applyZoom(tableId) {
    const wrapper = document.getElementById(tableId + 'Wrapper');
    if (!wrapper) return;
    const table = wrapper.querySelector('table');
    if (table) {
        table.style.transform = `scale(${zoomLevels[tableId]})`;
        table.style.transformOrigin = 'top left';
    }
}

// ============ TABLE 1: Fixed/Editable Table ============
function renderTable1() {
    const table = document.getElementById('table1');
    table.innerHTML = '';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'Row';
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

    const parsed = parseSearchInput(input);
    if (!parsed) {
        alert('Invalid format. Use: top134,334,789 or middle245,751,359 or last356,280,103');
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

    const numbers = rest.split(',').map(s => s.trim()).filter(s => s.length === 3 && /^\d{3}$/.test(s));
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

    for (let col = 0; col < numCols; col++) {
        for (let startRow = 0; startRow <= numRows - 3; startRow++) {
            const d1 = getDigitAtPosition(tableData[startRow][col], position);
            const d2 = getDigitAtPosition(tableData[startRow + 1][col], position);
            const d3 = getDigitAtPosition(tableData[startRow + 2][col], position);

            if (d1 < 0 || d2 < 0 || d3 < 0) continue;

            const found = [d1, d2, d3].sort().join('');
            const target = [...digits].sort().join('');

            if (found === target) {
                squares.push({ col: col, startRow: startRow });
            }
        }
    }

    return squares;
}

// ============ TABLE 2: Search Results ============
function renderTable2() {
    const table = document.getElementById('table2');
    table.innerHTML = '';

    const highlightMap = buildHighlightMap();

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'Row';
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
}

function buildHighlightMap() {
    const map = {};
    if (!searchResults) return map;

    searchResults.highlights.forEach(h => {
        h.squares.forEach(sq => {
            for (let r = 0; r < 3; r++) {
                const key = `${sq.startRow + r}-${sq.col}`;
                if (!map[key]) {
                    map[key] = h.color;
                }
            }
        });
    });

    return map;
}

// ============ TABLE 3: Gap Calculation Left to Right ============
function renderTable3() {
    const table = document.getElementById('table3');
    table.innerHTML = '';

    const highlightMap = buildHighlightMap();
    const connections = calculateGapConnectionsLTR();
    const connectionCells = buildConnectionCellMap(connections);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'Row';
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
            } else if (highlightMap[key]) {
                // Only show highlight if part of a valid connection
                // Keep original style (no highlight) if not connected
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Draw blue lines
    setTimeout(() => drawConnectionLines('table3Wrapper', table, connections), 150);
}

// ============ TABLE 4: Gap Calculation Right to Left ============
function renderTable4() {
    const table = document.getElementById('table4');
    table.innerHTML = '';

    const highlightMap = buildHighlightMap();
    const connections = calculateGapConnectionsRTL();
    const connectionCells = buildConnectionCellMap(connections);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'Row';
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

    setTimeout(() => drawConnectionLines('table4Wrapper', table, connections), 150);
}

// ============ GAP CALCULATION: LEFT TO RIGHT ============
function calculateGapConnectionsLTR() {
    if (!searchResults || searchResults.highlights.length < 3) return [];

    const connections = [];
    const yellowSquares = searchResults.highlights[0].squares;
    const greenSquares = searchResults.highlights[1].squares;
    const redSquares = searchResults.highlights[2].squares;
    const numRows = tableData.length; // 24

    // Sort squares by column (left to right), then by startRow
    const sortLTR = (a, b) => a.col !== b.col ? a.col - b.col : a.startRow - b.startRow;
    const sortedYellow = [...yellowSquares].sort(sortLTR);
    const sortedGreen = [...greenSquares].sort(sortLTR);
    const sortedRed = [...redSquares].sort(sortLTR);

    // For each yellow square, look for green squares to the right (or same column, below)
    sortedYellow.forEach(yellow => {
        sortedGreen.forEach(green => {
            // Green must be to the right of or after yellow (LTR)
            // Calculate linear position: col * numRows + startRow
            const yellowLinear = yellow.col * numRows + yellow.startRow;
            const greenLinear = green.col * numRows + green.startRow;
            const gap = greenLinear - yellowLinear;

            if (gap <= 0) return;

            // Now find red at same gap from green
            sortedRed.forEach(red => {
                const redLinear = red.col * numRows + red.startRow;
                const gapGreenRed = redLinear - greenLinear;

                if (gap === gapGreenRed) {
                    connections.push({
                        yellow: yellow,
                        green: green,
                        red: red,
                        gap: gap
                    });
                }
            });
        });
    });

    return connections;
}

// ============ GAP CALCULATION: RIGHT TO LEFT ============
function calculateGapConnectionsRTL() {
    if (!searchResults || searchResults.highlights.length < 3) return [];

    const connections = [];
    const yellowSquares = searchResults.highlights[0].squares;
    const greenSquares = searchResults.highlights[1].squares;
    const redSquares = searchResults.highlights[2].squares;
    const numRows = tableData.length; // 24
    const numCols = headers.length;

    // For RTL, we reverse the column order for linear position
    // rightmost column = position 0
    const sortRTL = (a, b) => {
        const aPos = (numCols - 1 - a.col) * numRows + a.startRow;
        const bPos = (numCols - 1 - b.col) * numRows + b.startRow;
        return aPos - bPos;
    };

    const sortedYellow = [...yellowSquares].sort(sortRTL);
    const sortedGreen = [...greenSquares].sort(sortRTL);
    const sortedRed = [...redSquares].sort(sortRTL);

    sortedYellow.forEach(yellow => {
        const yellowLinear = (numCols - 1 - yellow.col) * numRows + yellow.startRow;

        sortedGreen.forEach(green => {
            const greenLinear = (numCols - 1 - green.col) * numRows + green.startRow;
            const gap = greenLinear - yellowLinear;

            if (gap <= 0) return;

            sortedRed.forEach(red => {
                const redLinear = (numCols - 1 - red.col) * numRows + red.startRow;
                const gapGreenRed = redLinear - greenLinear;

                if (gap === gapGreenRed) {
                    connections.push({
                        yellow: yellow,
                        green: green,
                        red: red,
                        gap: gap
                    });
                }
            });
        });
    });

    return connections;
}

// ============ BUILD CONNECTION CELL MAP ============
function buildConnectionCellMap(connections) {
    const map = {};

    connections.forEach(conn => {
        for (let r = 0; r < 3; r++) {
            map[`${conn.yellow.startRow + r}-${conn.yellow.col}`] = 'yellow';
            map[`${conn.green.startRow + r}-${conn.green.col}`] = 'green';
            map[`${conn.red.startRow + r}-${conn.red.col}`] = 'red';
        }
    });

    return map;
}

// ============ DRAW BLUE CONNECTION LINES ============
function drawConnectionLines(wrapperId, table, connections) {
    const wrapper = document.getElementById(wrapperId);

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
    svg.style.zIndex = '5';
    svg.setAttribute('width', table.scrollWidth);
    svg.setAttribute('height', table.scrollHeight);

    const tableRect = table.getBoundingClientRect();

    connections.forEach(conn => {
        // Get middle cell of each square (row+1 of the 3)
        const yellowCell = getTableCell(table, conn.yellow.startRow + 1, conn.yellow.col);
        const greenCell = getTableCell(table, conn.green.startRow + 1, conn.green.col);
        const redCell = getTableCell(table, conn.red.startRow + 1, conn.red.col);

        if (yellowCell && greenCell) {
            const line = createSvgLine(yellowCell, greenCell, tableRect);
            svg.appendChild(line);
        }
        if (greenCell && redCell) {
            const line = createSvgLine(greenCell, redCell, tableRect);
            svg.appendChild(line);
        }
    });

    wrapper.style.position = 'relative';
    wrapper.appendChild(svg);
}

function getTableCell(table, rowIdx, colIdx) {
    // rowIdx is 0-based data row, colIdx is 0-based column
    const rows = table.querySelectorAll('tbody tr');
    if (rowIdx < 0 || rowIdx >= rows.length) return null;
    const cells = rows[rowIdx].querySelectorAll('td');
    // cells[0] is row number, cells[1] is first data column
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
    line.setAttribute('stroke-opacity', '0.85');
    line.setAttribute('stroke-linecap', 'round');
    return line;
}

// Enter key support for search
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});
