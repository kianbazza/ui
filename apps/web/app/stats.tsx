import Script from 'next/script'
export default function OneDollarStatsScript() {
  return (
    <Script
      defer
      src="https://assets.onedollarstats.com/stonks.js"
      id="stonks"
      data-debug="ui.bazza.dev"
    />
  )
}
