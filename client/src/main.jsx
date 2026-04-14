import ReactDOM from "react-dom/client";
import App from "./App";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;700&display=swap";
document.head.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  :root {
    color-scheme: dark;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    font-family: 'DM Sans', sans-serif;
    background: #020617;
    color: #f8fafc;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  img {
    max-width: 100%;
    display: block;
  }

  button, input, select, textarea {
    font: inherit;
  }

  button {
    transition: transform 0.18s ease, opacity 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  button:hover, a:hover {
    transform: translateY(-1px);
  }

  button:disabled {
    cursor: not-allowed;
  }

  input:focus, select:focus, textarea:focus {
    outline: 2px solid rgba(34, 197, 94, 0.42);
    outline-offset: 2px;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #020617;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.25);
    border-radius: 999px;
  }

  .page-loader {
    min-height: 100vh;
    display: grid;
    place-items: center;
    color: #94a3b8;
    background: #020617;
  }

  @media (max-width: 980px) {
    h1 { word-break: break-word; }
  }

  @media (max-width: 800px) {
    body {
      overflow-x: hidden;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 0.9; }
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
