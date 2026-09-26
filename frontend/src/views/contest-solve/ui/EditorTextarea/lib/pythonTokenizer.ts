export type TokenType =
  | "keyword"
  | "builtin"
  | "string"
  | "comment"
  | "number"
  | "punct"
  | "plain";

export interface Token {
  type: TokenType;
  text: string;
}

const TOKEN_REGEX =
  /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b(?:def|return|if|elif|else|while|for|in|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|yield|class|and|or|not|is|None|True|False|global|nonlocal)\b)|(\b(?:print|len|range|int|str|float|list|dict|set|tuple|sum|min|max|sorted|map|filter|open|input|enumerate|zip|abs|all|any|isinstance|sys)\b)|([+\-*/%=<>!&|^~?:;.,(){}[\]])/g;

export function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(code)) !== null) {
    if (match.index > last) {
      tokens.push({ type: "plain", text: code.slice(last, match.index) });
    }
    const [full, comment, str, num, kw, builtin, punct] = match;
    if (comment) tokens.push({ type: "comment", text: full });
    else if (str) tokens.push({ type: "string", text: full });
    else if (num) tokens.push({ type: "number", text: full });
    else if (kw) tokens.push({ type: "keyword", text: full });
    else if (builtin) tokens.push({ type: "builtin", text: full });
    else if (punct) tokens.push({ type: "punct", text: full });
    last = TOKEN_REGEX.lastIndex;
  }
  if (last < code.length) {
    tokens.push({ type: "plain", text: code.slice(last) });
  }
  return tokens;
}
