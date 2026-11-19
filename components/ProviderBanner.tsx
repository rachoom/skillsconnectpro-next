type Props = { url?: string | null };

export function ProviderBanner({ url }: Props) {
  return (
    <picture className="block">
      {!url && <source media="(max-width: 600px)" srcSet="/provider-profile/trades-banner-mobile.webp" />}
      <img
        src={url || '/provider-profile/trades-banner.webp'}
        alt={url ? 'Business banner' : 'SkillsConnectPro trades in action'}
        width={1536}
        height={512}
        className="block w-full aspect-[3/1] object-cover"
      />
    </picture>
  );
}
