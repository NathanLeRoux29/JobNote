"""Conversion des notes JobNote : HTML (éditeur) <-> Markdown (IA, MCP).
Partagé par jobnote.py, ai.py et mcp_server.py."""

import html
import re
from html.parser import HTMLParser

# =====================================================================
def _inline(s):
    s = html.escape(s, quote=False)
    codes = []
    s = re.sub(r"`([^`]+)`", lambda m: codes.append(m.group(1)) or f"\x00{len(codes) - 1}\x00", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"~~(.+?)~~", r"<s>\1</s>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", s)
    s = re.sub(r"(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)", r"<i>\1</i>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+|mailto:[^)\s]+)\)",
               lambda m: f'<a href="{html.escape(m.group(2))}">{m.group(1)}</a>', s)
    s = re.sub(r"^\[([ xX])\]\s*", lambda m: "☑ " if m.group(1).strip() else "☐ ", s)
    return re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{codes[int(m.group(1))]}</code>", s)


LIST_RE = re.compile(r"^(\s*)([-*+•]|\d+[.)])\s+(.*)$")


def markdown_to_html(md):
    lines = str(md or "").replace("\r", "").split("\n")
    out, para, i = [], [], 0

    def flush():
        if para:
            out.append("<p>" + "<br>".join(_inline(x) for x in para) + "</p>")
            para.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if s.startswith("```"):
            flush()
            code, i = [], i + 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i])
                i += 1
            out.append("<pre>" + html.escape("\n".join(code), quote=False) + "</pre>")
            i += 1
            continue
        m = re.match(r"^(#{1,3})\s+(.*)$", s)
        if m:
            flush()
            n = len(m.group(1))
            out.append(f"<h{n}>{_inline(m.group(2))}</h{n}>")
            i += 1
            continue
        if re.match(r"^(-{3,}|\*{3,})$", s):
            flush()
            out.append("<hr>")
            i += 1
            continue
        if s.startswith(">"):
            flush()
            quote = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote.append(_inline(lines[i].strip()[1:].strip()))
                i += 1
            out.append("<blockquote>" + "<br>".join(quote) + "</blockquote>")
            continue
        if LIST_RE.match(line):
            flush()
            html_parts, stack = [], []
            while i < len(lines) and LIST_RE.match(lines[i]):
                lm = LIST_RE.match(lines[i])
                ind = len(lm.group(1).replace("\t", "    "))
                tag = "ol" if lm.group(2)[0].isdigit() else "ul"
                if not stack or ind > stack[-1][0]:
                    html_parts.append(f"<{tag}>")
                    stack.append((ind, tag))
                else:
                    while len(stack) > 1 and ind < stack[-1][0]:
                        html_parts.append(f"</li></{stack.pop()[1]}>")
                    html_parts.append("</li>")
                html_parts.append("<li>" + _inline(lm.group(3)))
                i += 1
            while stack:
                html_parts.append(f"</li></{stack.pop()[1]}>")
            out.append("".join(html_parts))
            continue
        if not s:
            flush()
        else:
            para.append(s)
        i += 1
    flush()
    return "".join(out)


class _HtmlToMd(HTMLParser):
    BLOCKS = {"p", "div", "h1", "h2", "h3", "li", "blockquote", "pre", "ul", "ol", "hr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.lists, self.quote, self.pre, self.href = [], [], 0, False, None

    def _nl(self, n=1):
        text = "".join(self.out)
        have = len(text) - len(text.rstrip("\n"))
        if text.strip():
            self.out.append("\n" * max(0, n - have))

    def handle_starttag(self, tag, attrs):
        if tag in ("h1", "h2", "h3"):
            self._nl(2)
            self.out.append("#" * int(tag[1]) + " ")
        elif tag in ("p", "div"):
            self._nl(1 if self.lists else 2)
        elif tag in ("ul", "ol"):
            self._nl(1)
            self.lists.append([tag, 0])
        elif tag == "li":
            self._nl(1)
            depth = max(0, len(self.lists) - 1)
            if self.lists and self.lists[-1][0] == "ol":
                self.lists[-1][1] += 1
                bullet = f"{self.lists[-1][1]}. "
            else:
                bullet = "- "
            self.out.append("  " * depth + bullet)
        elif tag == "blockquote":
            self._nl(2)
            self.quote += 1
            self.out.append("> ")
        elif tag == "pre":
            self._nl(2)
            self.pre = True
            self.out.append("```\n")
        elif tag == "br":
            self.out.append("\n" + ("> " if self.quote else ""))
        elif tag == "hr":
            self._nl(2)
            self.out.append("---")
        elif tag in ("b", "strong"):
            self.out.append("**")
        elif tag in ("i", "em"):
            self.out.append("*")
        elif tag in ("s", "strike", "del"):
            self.out.append("~~")
        elif tag == "code" and not self.pre:
            self.out.append("`")
        elif tag == "a":
            self.href = dict(attrs).get("href")
            self.out.append("[")

    def handle_endtag(self, tag):
        if tag in ("ul", "ol") and self.lists:
            self.lists.pop()
        elif tag == "blockquote":
            self.quote = max(0, self.quote - 1)
        elif tag == "pre":
            self._nl(1)
            self.out.append("```")
            self.pre = False
        elif tag in ("b", "strong"):
            self.out.append("**")
        elif tag in ("i", "em"):
            self.out.append("*")
        elif tag in ("s", "strike", "del"):
            self.out.append("~~")
        elif tag == "code" and not self.pre:
            self.out.append("`")
        elif tag == "a":
            self.out.append(f"]({self.href})" if self.href else "]")
            self.href = None
        if tag in self.BLOCKS:
            self._nl(1)

    def handle_data(self, data):
        if not self.pre:
            data = re.sub(r"\s+", " ", data.replace(" ", " "))
            if self.out and self.out[-1].endswith(("\n", "> ", "- ", ". ", "# ")):
                data = data.lstrip()
        self.out.append(data)


def html_to_markdown(src):
    if not src:
        return ""
    p = _HtmlToMd()
    p.feed(src)
    p.close()
    return re.sub(r"\n{3,}", "\n\n", "".join(p.out)).strip()
