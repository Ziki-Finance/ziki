import Link from "next/link";
import { RISK_LEVEL_LABEL, agreementWords, tickerPath } from "@/lib/finance";
import type { BriefingContent, BriefingLine } from "@/lib/finance/briefing";
import { ViewChip } from "./view-chip";

function Line({ line, owned }: { line: BriefingLine; owned: boolean }) {
  return (
    <li className="space-y-0.5">
      <span className="flex flex-wrap items-center gap-2">
        <ViewChip call={line.call} owned={owned} />
        <Link href={tickerPath(line.symbol)} className="font-medium text-zk-text hover:underline">
          {line.name} ({line.symbol})
        </Link>
      </span>
      <span className="block text-zk-text2">
        {line.reason} {agreementWords(line)}. Risk: {RISK_LEVEL_LABEL[line.risk]}.{line.notReviewedToday ? " Not reviewed today." : ""}
      </span>
    </li>
  );
}

/** A briefing on the page: the same sections, in the same order, as the Inbox note and the email (PRD §6.4). */
export function BriefingView({ content }: { content: BriefingContent }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="font-semibold text-zk-text">Good morning. Here&apos;s your portfolio for {content.dateWords}.</p>
      {content.overall ? <p className="text-zk-text">{content.overall}</p> : null}
      {content.needsLook.length > 0 ? (
        <div className="space-y-2">
          <p className="font-semibold text-zk-text">Needs a look ({content.needsLook.length})</p>
          <ul className="space-y-2">
            {content.needsLook.map((line) => (
              <Line key={line.symbol} line={line} owned />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-zk-text">Nothing needs your attention today.</p>
      )}
      {content.allGood.length > 0 ? (
        <div>
          <p className="font-semibold text-zk-text">All good ({content.allGood.length})</p>
          <p className="text-zk-text2">Keep {content.allGood.map((l) => `${l.name} (${l.symbol})`).join(", ")}</p>
        </div>
      ) : null}
      {content.watching.length > 0 ? (
        <div className="space-y-2">
          <p className="font-semibold text-zk-text">Watching ({content.watching.length})</p>
          <ul className="space-y-2">
            {content.watching.map((line) => (
              <Line key={line.symbol} line={line} owned={false} />
            ))}
          </ul>
        </div>
      ) : null}
      {content.newIdea ? (
        <div>
          <p className="font-semibold text-zk-text">New idea (1)</p>
          <p className="text-zk-text2">
            {content.newIdea.name} ({content.newIdea.symbol}): {content.newIdea.reason} Risk: {RISK_LEVEL_LABEL[content.newIdea.risk]}. Fits a {content.newIdea.fits} profile.
          </p>
        </div>
      ) : null}
      {content.waiting.length > 0 ? <p className="text-xs text-zk-muted">Still being reviewed: {content.waiting.map((w) => w.symbol).join(", ")}.</p> : null}
      {content.market ? <p className="text-zk-text2">{content.market}</p> : null}
    </div>
  );
}
