// Registry of the six custom photographs used across the site.
// Each entry has two widths (900 / 1600 px, WebP), its intrinsic size, a focal point for object-position,
// and bilingual alt text. Components use <Photo name="…"> (src/components/Photo.jsx) rather than raw paths.
import heroAerialDawn1600 from './hero-aerial-dawn-1600.webp';
import heroAerialDawn900 from './hero-aerial-dawn-900.webp';
import landParcels1600 from './land-parcels-aerial-1600.webp';
import landParcels900 from './land-parcels-aerial-900.webp';
import seedlings1600 from './seedlings-sunrise-1600.webp';
import seedlings900 from './seedlings-sunrise-900.webp';
import satellite1600 from './satellite-patchwork-1600.webp';
import satellite900 from './satellite-patchwork-900.webp';
import farmer1600 from './farmer-rice-field-1600.webp';
import farmer900 from './farmer-rice-field-900.webp';
import droughtFlood1600 from './drought-flood-split-1600.webp';
import droughtFlood900 from './drought-flood-split-900.webp';

const W = 1672, H = 941;

export const IMAGES = {
  // Misty aerial at dawn; open haze on the left is where the hero text sits.
  heroDawn: {
    src: heroAerialDawn1600, srcSet: `${heroAerialDawn900} 900w, ${heroAerialDawn1600} 1600w`, width: W, height: H, focus: '70% 55%',
    alt: { bn: 'ভোরের কুয়াশায় ঢাকা ধানক্ষেত, নদী আর গাছপালার আকাশ থেকে তোলা ছবি', en: 'Aerial view of paddy fields, a river and tree lines in morning mist' },
  },
  // Aerial with three plots outlined in white — used wherever a farmer marks their own land.
  landParcels: {
    src: landParcels1600, srcSet: `${landParcels900} 900w, ${landParcels1600} 1600w`, width: W, height: H, focus: '52% 62%',
    alt: { bn: 'আকাশ থেকে দেখা খেতের মধ্যে সাদা দাগে চিহ্নিত কয়েকটি জমি, পাশে পুকুর ও খাল', en: 'Aerial view of farm plots with three fields outlined in white, beside ponds and a canal' },
  },
  // Close-up of young seedlings with flooded paddy at sunrise — crop advice / today's tasks.
  seedlings: {
    src: seedlings1600, srcSet: `${seedlings900} 900w, ${seedlings1600} 1600w`, width: W, height: 940, focus: '30% 60%',
    alt: { bn: 'ভোরের আলোয় শিশিরভেজা চারা, পেছনে পানি দেওয়া ধানের জমি', en: 'Dew-covered seedlings at sunrise with flooded paddy behind' },
  },
  // Satellite-style patchwork of fields and a winding river — Earth observation / NASA data.
  satellite: {
    src: satellite1600, srcSet: `${satellite900} 900w, ${satellite1600} 1600w`, width: W, height: 940, focus: '50% 50%',
    alt: { bn: 'উপগ্রহ থেকে দেখা নানা রঙের খেত আর আঁকাবাঁকা নদী', en: 'Satellite-style view of patchwork fields and a winding river' },
  },
  // Farmer checking rice panicles at sunrise — people, support and impact.
  farmer: {
    src: farmer1600, srcSet: `${farmer900} 900w, ${farmer1600} 1600w`, width: W, height: H, focus: '22% 45%',
    alt: { bn: 'ভোরে ধানক্ষেতে দাঁড়িয়ে একজন কৃষক ধানের শিষ দেখছেন', en: 'A farmer checking rice panicles in his field at sunrise' },
  },
  // Same field split between drought and flood — climate risk.
  droughtFlood: {
    src: droughtFlood1600, srcSet: `${droughtFlood900} 900w, ${droughtFlood1600} 1600w`, width: W, height: 940, focus: '50% 60%',
    alt: { bn: 'একই মাঠের একপাশে খরায় ফাটা মাটি, অন্যপাশে বৃষ্টিতে ডুবে যাওয়া ফসল', en: 'One field split between cracked, drought-hit soil and flooded crops under rain' },
  },
};
