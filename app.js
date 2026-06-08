// Global state
let tableData = JSON.parse(JSON.stringify(TABLE_DATA));
let headers = [...TABLE_HEADERS];
let searchResults = null;
let zoomLevels = { table1: 1, table2: 1, table3: 1, table4: 1 };

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
    ['table1Wrapper', 'table2Wrapper', 'table3Wrapper', 'table4Wrapper'].forEach(id => {
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
        for (let r = 0; r < 3; r++) {
            map[`${conn.yellow.startRow + r}-${conn.yellow.col}`] = 'yellow';
            map[`${conn.green.startRow + r}-${conn.green.col}`] = 'green';
            map[`${conn.red.startRow + r}-${conn.red.col}`] = 'red';
        }
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
        // Get the middle cell of each 3-row square (startRow + 1)
        const yellowCell = getTableCell(table, conn.yellow.startRow + 1, conn.yellow.col);
        const greenCell = getTableCell(table, conn.green.startRow + 1, conn.green.col);
        const redCell = getTableCell(table, conn.red.startRow + 1, conn.red.col);

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
