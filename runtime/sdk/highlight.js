const EXTENSION_TO_LANG = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  py: "python",
  rs: "rust",
  go: "go",
  rb: "ruby",
  php: "php",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  cs: "csharp",
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  hpp: "cpp",
  css: "css",
  scss: "css",
  less: "css",
  html: "html",
  htm: "html",
  md: "markdown",
  markdown: "markdown",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  yaml: "yaml",
  sql: "sql",
  toml: "toml",
  xml: "xml",
};

const ALIAS = {
  ts: "typescript",
  js: "javascript",
  py: "python",
  rs: "rust",
};

const KEYWORDS = {
  typescript: "abstract as async await break case catch class const continue debugger default delete do else enum export extends false finally for from function get if import in instanceof interface let new null of return set static super switch this throw true try type typeof undefined var void while with yield satisfies",
  tsx: "abstract as async await break case catch class const continue debugger default delete do else enum export extends false finally for from function get if import in instanceof interface let new null of return set static super switch this throw true try type typeof undefined var void while with yield satisfies",
  javascript: "async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while with yield",
  jsx: "async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while with yield",
  python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield",
  rust: "as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while",
  go: "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil",
  java: "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if goto implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null",
  json: "true false null",
  sql: "select from where and or not null as join left right inner outer group by order insert into values update set delete create table index on",
  shell: "if then else fi for do done in while case esac function return exit export local",
};

function keywordSet(lang) {
  const key = ALIAS[lang] || lang;
  const src = KEYWORDS[key] || KEYWORDS.typescript;
  return new Set(src.split(/\s+/));
}

export function inferLanguageFromPath(filePath) {
  if (!filePath) return undefined;
  const base = String(filePath).split(/[/\\]/).pop() || "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return undefined;
  return EXTENSION_TO_LANG[base.slice(dot + 1).toLowerCase()];
}

export function normalizeLanguage(language, filePath) {
  const raw = (language || inferLanguageFromPath(filePath) || "").toLowerCase();
  return ALIAS[raw] || raw || undefined;
}

function shikiPalette(kind) {
  const light = kind === "light" || kind === "hc-light";
  return light
    ? {
        foreground: "#141414",
        comment: "#14141499",
        string: "#A3305C",
        keyword: "#1F5C9E",
        function: "#A85A16",
        type: "#8A6100",
        number: "#8A6100",
        punctuation: "#141414BD",
      }
    : {
        foreground: "#F0F0F0",
        comment: "#F0F0F099",
        string: "#E39AA8",
        keyword: "#7BB3DC",
        function: "#E8A66B",
        type: "#E8C168",
        number: "#E8C168",
        punctuation: "#F0F0F0BD",
      };
}

function push(out, content, color, col) {
  if (!content) return col;
  out.push({ content, color, col });
  return col + content.length;
}

export function tokenizeLine(text, language, kind) {
  const palette = shikiPalette(kind);
  const lang = normalizeLanguage(language) || "typescript";
  const keys = keywordSet(lang);
  const out = [];
  let i = 0;
  let col = 0;
  const line = String(text ?? "");
  const lineComment = lang === "python" || lang === "yaml" || lang === "toml" ? "#" : lang === "sql" ? "--" : "//";
  while (i < line.length) {
    if (lang !== "json" && line.startsWith(lineComment, i)) {
      col = push(out, line.slice(i), palette.comment, col);
      break;
    }
    const ch = line[i];
    if (ch === "'" || ch === '"' || (ch === "`" && lang !== "markdown")) {
      const quote = ch;
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      col = push(out, line.slice(i, j), palette.string, col);
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[0-9_.xXa-fA-F]/.test(line[j])) j += 1;
      col = push(out, line.slice(i, j), palette.number, col);
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[A-Za-z0-9_$]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      let color = palette.foreground;
      if (keys.has(word)) color = palette.keyword;
      else if (line[j] === "(") color = palette.function;
      else if (/^[A-Z]/.test(word)) color = palette.type;
      col = push(out, word, color, col);
      i = j;
      continue;
    }
    let j = i + 1;
    while (j < line.length && /[^A-Za-z0-9_$#"'`]/.test(line[j]) && !line.startsWith(lineComment, j)) j += 1;
    col = push(out, line.slice(i, j), palette.punctuation, col);
    i = j;
  }
  if (out.length === 0) out.push({ content: line, color: palette.foreground, col: 0 });
  return out;
}
