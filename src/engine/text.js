// Small Bangla grammar helpers so generated sentences read naturally.
const VOWEL_END = /[া-ৌঅ-ঔ]$/; // ends in a vowel sign or vowel letter
// Possessive: টমেটো → টমেটোর, ধান → ধানের
export const bnOf = (w) => (VOWEL_END.test(w) ? `${w}র` : `${w}ের`);
// Locative: টমেটো → টমেটোতে, ধান → ধানে
export const bnIn = (w) => (VOWEL_END.test(w) ? `${w}তে` : `${w}ে`);
