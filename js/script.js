// === TOKENIZER ===
const KEYWORDS = ['gets', 'var', 'print', 'if', 'then', 'elseif', 'else', 'endif', 
                  'while', 'do', 'endwhile', 'repeat', 'times', 'endrepeat',
                  'sub', 'does', 'endsub', 'call', 'exit', 'true', 'false'];
const UNARY_OPS = ['!', '#'];
const BINARY_OPS = ['&', '|', '+', '*', '/', '%', '^', '@', '=', '\\', '>', '<'];
const DELIMITERS = ['(', ')', '[', ']', '"'];

function tokenize(input) {
    const tokens = [];
    let i = 0;
    
    while (i < input.length) {
        if (/\s/.test(input[i])) { i++; continue; }
        
        if (input[i] === '"') {
            let str = '"'; i++;
            while (i < input.length && input[i] !== '"') {
                if (/\s/.test(input[i]) || input[i] === "'") {
                    throw new Error(`Invalid character in string: '${input[i]}' at position ${i}`);
                }
                str += input[i]; i++;
            }
            if (i >= input.length) throw new Error('Unterminated string literal');
            str += '"'; i++;
            tokens.push({ type: 'STRING', value: str });
            continue;
        }
        
        if (DELIMITERS.includes(input[i]) || UNARY_OPS.includes(input[i]) || BINARY_OPS.includes(input[i])) {
            tokens.push({ type: 'SYMBOL', value: input[i] }); i++; continue;
        }
        
        if (/\d/.test(input[i]) || (input[i] === '-' && i + 1 < input.length && /\d/.test(input[i + 1]))) {
            let num = '';
            if (input[i] === '-') { num = '-'; i++; }
            while (i < input.length && /\d/.test(input[i])) { num += input[i]; i++; }
            tokens.push({ type: 'INTEGER', value: num });
            continue;
        }
        
        if (/[a-zA-Z]/.test(input[i])) {
            let id = '';
            while (i < input.length && /[a-zA-Z0-9]/.test(input[i])) { id += input[i]; i++; }
            tokens.push({ type: KEYWORDS.includes(id) ? 'KEYWORD' : 'ID', value: id });
            continue;
        }
        
        throw new Error(`Unexpected character: '${input[i]}' at position ${i}`);
    }
    return tokens;
}

// === PARSER ===
class Parser {
    constructor(tokens) { this.tokens = tokens; this.pos = 0; }
    peek() { return this.tokens[this.pos] || null; }
    consume(expectedType, expectedValue) {
        const token = this.peek();
        if (!token) throw new Error(`Unexpected end of input, expected ${expectedValue || expectedType}`);
        if (expectedType && token.type !== expectedType) throw new Error(`Expected ${expectedType} but got ${token.type} ('${token.value}')`);
        if (expectedValue && token.value !== expectedValue) throw new Error(`Expected '${expectedValue}' but got '${token.value}'`);
        this.pos++; return token;
    }
    isAtEnd() { return this.pos >= this.tokens.length; }
    
    parseId() {
        const token = this.consume('ID');
        const node = { type: 'nonterminal', label: '<id>', children: [] };
        for (const char of token.value) {
            node.children.push({
                type: 'nonterminal',
                label: /[a-zA-Z]/.test(char) ? '<letter>' : '<digit>',
                children: [{ type: 'terminal', label: char }]
            });
        }
        return node;
    }
    
    parseInteger() {
        const token = this.consume('INTEGER');
        const node = { type: 'nonterminal', label: '<integer>', children: [] };
        let value = token.value;
        if (value.startsWith('-')) {
            node.children.push({ type: 'terminal', label: '-' });
            value = value.substring(1);
        }
        for (const digit of value) {
            node.children.push({
                type: 'nonterminal', label: '<digit>',
                children: [{ type: 'terminal', label: digit }]
            });
        }
        return node;
    }
    
    parseString() {
        const token = this.consume('STRING');
        const node = { type: 'nonterminal', label: '<string>', children: [{ type: 'terminal', label: '"' }] };
        for (const char of token.value.slice(1, -1)) {
            node.children.push({
                type: 'nonterminal', label: '<nwnq>',
                children: [{ type: 'terminal', label: char }]
            });
        }
        node.children.push({ type: 'terminal', label: '"' });
        return node;
    }
    
    parseBoolean() {
        const token = this.consume('KEYWORD');
        if (token.value !== 'true' && token.value !== 'false') throw new Error(`Expected boolean, got '${token.value}'`);
        return { type: 'nonterminal', label: '<boolean>', children: [{ type: 'keyword', label: token.value }] };
    }
    
