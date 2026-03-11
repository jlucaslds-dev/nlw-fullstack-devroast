import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { twMerge } from "tailwind-merge";

type CodeBlockProps = {
  code: string;
  lang: BundledLanguage;
  className?: string;
};

async function CodeBlock({ code, lang, className }: CodeBlockProps) {
  "use cache";

  const html = await codeToHtml(code, {
    lang,
    theme: "vesper",
  });

  const lines = code.split("\n");

  return (
    <div
      className={twMerge(
        "border border-border-primary overflow-hidden",
        className,
      )}
    >
      <div className="flex bg-bg-input">
        {/* Line numbers */}
        <div className="flex flex-col items-end gap-1.5 py-3 px-2.5 w-10 border-r border-border-primary bg-bg-surface select-none">
          {lines.map((_, i) => (
            <span
              key={`ln-${i.toString()}`}
              className="font-mono text-[13px] leading-tight text-text-tertiary"
            >
              {i + 1}
            </span>
          ))}
        </div>

        {/* Code */}
        <div
          className="flex-1 p-3 overflow-x-auto font-mono text-[13px] leading-tight [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!bg-transparent [&_.line]:leading-[1.65]"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates trusted HTML from code strings server-side
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

type CodeBlockHeaderProps = {
  filename?: string;
};

function CodeBlockHeader({ filename }: CodeBlockHeaderProps) {
  return (
    <div className="flex items-center gap-3 h-10 px-4 border-b border-border-primary">
      <span className="size-2.5 rounded-full bg-accent-red" />
      <span className="size-2.5 rounded-full bg-accent-amber" />
      <span className="size-2.5 rounded-full bg-accent-green" />
      <span className="flex-1" />
      {filename && (
        <span className="font-mono text-xs text-text-tertiary">{filename}</span>
      )}
    </div>
  );
}

export {
  CodeBlock,
  CodeBlockHeader,
  type CodeBlockProps,
  type CodeBlockHeaderProps,
};
