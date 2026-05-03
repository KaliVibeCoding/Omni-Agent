import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      className="prose prose-invert max-w-none w-full dark:prose-p:text-gray-300 dark:prose-headings:text-white"
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "";
          const codeString = String(children).replace(/\n$/, "");

          if (!inline && match) {
            return (
              <div className="relative group my-4 rounded-md overflow-hidden bg-[#1E1E1E]">
                <div className="flex items-center justify-between px-4 py-1.5 bg-[#2D2D2D] text-xs text-gray-400">
                  <span className="font-mono uppercase">{language}</span>
                  <CopyButton text={codeString} />
                </div>
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  customStyle={{ margin: 0, background: "transparent", padding: "1rem" }}
                  codeTagProps={{ className: "font-mono text-sm" }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }
          return (
            <code {...props} className="bg-[#2D2D2D] text-[#E5E5E5] px-1.5 py-0.5 rounded-md font-mono text-sm">
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
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
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}