    parseList() {
        const node = { type: 'nonterminal', label: '<list>', children: [{ type: 'terminal', label: '[' }] };
        this.consume('SYMBOL', '[');
        while (this.peek() && this.peek().value !== ']') node.children.push(this.parseExpr());
        this.consume('SYMBOL', ']');
        node.children.push({ type: 'terminal', label: ']' });
        return node;
    }
    
    parseExpr() {
        const token = this.peek();
        if (!token) throw new Error('Unexpected end of input while parsing expression');
        const node = { type: 'nonterminal', label: '<expr>', children: [] };
        
        if (token.type === 'INTEGER') node.children.push(this.parseInteger());
        else if (token.type === 'KEYWORD' && (token.value === 'true' || token.value === 'false')) node.children.push(this.parseBoolean());
        else if (token.type === 'STRING') node.children.push(this.parseString());
        else if (token.value === '[') node.children.push(this.parseList());
        else if (token.type === 'ID') node.children.push(this.parseId());
        else if (token.value === '(') {
            this.consume('SYMBOL', '(');
            node.children.push({ type: 'terminal', label: '(' });
            const next = this.peek();
            if (next && UNARY_OPS.includes(next.value)) {
                const op = this.consume('SYMBOL');
                node.children.push({ type: 'nonterminal', label: '<unary-op>', children: [{ type: 'operator', label: op.value }] });
                node.children.push(this.parseExpr());
            } else {
                node.children.push(this.parseExpr());
                const opToken = this.peek();
                if (!opToken || !BINARY_OPS.includes(opToken.value)) throw new Error(`Expected binary operator, got '${opToken ? opToken.value : 'end of input'}'`);
                this.consume('SYMBOL');
                node.children.push({ type: 'nonterminal', label: '<binary-op>', children: [{ type: 'operator', label: opToken.value }] });
                node.children.push(this.parseExpr());
            }
            this.consume('SYMBOL', ')');
            node.children.push({ type: 'terminal', label: ')' });
        } else throw new Error(`Invalid expression starting with '${token.value}'`);
        return node;
    }
    
    parseAssign() {
        const node = { type: 'nonterminal', label: '<assign>', children: [] };
        node.children.push(this.parseId());
        this.consume('KEYWORD', 'gets');
        node.children.push({ type: 'keyword', label: 'gets' });
        node.children.push(this.parseExpr());
        return node;
    }
    
    parseVar() {
        const node = { type: 'nonterminal', label: '<var>', children: [] };
        this.consume('KEYWORD', 'var');
        node.children.push({ type: 'keyword', label: 'var' });
        node.children.push(this.parseAssign());
        return node;
    }
    
    parsePrint() {
        const node = { type: 'nonterminal', label: '<print>', children: [] };
        this.consume('KEYWORD', 'print');
        node.children.push({ type: 'keyword', label: 'print' });
        node.children.push(this.parseExpr());
        return node;
    }
    
    parseBody(endKeywords) {
        const node = { type: 'nonterminal', label: '<body>', children: [] };
        while (this.peek() && !endKeywords.includes(this.peek().value)) node.children.push(this.parseStatement());
        return node;
    }
    
    parseIf() {
        const node = { type: 'nonterminal', label: '<if>', children: [] };
        this.consume('KEYWORD', 'if'); node.children.push({ type: 'keyword', label: 'if' });
        node.children.push(this.parseExpr());
        this.consume('KEYWORD', 'then'); node.children.push({ type: 'keyword', label: 'then' });
        node.children.push(this.parseBody(['elseif', 'else', 'endif']));
        while (this.peek() && this.peek().value === 'elseif') {
            this.consume('KEYWORD', 'elseif'); node.children.push({ type: 'keyword', label: 'elseif' });
            node.children.push(this.parseExpr());
            this.consume('KEYWORD', 'then'); node.children.push({ type: 'keyword', label: 'then' });
            node.children.push(this.parseBody(['elseif', 'else', 'endif']));
        }
        if (this.peek() && this.peek().value === 'else') {
            this.consume('KEYWORD', 'else'); node.children.push({ type: 'keyword', label: 'else' });
            node.children.push(this.parseBody(['endif']));
        }
        this.consume('KEYWORD', 'endif'); node.children.push({ type: 'keyword', label: 'endif' });
        return node;
    }
    
