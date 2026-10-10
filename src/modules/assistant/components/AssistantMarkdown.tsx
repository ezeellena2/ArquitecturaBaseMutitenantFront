import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  a: ({ children }) => <span>{children}</span>,
  img: ({ alt }) => <>{alt}</>,
  table: ({ children }) => <div className="my-2 max-w-full"><table className="w-full max-w-full table-fixed border-collapse text-left">{children}</table></div>,
  th: ({ children }) => <th className="border border-[var(--borde)] px-2 py-1 font-semibold [overflow-wrap:anywhere]">{children}</th>,
  td: ({ children }) => <td className="border border-[var(--borde)] px-2 py-1 [overflow-wrap:anywhere]">{children}</td>,
  pre: ({ children }) => <pre className="my-2 max-w-full whitespace-pre-wrap rounded-[8px] bg-[var(--s2)] p-3 [overflow-wrap:anywhere]">{children}</pre>,
  code: ({ children, className }) => <code className={className ?? "rounded-[4px] bg-[var(--s2)] px-1 [overflow-wrap:anywhere]"}>{children}</code>,
};

interface AssistantMarkdownProps {
  text: string;
}

export function AssistantMarkdown({ text }: AssistantMarkdownProps) {
  return <div className="min-w-0 max-w-full text-[15px] leading-[1.6] text-[var(--t1)] [overflow-wrap:anywhere] max-md:text-[16px] [&_li]:my-[2px] [&_ol]:mb-2 [&_ol]:mt-[2px] [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-[6px] [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:mt-[2px] [&_ul]:list-disc [&_ul]:pl-5">
    <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</ReactMarkdown>
  </div>;
}
