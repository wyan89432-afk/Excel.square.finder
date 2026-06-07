// Global state
let tableData = JSON.parse(JSON.stringify(TABLE_DATA));
let headers = [...TABLE_HEADERS];
let searchResults = null; // stores highlight info

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTable1();
});

// ============ TABLE 1: Fixed/Editable Table ============
function renderTable1() {
    const table = document.getElementById('table1');
    table.innerHTML = '';
    
    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const rowNumTh = document.createElement('th');
    rowNumTh.textContent = 'Row';
    rowNumTh.className = 'row-number';
    headerRow.appendChild(rowNumTh);
    
    headers.forEach((h, ci) => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Data rows
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
            } catch(e) {}
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
    }
}

// ============ SEARCH LOGIC ============
function performSearch() {
    const input = document.getElementById('searchInput').value.trim();
    if (!input) return;
    
    // Parse search input
    const parsed = parseSearchInput(input);
    if (!parsed) {
        alert('Invalid format. Use: top134,334,789 or middle245,751,359 or last356,280,103');
        return;
    }
    
    const { position, numbers } = parsed;
    
    // Find squares for each number
    searchResults = {
        position: position,
        highlights: [] // [{color, squares: [{col, startRow}]}]
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
    
    // Show results
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
    
    // Check every group of 3 consecutive rows in each column
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
    
    // Build highlight map
    const highlightMap = buildHighlightMap();
    
    // Header row
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
    
    // Data rows
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
                // Don't overwrite earlier colors (priority: yellow > green > red)
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
    const connections = calculateGapConnections('ltr');
    const connectionMap = buildConnectionMap(connections);
    
    // Header row
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
    
    // Data rows
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
            if (connectionMap[key]) {
                td.classList.add('connection-line');
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    // Draw connection lines
    drawConnections('table3Wrapper', connections);
}

// ============ TABLE 4: Gap Calculation Right to Left ============
function renderTable4() {
    const table = document.getElementById('table4');
    table.innerHTML = '';
    
    const highlightMap = buildHighlightMap();
    const connections = calculateGapConnections('rtl');
    const connectionMap = buildConnectionMap(connections);
    
    // Header row
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
    
    // Data rows
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
            if (connectionMap[key]) {
                td.classList.add('connection-line');
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    // Draw connection lines
    drawConnections('table4Wrapper', connections);
}

// ============ GAP CALCULATION LOGIC ============
function calculateGapConnections(direction) {
    if (!searchResults || searchResults.highlights.length < 2) return [];
    
    const connections = [];
    const yellowSquares = searchResults.highlights[0] ? searchResults.highlights[0].squares : [];
    const greenSquares = searchResults.highlights[1] ? searchResults.highlights[1].squares : [];
    const redSquares = searchResults.highlights.length > 2 ? searchResults.highlights[2].squares : [];
    
    const numRows = tableData.length; // 24
    const numCols = headers.length;
    
    // For each yellow square, find green squares with same gap to red
    yellowSquares.forEach(yellow => {
        greenSquares.forEach(green => {
            // Calculate gap between yellow and green
            let yellowPos, greenPos, gap;
            
            if (direction === 'ltr') {
                // Left to right: compare by column position first, then row
                yellowPos = yellow.col * numRows + yellow.startRow;
                greenPos = green.col * numRows + green.startRow;
                gap = greenPos - yellowPos;
            } else {
                // Right to left: reverse column direction
                yellowPos = (numCols - 1 - yellow.col) * numRows + yellow.startRow;
                greenPos = (numCols - 1 - green.col) * numRows + green.startRow;
                gap = greenPos - yellowPos;
            }
            
            if (gap <= 0) return; // green must come after yellow
            
            // Look for red at same gap from green
            redSquares.forEach(red => {
                let redPos;
                if (direction === 'ltr') {
                    redPos = red.col * numRows + red.startRow;
                } else {
                    redPos = (numCols - 1 - red.col) * numRows + red.startRow;
                }
                
                const gapGreenRed = redPos - greenPos;
                
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

function buildConnectionMap(connections) {
    const map = {};
    connections.forEach(conn => {
        // Mark all cells in the connected squares
        for (let r = 0; r < 3; r++) {
            map[`${conn.yellow.startRow + r}-${conn.yellow.col}`] = true;
            map[`${conn.green.startRow + r}-${conn.green.col}`] = true;
            map[`${conn.red.startRow + r}-${conn.red.col}`] = true;
        }
    });
    return map;
}

function drawConnections(wrapperId, connections) {
    const wrapper = document.getElementById(wrapperId);
    
    // Remove existing SVG
    const existingSvg = wrapper.querySelector('.svg-overlay');
    if (existingSvg) existingSvg.remove();
    
    if (connections.length === 0) return;
    
    const table = wrapper.querySelector('table');
    if (!table) return;
    
    // Wait for render
    setTimeout(() => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('svg-overlay');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = table.offsetWidth + 'px';
        svg.style.height = table.offsetHeight + 'px';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '5';
        
        connections.forEach(conn => {
            // Get cell positions
            const yellowCell = getCellElement(table, conn.yellow.startRow + 1, conn.yellow.col + 1);
            const greenCell = getCellElement(table, conn.green.startRow + 1, conn.green.col + 1);
            const redCell = getCellElement(table, conn.red.startRow + 1, conn.red.col + 1);
            
            if (yellowCell && greenCell) {
                drawLine(svg, yellowCell, greenCell, table);
            }
            if (greenCell && redCell) {
                drawLine(svg, greenCell, redCell, table);
            }
        });
        
        wrapper.style.position = 'relative';
        wrapper.appendChild(svg);
    }, 100);
}

function getCellElement(table, rowIdx, colIdx) {
    // rowIdx is 1-based (data row), colIdx is 1-based (after row number column)
    const rows = table.querySelectorAll('tbody tr');
    if (rowIdx < 1 || rowIdx > rows.length) return null;
    const cells = rows[rowIdx - 1].querySelectorAll('td');
    if (colIdx < 1 || colIdx >= cells.length) return null;
    return cells[colIdx]; // +0 because first td is row number
}

function drawLine(svg, cell1, cell2, table) {
    const tableRect = table.getBoundingClientRect();
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
    line.setAttribute('stroke-opacity', '0.8');
    svg.appendChild(line);
}

// Enter key support for search
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});