    parseWhile() {
        const node = { type: 'nonterminal', label: '<while>', children: [] };
        this.consume('KEYWORD', 'while'); node.children.push({ type: 'keyword', label: 'while' });
        node.children.push(this.parseExpr());
        this.consume('KEYWORD', 'do'); node.children.push({ type: 'keyword', label: 'do' });
        node.children.push(this.parseBody(['endwhile']));
        this.consume('KEYWORD', 'endwhile'); node.children.push({ type: 'keyword', label: 'endwhile' });
        return node;
    }
    
    parseRepeat() {
        const node = { type: 'nonterminal', label: '<repeat>', children: [] };
        this.consume('KEYWORD', 'repeat'); node.children.push({ type: 'keyword', label: 'repeat' });
        node.children.push(this.parseExpr());
        this.consume('KEYWORD', 'times'); node.children.push({ type: 'keyword', label: 'times' });
        node.children.push(this.parseBody(['endrepeat']));
        this.consume('KEYWORD', 'endrepeat'); node.children.push({ type: 'keyword', label: 'endrepeat' });
        return node;
    }
    
    parseSub() {
        const node = { type: 'nonterminal', label: '<sub>', children: [] };
        this.consume('KEYWORD', 'sub'); node.children.push({ type: 'keyword', label: 'sub' });
        node.children.push(this.parseId());
        this.consume('SYMBOL', '('); node.children.push({ type: 'terminal', label: '(' });
        while (this.peek() && this.peek().type === 'ID') node.children.push(this.parseId());
        this.consume('SYMBOL', ')'); node.children.push({ type: 'terminal', label: ')' });
        this.consume('KEYWORD', 'does'); node.children.push({ type: 'keyword', label: 'does' });
        node.children.push(this.parseBody(['endsub']));
        this.consume('KEYWORD', 'endsub'); node.children.push({ type: 'keyword', label: 'endsub' });
        return node;
    }
    
    parseCall() {
        const node = { type: 'nonterminal', label: '<call>', children: [] };
        this.consume('KEYWORD', 'call'); node.children.push({ type: 'keyword', label: 'call' });
        node.children.push(this.parseId());
        this.consume('SYMBOL', '('); node.children.push({ type: 'terminal', label: '(' });
        while (this.peek() && this.peek().value !== ')') node.children.push(this.parseExpr());
        this.consume('SYMBOL', ')'); node.children.push({ type: 'terminal', label: ')' });
        return node;
    }
    
    parseExit() {
        this.consume('KEYWORD', 'exit');
        return { type: 'nonterminal', label: '<exit>', children: [{ type: 'keyword', label: 'exit' }] };
    }
    
    parseStatement() {
        const token = this.peek();
        if (!token) throw new Error('Unexpected end of input while parsing statement');
        const node = { type: 'nonterminal', label: '<statement>', children: [] };
        if (token.value === 'var') node.children.push(this.parseVar());
        else if (token.value === 'print') node.children.push(this.parsePrint());
        else if (token.value === 'if') node.children.push(this.parseIf());
        else if (token.value === 'while') node.children.push(this.parseWhile());
        else if (token.value === 'repeat') node.children.push(this.parseRepeat());
        else if (token.value === 'sub') node.children.push(this.parseSub());
        else if (token.value === 'call') node.children.push(this.parseCall());
        else if (token.value === 'exit') node.children.push(this.parseExit());
        else if (token.type === 'ID') node.children.push(this.parseAssign());
        else throw new Error(`Invalid statement starting with '${token.value}'`);
        return node;
    }
}

// === TREE RENDERING ===
let viewMode = 'visual';
let colorMode = 'colored';
let zoomLevel = 100;

function renderTreeVisual(node) {
    if (!node.children || node.children.length === 0) {
        return `<span class="node ${node.type}">${escapeHtml(node.label)}</span>`;
    }
    let html = `<span class="node ${node.type}">${escapeHtml(node.label)}</span>`;
    html += '<ul>';
    for (const child of node.children) {
        html += `<li>${renderTreeVisual(child)}</li>`;
    }
    html += '</ul>';
    return html;
}

function renderTreeText(node, prefix = '', isLast = true) {
    const connector = isLast ? '└── ' : '├── ';
    let result = prefix + connector + node.label + '\n';
    if (node.children) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        for (let i = 0; i < node.children.length; i++) {
            result += renderTreeText(node.children[i], childPrefix, i === node.children.length - 1);
        }
    }
    return result;
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setView(mode) {
    viewMode = mode;
    document.getElementById('btnText').classList.toggle('active', mode === 'text');
    document.getElementById('btnVisual').classList.toggle('active', mode === 'visual');
    const output = document.getElementById('treeOutput');
    if (output.dataset.tree) {
        const tree = JSON.parse(output.dataset.tree);
        displayTree(tree);
    }
}

