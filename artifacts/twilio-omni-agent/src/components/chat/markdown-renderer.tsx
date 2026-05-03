import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const LANG_EXTENSION: Record<string, string> = {
  javascript: "js", typescript: "ts", jsx: "jsx", tsx: "tsx",
  python: "py", ruby: "rb", go: "go", rust: "rs", java: "java",
  csharp: "cs", cpp: "cpp", c: "c", php: "php",
  bash: "sh", shell: "sh", sh: "sh",
  json: "json", yaml: "yml", toml: "toml", xml: "xml",
  html: "html", css: "css", scss: "scss",
  sql: "sql", graphql: "graphql",
  markdown: "md", text: "txt",
};

function extractFilename(code: string, lang: string): string | null {
  const patterns = [
    /^\/\/\s*(?:file(?:name)?|path):\s*(.+)$/im,
    /^#\s*(?:file(?:name)?|path):\s*(.+)$/im,
    /^<!--\s*(?:file(?:name)?|path):\s*(.+?)\s*-->$/im,
    /^\/\*\s*(?:file(?:name)?|path):\s*(.+?)\s*\*\/$/im,
  ];
  for (const p of patterns) {
    const m = code.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      className="prose prose-invert max-w-none w-full dark:prose-p:text-gray-300 dark:prose-headings:text-white prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-[#e5e5e5] prose-pre:p-0 prose-pre:bg-transparent"
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1].toLowerCase() : "";
          const codeString = String(children).replace(/\n$/, "");

          if (!inline && match) {
            const filename = extractFilename(codeString, language);
            const ext = LANG_EXTENSION[language] ?? language;
            const downloadName = filename ?? `code.${ext}`;
            return (
              <CodeBlock
                code={codeString}
                language={language}
                filename={filename}
                downloadName={downloadName}
                props={props}
              />
            );
          }
          return (
            <code {...props} className="bg-[#2D2D2D] text-[#e5c07b] px-1.5 py-0.5 rounded font-mono text-[0.8em]">
              {children}
            </code>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-4">
              <table className="border-collapse text-sm w-full">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return <th className="border border-border px-3 py-2 bg-[#1f1f23] text-left font-semibold text-foreground">{children}</th>;
        },
        td({ children }) {
          return <td className="border border-border px-3 py-2 text-muted-foreground">{children}</td>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-primary/50 pl-4 text-muted-foreground my-3 not-italic">
              {children}
            </blockquote>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  filename: string | null;
  downloadName: string;
  props: Record<string, unknown>;
}

function CodeBlock({ code, language, filename, downloadName, props }: CodeBlockProps) {
  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-[#3d3d3d] bg-[#1a1a1d] shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252529] border-b border-[#3d3d3d]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          {filename ? (
            <span className="font-mono text-xs text-[#aaa] bg-[#1a1a1d] px-2 py-0.5 rounded border border-[#3d3d3d]">
              {filename}
            </span>
          ) : (
            <span className="font-mono text-xs text-[#888] uppercase tracking-wider">{language}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DownloadButton code={code} filename={downloadName} />
          <CopyButton text={code} />
        </div>
      </div>
      <SyntaxHighlighter
        {...props}
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        showLineNumbers={code.split("\n").length > 5}
        lineNumberStyle={{ color: "#555", fontSize: "0.75rem", minWidth: "2.5rem" }}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "1rem",
          fontSize: "0.82rem",
          lineHeight: "1.6",
        }}
        codeTagProps={{ className: "font-mono" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant="ghost" size="icon"
      className="h-6 w-6 text-[#888] hover:text-white hover:bg-white/10 rounded"
      onClick={handleCopy}
      title="Copy code"
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function DownloadButton({ code, filename }: { code: string; filename: string }) {
  const [downloaded, setDownloaded] = React.useState(false);
  const handleDownload = () => {
    downloadFile(code, filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };
  return (
    <Button
      variant="ghost" size="icon"
      className="h-6 w-6 text-[#888] hover:text-white hover:bg-white/10 rounded"
      onClick={handleDownload}
      title={`Download as ${filename}`}
    >
      {downloaded ? <Check className="h-3 w-3 text-green-400" /> : <Download className="h-3 w-3" />}
    </Button>
  );
}
