/**
 * Minimal OFX parser for bank statements (OFX 1.x SGML and 2.x XML style).
 * Extracts STMTTRN blocks: FITID, DTPOSTED, TRNAMT, TRNTYPE, MEMO, NAME/PAYEE.
 * Handles: BOM, optional XML namespace, SGML-style tags without closing tag.
 */

export interface OfxTransaction {
  fitId: string;
  postedAt: string;
  amount: number;
  type: 'debit' | 'credit';
  memo?: string;
  payee?: string;
  raw?: string;
}

function parseDate(dt: string): string {
  if (!dt || typeof dt !== 'string') return '';
  const digits = dt.replace(/\D/g, '');
  if (digits.length < 8) return '';
  const s = digits.slice(0, 8);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** Get tag value: supports <TAG>value</TAG> or SGML-style <TAG>value (until next <) */
function getTag(content: string, tagName: string): string {
  const name = tagName.replace(/[^a-z0-9]/gi, '');
  // XML style: <TAG>value</TAG> or <prefix:TAG>value</prefix:TAG>
  const xmlRe = new RegExp(`<[^>]*?${name}>([^<]*)</[^>]*?${name}>`, 'i');
  const xmlM = content.match(xmlRe);
  if (xmlM) return xmlM[1].trim();
  // SGML style: <TAG>value (no closing, value until next <)
  const sgmlRe = new RegExp(`<[^>]*?${name}>([^<]*)`, 'i');
  const sgmlM = content.match(sgmlRe);
  if (sgmlM) return sgmlM[1].trim().replace(/\s+/g, ' ');
  return '';
}

/**
 * Parse OFX content and return array of transactions.
 * Supports nested <STMTTRN>...</STMTTRN> blocks and optional XML namespace (e.g. bank:STMTTRN).
 */
export function parseOfx(content: string): OfxTransaction[] {
  const results: OfxTransaction[] = [];
  if (!content || typeof content !== 'string') return results;
  let text = content
    .replace(/^\uFEFF/, '') // strip BOM
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  // Match <STMTTRN>...</STMTTRN> or <prefix:STMTTRN>...</...:STMTTRN> (case insensitive)
  const blockRe = /<[^>]*?STMTTRN[^>]*>([\s\S]*?)<\/[^>]*?STMTTRN[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text)) !== null) {
    const block = m[1];
    const fitId = getTag(block, 'FITID') || `gen-${results.length}-${Date.now()}`;
    const dtPosted = getTag(block, 'DTPOSTED');
    const trnAmt = getTag(block, 'TRNAMT');
    const trnType = getTag(block, 'TRNTYPE').toUpperCase();
    const memo = getTag(block, 'MEMO');
    const name = getTag(block, 'NAME') || getTag(block, 'PAYEE');
    const amount = parseFloat(trnAmt) || 0;
    const type: 'debit' | 'credit' = amount < 0 || trnType === 'DEBIT' ? 'debit' : 'credit';
    const absAmount = Math.abs(amount);
    const postedAt = parseDate(dtPosted);
    if (!postedAt) continue; // skip if no valid date
    results.push({
      fitId,
      postedAt,
      amount: absAmount,
      type,
      memo: memo || undefined,
      payee: name || undefined,
      raw: block.slice(0, 500),
    });
  }
  return results;
}