function toggleColor() {
    colorMode = colorMode === 'colored' ? 'bw' : 'colored';
    const btn = document.getElementById('btnBW');
    btn.classList.toggle('active', colorMode === 'bw');
    btn.textContent = colorMode === 'bw' ? 'Color' : 'B&W';
    
    const output = document.getElementById('treeOutput');
    output.classList.toggle('colored', colorMode === 'colored');
    output.classList.toggle('bw', colorMode === 'bw');
    
    const legend = document.getElementById('legend');
    legend.classList.toggle('bw', colorMode === 'bw');
}

function zoomIn() {
    if (zoomLevel < 200) {
        zoomLevel += 10;
        updateZoom();
    }
}

function zoomOut() {
    if (zoomLevel > 10) {
        zoomLevel -= 10;
        updateZoom();
    }
}

function zoomReset() {
    zoomLevel = 100;
    updateZoom();
}

function updateZoom() {
    document.getElementById('zoomLevel').textContent = zoomLevel + '%';
    const wrapper = document.querySelector('.tree-wrapper');
    if (wrapper) {
        wrapper.style.transform = `scale(${zoomLevel / 100})`;
    }
}

function savePNG() {
    const wrapper = document.querySelector('.tree-wrapper');
    if (!wrapper) {
        alert('No tree to save. Parse something first!');
        return;
    }
    
    const tree = wrapper.querySelector('.tree');
    
    // Clone the tree to a temporary container - completely unconstrained
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        z-index: 9999;
        background-color: #ffffff;
        padding: 20px;
        padding-bottom: 60px;
        width: auto;
        height: auto;
        max-width: none;
        max-height: none;
        overflow: visible;
    `;
    
    // Add color mode class
    if (colorMode === 'bw') {
        tempContainer.classList.add('bw');
    } else {
        tempContainer.classList.add('colored');
    }
    
    const clonedTree = tree.cloneNode(true);
    tempContainer.appendChild(clonedTree);
    document.body.appendChild(tempContainer);
    
    // Wait for render, then get actual dimensions
    setTimeout(() => {
        const rect = tempContainer.getBoundingClientRect();
        
        html2canvas(tempContainer, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            width: rect.width,
            height: rect.height + 40,
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: rect.width,
            windowHeight: rect.height + 40
        }).then(canvas => {
            document.body.removeChild(tempContainer);
            
            const link = document.createElement('a');
            const input = document.getElementById('inputCode').value;
            const safeName = input.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) || 'tree';
            link.download = `parse-tree-${safeName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            document.body.removeChild(tempContainer);
            alert('Error saving image. Try again.');
            console.error(err);
        });
    }, 200);
}

function displayTree(tree) {
    const output = document.getElementById('treeOutput');
    output.dataset.tree = JSON.stringify(tree);
    
    if (viewMode === 'visual') {
        output.innerHTML = `<div class="tree-wrapper" style="transform: scale(${zoomLevel / 100})"><div class="tree"><ul><li>${renderTreeVisual(tree)}</li></ul></div></div>`;
    } else {
        output.innerHTML = `<div class="text-tree">${escapeHtml(renderTreeText(tree, '', true))}</div>`;
    }
}

// === MAIN PARSE FUNCTION ===
function parse() {
    const input = document.getElementById('inputCode').value;
    const parseType = document.getElementById('parseType').value;
    const status = document.getElementById('status');
    const errorDiv = document.getElementById('errorMessage');
    const output = document.getElementById('treeOutput');
    
    try {
        const tokens = tokenize(input);
        const parser = new Parser(tokens);
        
        const parsers = {
            id: () => parser.parseId(), expr: () => parser.parseExpr(), list: () => parser.parseList(),
            statement: () => parser.parseStatement(), assign: () => parser.parseAssign(),
            var: () => parser.parseVar(), print: () => parser.parsePrint(), exit: () => parser.parseExit(),
            if: () => parser.parseIf(), while: () => parser.parseWhile(), repeat: () => parser.parseRepeat(),
            sub: () => parser.parseSub(), call: () => parser.parseCall()
        };
        
        const tree = parsers[parseType]();
        
        if (!parser.isAtEnd()) {
            const remaining = parser.tokens.slice(parser.pos).map(t => t.value).join(' ');
            throw new Error(`Unexpected tokens after valid ${parseType}: '${remaining}'`);
        }
        
        status.textContent = 'Valid ✓';
        status.className = 'status valid';
        errorDiv.style.display = 'none';
        displayTree(tree);
        
    } catch (err) {
        status.textContent = 'Invalid ✗';
        status.className = 'status invalid';
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
        output.innerHTML = '';
        output.dataset.tree = '';
    }
}

