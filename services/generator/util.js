/**
 * services/generator/util.js — deterministic helpers (no I/O, no LLM).
 */
const crypto = require('crypto');

const checksum = (s) => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
const wordCount = (s) => (String(s).trim().match(/\S+/g) || []).length;
const sentences = (s) => String(s).split(/[.!?]+/).map(x => x.trim()).filter(Boolean);
const stripAccents = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Simple readability: shorter sentences → higher score (0–100). */
function readability(text) {
  const w = wordCount(text);
  const sen = sentences(text).length || 1;
  const wps = w / sen;
  return Math.max(0, Math.min(100, Math.round(110 - wps * 4)));
}

module.exports = { checksum, wordCount, sentences, stripAccents, readability };
