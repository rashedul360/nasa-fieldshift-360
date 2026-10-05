import BangladeshMapArt from './BangladeshMapArt';
import RicePanicleArt from './RicePanicleArt';

export default function BrandBackdrop({ compact = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -right-10 top-2 h-72 w-72 rounded-full bg-primary-100/45 blur-3xl" />
      <div className="absolute right-[5%] top-[4%] opacity-[.30] sm:right-[9%]">
        <BangladeshMapArt className={compact ? 'w-32 sm:w-40' : 'w-48 sm:w-60 lg:w-[310px]'} />
      </div>
      <RicePanicleArt className={`absolute -bottom-8 right-[30%] rotate-12 text-primary-200/60 ${compact ? 'w-16' : 'w-24 sm:w-32'}`} />
      <RicePanicleArt className={`absolute -left-4 bottom-[-36px] -rotate-12 text-primary-100/75 ${compact ? 'w-16' : 'w-28 sm:w-36'}`} />
      <div className="noise-dots absolute right-0 top-0 h-32 w-44 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />
    </div>
  );
}
