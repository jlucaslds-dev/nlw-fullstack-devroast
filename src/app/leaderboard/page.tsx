import type { Metadata } from "next";
import type { BundledLanguage } from "shiki";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Shame Leaderboard — DevRoast",
  description:
    "The most roasted code on the internet. See the worst-scored submissions ranked by shame.",
};

type LeaderboardEntry = {
  rank: number;
  score: number;
  language: string;
  lang: BundledLanguage;
  code: string;
};

const entries: LeaderboardEntry[] = [
  {
    rank: 1,
    score: 1.2,
    language: "javascript",
    lang: "javascript",
    code: `eval(prompt("enter code"))
document.write(response)
// trust the user lol`,
  },
  {
    rank: 2,
    score: 1.8,
    language: "typescript",
    lang: "typescript",
    code: `if (x == true) { return true; }
else if (x == false) { return false; }
else { return !false; }`,
  },
  {
    rank: 3,
    score: 2.1,
    language: "sql",
    lang: "sql",
    code: `SELECT * FROM users WHERE 1=1
-- TODO: add authentication`,
  },
  {
    rank: 4,
    score: 2.3,
    language: "java",
    lang: "java",
    code: `catch (e) {
  // ignore
}`,
  },
  {
    rank: 5,
    score: 2.5,
    language: "javascript",
    lang: "javascript",
    code: `const sleep = (ms) =>
  new Date(Date.now() + ms)
  while(new Date() < end) {}`,
  },
];

function scoreColor(score: number): string {
  if (score <= 3) return "text-accent-red";
  if (score <= 6) return "text-accent-amber";
  return "text-accent-green";
}

export default function LeaderboardPage() {
  return (
    <main className="flex flex-col w-full">
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto px-10 md:px-20 py-10">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[32px] font-bold text-accent-green">
              {">"}
            </span>
            <h1 className="font-mono text-[28px] font-bold text-text-primary">
              shame_leaderboard
            </h1>
          </div>

          <p className="font-mono text-sm text-text-secondary">
            {"// the most roasted code on the internet"}
          </p>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-tertiary">
              2,847 submissions
            </span>
            <span className="font-mono text-xs text-text-tertiary">{"·"}</span>
            <span className="font-mono text-xs text-text-tertiary">
              avg score: 4.2/10
            </span>
          </div>
        </section>

        {/* Leaderboard Entries */}
        <section className="flex flex-col gap-5">
          {entries.map((entry) => {
            const lineCount = entry.code.split("\n").length;

            return (
              <article
                key={entry.rank}
                className="flex flex-col border border-border-primary overflow-hidden"
              >
                {/* Meta Row */}
                <div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[13px] text-text-tertiary">
                        #
                      </span>
                      <span className="font-mono text-[13px] font-bold text-accent-amber">
                        {entry.rank}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-text-tertiary">
                        score:
                      </span>
                      <span
                        className={`font-mono text-[13px] font-bold ${scoreColor(entry.score)}`}
                      >
                        {entry.score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-secondary">
                      {entry.language}
                    </span>
                    <span className="font-mono text-xs text-text-tertiary">
                      {lineCount} lines
                    </span>
                  </div>
                </div>

                {/* Code Preview */}
                <CodeBlock
                  code={entry.code}
                  lang={entry.lang}
                  className="border-0"
                />
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
