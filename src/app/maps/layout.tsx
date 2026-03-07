export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* MapTiler SDK CSS — loaded via CDN because npm exports block direct import */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://cdn.maptiler.com/maptiler-sdk-js/v3.11.1/maptiler-sdk.css"
      />
      {children}
    </>
  );
}
