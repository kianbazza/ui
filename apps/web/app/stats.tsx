import Script from 'next/script'
export default function OneDollarStatsScript() {
  return (
    <Script
      defer
      src="https://assets.onedollarstats.com/stonks.js"
      id="stonks"
      data-debug={
        process.env.NEXT_PUBLIC_RELEASE_TYPE === 'canary'
          ? 'canary.ui.bazza.dev'
          : 'ui.bazza.dev'
      }
    />
  )
}
