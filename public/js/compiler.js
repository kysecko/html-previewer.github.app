// DOM Refs  
const codeArea = document.getElementById("sourceCode");
const lineNumbers = document.getElementById("lineNumbers");
const themeText = document.getElementById("theme-text");
const themeIcon = document.getElementById("theme-icon");
const resizer = document.getElementById("resizer");
const editorWrapper = document.getElementById("editor-wrapper");
const previewWrapper = document.getElementById("preview-wrapper");

let isResizing = false;
let isWrapped = false;

// Lucide Icons Bootstrap
function initIcons() {
    if (typeof lucide !== "undefined") lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", initIcons);

// Navigation  
function showLandingPage() {
    window.location.href = "/";
}

// Theme  
function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    if (themeText) themeText.textContent = isLight ? "Dark" : "Light";
    if (themeIcon) themeIcon.setAttribute("data-lucide", isLight ? "moon" : "sun");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    initIcons();
}

function loadTheme() {
    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-mode");
        if (themeText) themeText.textContent = "Dark";
        if (themeIcon) themeIcon.setAttribute("data-lucide", "moon");
    }
    initIcons();
}

// Line Numbers   
function updateLineNumbers() {
    const count = codeArea.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n");
}

// Status Bar  
function updateStatusBar() {
    const val = codeArea.value;
    const beforeCursor = val.substring(0, codeArea.selectionStart);
    const lines = beforeCursor.split("\n");
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;

    const lineColInfo = document.getElementById("lineColInfo");
    const charCount = document.getElementById("charCount");
    if (lineColInfo) lineColInfo.textContent = `Ln ${ln}, Col ${col}`;
    if (charCount) charCount.textContent = `${val.length} chars`;
}

// Editor Events  
codeArea.addEventListener("input", () => {
    updateLineNumbers();
    updateStatusBar();
    runCode();
});

codeArea.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeArea.scrollTop;
});

codeArea.addEventListener("keyup", updateStatusBar);
codeArea.addEventListener("click", updateStatusBar);

codeArea.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        e.preventDefault();
        const start = codeArea.selectionStart;
        const end = codeArea.selectionEnd;
        const val = codeArea.value;
        codeArea.value = val.substring(0, start) + "  " + val.substring(end);
        codeArea.selectionStart = codeArea.selectionEnd = start + 2;
        updateLineNumbers();
        updateStatusBar();
        runCode();
    }
});

// Preview  
function extractTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() || "Untitled" : "Untitled";
}

function runCode() {
    const iframe = document.getElementById("preview");
    if (iframe) iframe.srcdoc = codeArea.value;
    const span = document.querySelector("#tabTitle span");
    if (span) span.textContent = extractTitle(codeArea.value);
}

// Layout Toggle  
function toggleLayout() {
    isWrapped = !isWrapped;
    document.body.classList.toggle("wrapped", isWrapped);
    localStorage.setItem("layout", isWrapped ? "wrapped" : "side-by-side");
    applyLayout();
    initIcons();
}

function applyLayout() {
    if (isWrapped) {
        editorWrapper.style.width = "100%";
        previewWrapper.style.width = "100%";
        editorWrapper.style.height = "50%";
        previewWrapper.style.height = "50%";
    } else {
        editorWrapper.style.width = "42%";
        previewWrapper.style.width = "";
        editorWrapper.style.height = "100%";
        previewWrapper.style.height = "100%";
    }
}

function loadLayout() {
    if (localStorage.getItem("layout") === "wrapped") {
        isWrapped = true;
        document.body.classList.add("wrapped");
        applyLayout();
    }
}

// Resizer    
resizer.addEventListener("mousedown", () => {
    isResizing = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = isWrapped ? "row-resize" : "col-resize";
    resizer.classList.add("active");
});

document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    if (isWrapped) {
        const h = (e.clientY / document.body.clientHeight) * 100;
        if (h >= 20 && h <= 80) {
            editorWrapper.style.height = h + "%";
            previewWrapper.style.height = (100 - h) + "%";
        }
    } else {
        const w = (e.clientX / document.body.clientWidth) * 100;
        if (w >= 20 && w <= 80) {
            editorWrapper.style.flex = "none";
            previewWrapper.style.flex = "none";

            editorWrapper.style.width = w + "%";
            previewWrapper.style.width = (100 - w) + "%";
        }
    }
});

document.addEventListener("mouseup", () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    resizer.classList.remove("active");
});

// Default Boilerplate  
const DEFAULT_BOILERPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,
    initial-scale=1.0" />

    <title>Your Title</title>

    <style>
     /* Your CSS goes here */
    </style>

  </head>
  <body>

    <h1>Hello, World!</h1>
    <p>Start by typing or pasting your code here....</p>

    <script>
      // Your JavaScript goes here
      // Open console to see result
      console.log("It worked!");
    <\/script>
    
  </body>
</html>`;

// Init  
function init() {
    codeArea.value = DEFAULT_BOILERPLATE;
    updateLineNumbers();
    updateStatusBar();
    runCode();
}

window.addEventListener("load", () => {
    loadTheme();
    loadLayout();
    init();
});