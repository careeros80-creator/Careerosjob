/*
 * verify_export.js — Phase 6D export integrity + claim scan.
 * 1) Extract text from each DOCX (unzip word/document.xml) and PDF (pdftotext).
 * 2) Compare (normalized) to the approved source text: strict (whitespace/quotes only)
 *    and wrap-tolerant (also ignoring hyphen/dash line-wrap). Report normalized hashes.
 * 3) Claim-scan the extracted PDF text for forbidden candidate claims, honouring the
 *    allowed contexts (Laser only in the Sukhi employer name; bleaching/frosting only
 *    as Sukhi's posting requirement; Permanent Make-up only as esthetics skill/training).
 *
 * Usage: node verify_export.js <approvedDir(cv.txt,oliha.txt,sukhi.txt)> <outDir(final files)>
 */
const fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const SRC = process.argv[2], DIR = process.argv[3];
const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const norm = s => s.replace(/﻿/g, '').replace(/[‘’′]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const wrapTol = s => norm(s).replace(/[‐-―\-\s]/g, '');
const docxText = p => cp.execSync(`unzip -p "${p}" word/document.xml`, { encoding: 'utf8', maxBuffer: 1 << 24 })
  .replace(/<w:tab\b[^>]*\/>/g, ' ').replace(/<w:br\b[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const pdfText = p => cp.execSync(`pdftotext -enc UTF-8 "${p}" -`, { encoding: 'utf8', maxBuffer: 1 << 24 });
const A = { cv: fs.readFileSync(SRC + '/cv.txt', 'utf8'), oliha: fs.readFileSync(SRC + '/oliha.txt', 'utf8'), sukhi: fs.readFileSync(SRC + '/sukhi.txt', 'utf8') };
const F = [
  ['cv', 'docx', 'Samira_Benaciri_CV_Hairstylist.docx'], ['cv', 'pdf', 'Samira_Benaciri_CV_Hairstylist.pdf'],
  ['oliha', 'docx', 'Samira_Benaciri_Cover_Letter_OLIHA.docx'], ['oliha', 'pdf', 'Samira_Benaciri_Cover_Letter_OLIHA.pdf'],
  ['sukhi', 'docx', 'Samira_Benaciri_Cover_Letter_Sukhi.docx'], ['sukhi', 'pdf', 'Samira_Benaciri_Cover_Letter_Sukhi.pdf'],
];
let material = false;
console.log('== text integrity ==');
for (const k of Object.keys(A)) console.log(`approved ${k} sha256(norm)=${sha(norm(A[k]))}`);
for (const [k, fmt, fn] of F) {
  const raw = fmt === 'docx' ? docxText(DIR + '/' + fn) : pdfText(DIR + '/' + fn);
  const strict = norm(raw) === norm(A[k]), tol = wrapTol(raw) === wrapTol(A[k]);
  const v = strict ? 'IDENTICAL' : tol ? 'MATCH (line-wrap only)' : 'MATERIAL DIFF';
  if (!strict && !tol) material = true;
  console.log(`  ${fn}: ${v}`);
}
console.log('\n== claim scan (PDFs) ==');
const FILES = { CV: 'Samira_Benaciri_CV_Hairstylist.pdf', OLIHA: 'Samira_Benaciri_Cover_Letter_OLIHA.pdf', Sukhi: 'Samira_Benaciri_Cover_Letter_Sukhi.pdf', OLIHA_Review: 'Samira_Benaciri_Application_OLIHA_Review.pdf', Sukhi_Review: 'Samira_Benaciri_Application_Sukhi_Review.pdf' };
const RULES = [['C16', /\bC16\b/i], ['LMIA', /\bLMIA\b/i], ['sponsorship', /sponsor/i], ['authorized-to-work', /authoriz?sed to work/i], ['work-permit', /work permit/i], ['visa', /visitor visa|\bvisa\b/i], ['perming/wave', /\bperming\b|permanent wave/i], ['straighten/lissage', /straighten|lissage/i], ['barbering', /barber/i], ['beard/moustache', /\bbeard|moustache|mustache/i], ['extensions', /hair extension|\bextensions?\b/i], ['wigs/hairpieces', /\bwig|hairpiece/i], ['nails', /\bnail|manicure|pedicure/i], ['eyelashes', /eyelash|lash extension/i], ['hydrafacial', /hydrafacial/i], ['microneedling', /microneedling/i], ['IPL', /\bIPL\b/i], ['laser', /\blaser\b/i], ['bleach/frost', /bleach|frost/i]];
let fails = 0;
for (const [name, fn] of Object.entries(FILES)) {
  const t = pdfText(DIR + '/' + fn);
  for (const [label, re] of RULES) {
    if (!re.test(t)) continue;
    let ok = false;
    if (label === 'laser') ok = !/\blaser\b/i.test(t.replace(/Sukhi Laser Beauty Salon & Academy Ltd\.?/g, ''));
    else if (label === 'bleach/frost') ok = /Sukhi/.test(name) && /posting includes colour and lightening work such as bleaching and frosting/i.test(t) && !/(my own|I provide|I apply|services I)[^.]*(bleach|frost)/i.test(t);
    if (!ok) { console.log(`  FAIL ${name}: ${label}`); fails++; }
  }
}
console.log(fails ? `claim scan: ${fails} FAIL` : 'claim scan: PASS (allowed exceptions only)');
process.exit(material || fails ? 1 : 0);
