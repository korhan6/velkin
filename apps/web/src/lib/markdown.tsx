import type { ReactNode } from 'react';

/**
 * Tiny, safe Markdown renderer for CMS bodies (headings, paragraphs, lists, code, links, bold/italic/inline code).
 * Produces React elements only — no dangerouslySetInnerHTML.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const label = tok.slice(1, tok.indexOf(']'));
      const href = m[2];
      out.push(
        <a key={k} href={href} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
          {label}
        </a>,
      );
    } else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const nodes: ReactNode[] = [];
  blocks.forEach((raw, bi) => {
    const block = raw.trim();
    if (!block) return;
    const k = `b${bi}`;
    if (block.startsWith('```')) {
      nodes.push(
        <pre key={k}>
          <code>{block.replace(/^```\w*\n?/, '').replace(/```$/, '')}</code>
        </pre>,
      );
      return;
    }
    // A heading may be followed by text in the same block
    const lines = block.split('\n');
    let rest: string[] = lines;
    const h = lines[0].match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const Tag = (level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4';
      nodes.push(<Tag key={`${k}h`}>{inline(h[2], `${k}h`)}</Tag>);
      rest = lines.slice(1);
    }
    if (!rest.length) return;
    if (rest.every((l) => /^\s*[-*]\s+/.test(l))) {
      nodes.push(
        <ul key={k}>
          {rest.map((l, i) => (
            <li key={i}>{inline(l.replace(/^\s*[-*]\s+/, ''), `${k}-${i}`)}</li>
          ))}
        </ul>,
      );
    } else if (rest.every((l) => /^\s*\d+\.\s+/.test(l))) {
      nodes.push(
        <ol key={k}>
          {rest.map((l, i) => (
            <li key={i}>{inline(l.replace(/^\s*\d+\.\s+/, ''), `${k}-${i}`)}</li>
          ))}
        </ol>,
      );
    } else {
      nodes.push(<p key={k}>{inline(rest.join(' '), k)}</p>);
    }
  });
  return <>{nodes}</>;
}