// === EXAMPLES ===
const examples = {
    'id': [
        { label: 'X', value: 'X' }, { label: 'x1y2', value: 'x1y2' }, { label: 'abc', value: 'abc' },
        { label: '2b (invalid)', value: '2b' }, { label: 'a_1 (invalid)', value: 'a_1' },
    ],
    'expr': [
        { label: '-4', value: '-4' }, { label: '(-4) [invalid]', value: '(-4)' },
        { label: '(1 + -4)', value: '(1 + -4)' }, { label: 'x', value: 'x' },
        { label: 'x*10 [invalid]', value: 'x*10' }, { label: '(x * 10)', value: '(x * 10)' },
        { label: '(a & !b) [invalid]', value: '(a & !b)' }, { label: '(a & (! b))', value: '(a & (! b))' },
        { label: '(3 > 2 > 1) [invalid]', value: '(3 > 2 > 1)' }, { label: '((2 < 3) | true)', value: '((2 < 3) | true)' },
    ],
    'list': [
        { label: '[] (empty)', value: '[]' }, { label: '["foo" 3]', value: '["foo" 3]' },
        { label: '[1 [2 3]]', value: '[1 [2 3]]' }, { label: '[true "hi" 42]', value: '[true "hi" 42]' },
    ],
    'statement': [
        { label: 'x gets 0', value: 'x gets 0' }, { label: 'var x gets 5', value: 'var x gets 5' },
        { label: 'print "hello"', value: 'print "hello"' }, { label: 'exit', value: 'exit' },
    ],
    'assign': [
        { label: 'a gets 0', value: 'a gets 0' }, { label: 'x gets (y + 1)', value: 'x gets (y + 1)' },
    ],
    'var': [
        { label: 'var x gets 0', value: 'var x gets 0' }, { label: 'var count gets 100', value: 'var count gets 100' },
    ],
    'print': [
        { label: 'print 42', value: 'print 42' }, { label: 'print "hello"', value: 'print "hello"' },
    ],
    'exit': [{ label: 'exit', value: 'exit' }],
    'if': [
        { label: 'simple if', value: 'if (x = y) then print "eq" endif' },
        { label: 'if-else', value: 'if (x > 0) then print "pos" else print "neg" endif' },
    ],
    'while': [
        { label: 'minimal', value: 'while 0 do endwhile' },
        { label: 'with body', value: 'while (x > 0) do x gets (x + -1) endwhile' },
    ],
    'repeat': [
        { label: 'minimal', value: 'repeat 0 times endrepeat' },
        { label: 'repeat 5', value: 'repeat 5 times print "hi" endrepeat' },
    ],
    'sub': [
        { label: 'minimal', value: 'sub a ( ) does endsub' },
        { label: 'with params', value: 'sub add ( x y ) does print (x + y) endsub' },
    ],
    'call': [
        { label: 'minimal', value: 'call a ( )' }, { label: 'with args', value: 'call add ( 1 2 )' },
    ],
};

function loadExample(value, type) {
    document.getElementById('inputCode').value = value;
    document.getElementById('parseType').value = type;
    parse();
}

function updateExamples() {
    const type = document.getElementById('parseType').value;
    const container = document.getElementById('exampleButtons');
    container.innerHTML = '';
    for (const ex of (examples[type] || [])) {
        const btn = document.createElement('button');
        btn.className = 'example-btn';
        btn.textContent = ex.label;
        btn.onclick = () => loadExample(ex.value, type);
        container.appendChild(btn);
    }
}

// === INITIALIZE ===
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('parseType').addEventListener('change', updateExamples);
    document.getElementById('inputCode').addEventListener('keypress', e => { if (e.key === 'Enter') parse(); });
    updateExamples();
    parse();
});

// Make functions globally accessible for onclick handlers
window.parse = parse;
window.setView = setView;
window.toggleColor = toggleColor;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomReset = zoomReset;
window.savePNG = savePNG;
window.loadExample = loadExample;
