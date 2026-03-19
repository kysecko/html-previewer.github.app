document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== "undefined") lucide.createIcons();
});

const codeArea = document.getElementById("sourceCode"),
    lineNumbers = document.getElementById("lineNumbers"),
    themeText = document.getElementById("theme-text"),
    themeIcon = document.getElementById("theme-icon"),
    resizer = document.getElementById("resizer"),
    editorWrapper = document.getElementById("editor-wrapper"),
    previewWrapper = document.getElementById("preview-wrapper");
let isResizing = false,
    isWrapped = false;

showLandingPage = () => {
    window.location.href = '/';
};

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    if (document.body.classList.contains("light-mode")) {
        themeText.textContent = "Dark";
        themeIcon.setAttribute("data-lucide", "moon");
        localStorage.setItem("theme", "light");
    } else {
        themeText.textContent = "Light";
        themeIcon.setAttribute("data-lucide", "sun");
        localStorage.setItem("theme", "dark");
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function loadTheme() {
    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-mode");
        themeText.textContent = "Dark";
        themeIcon.setAttribute("data-lucide", "moon");
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function updateLineNumbers() {
    const lines = codeArea.value.split("\n").length;
    lineNumbers.textContent = Array.from(
        { length: lines },
        (_, i) => i + 1
    ).join("\n");
}

codeArea.addEventListener("input", () => {
    updateLineNumbers();
    runCode();
});

codeArea.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeArea.scrollTop;
});

codeArea.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        e.preventDefault();
        const start = codeArea.selectionStart,
            end = codeArea.selectionEnd,
            value = codeArea.value;
        codeArea.value =
            value.substring(0, start) + "  " + value.substring(end);
        codeArea.selectionStart = codeArea.selectionEnd = start + 2;
        updateLineNumbers();
        runCode();
    }
});

function extractTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() || "Untitled" : "Untitled";
}

function runCode() {
    document.getElementById("preview").srcdoc = codeArea.value;
    const span = document.querySelector("#tabTitle span");
    if (span) span.textContent = extractTitle(codeArea.value);
}

function toggleLayout() {
    isWrapped = !isWrapped;
    document.body.classList.toggle("wrapped", isWrapped);
    localStorage.setItem("layout", isWrapped ? "wrapped" : "side-by-side");
    if (isWrapped) {
        editorWrapper.style.height = "50%";
        previewWrapper.style.height = "50%";
        editorWrapper.style.width = "100%";
        previewWrapper.style.width = "100%";
    } else {
        editorWrapper.style.width = "40%";
        previewWrapper.style.width = "60%";
        editorWrapper.style.height = "100%";
        previewWrapper.style.height = "100%";
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function loadLayout() {
    if (localStorage.getItem("layout") === "wrapped") {
        isWrapped = true;
        document.body.classList.add("wrapped");
        editorWrapper.style.height = "50%";
        previewWrapper.style.height = "50%";
    }
}

resizer.addEventListener("mousedown", () => {
    isResizing = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = isWrapped ? "row-resize" : "col-resize";
});

document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    if (isWrapped) {
        const h = (e.clientY / document.body.clientHeight) * 100;
        if (h >= 20 && h <= 80) {
            editorWrapper.style.height = h + "%";
            previewWrapper.style.height = 100 - h + "%";
        }
    } else {
        const w = (e.clientX / document.body.clientWidth) * 100;
        if (w >= 20 && w <= 80) {
            editorWrapper.style.width = w + "%";
            previewWrapper.style.width = 100 - w + "%";
        }
    }
});

document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
});

function init() {
    // Initial code with boilerplate
    codeArea.value = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
      </style>
    </head>
    <body>
    <script>
    </script>
    </body>
    </html>`;
    updateLineNumbers();
    runCode();  // Ensure the preview is updated
}

function runCode() {
    const previewIframe = document.getElementById("preview");
    previewIframe.srcdoc = codeArea.value;
    const span = document.querySelector("#tabTitle span");
    if (span) span.textContent = extractTitle(codeArea.value);
    console.log("Updated iframe with code:", codeArea.value);  // Debugging output
}

window.addEventListener("load", () => {
    loadTheme();
    loadLayout();
    init();   
});