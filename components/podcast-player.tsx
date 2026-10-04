export function PodcastPlayer() {
  return <section className="podcast-section"><div className="container podcast-card">
    <div><span className="eyebrow"><span/> TAKE A LISTEN</span><h2>The Mother Nature<br/><em>Academy podcast.</em></h2><p>Listen to the podcast from Mother Nature Academy, or download the audio to enjoy later.</p><a className="text-link" href="/audio/mna-podcast.mp3" download>Download the episode <span>↓</span></a></div>
    <div className="podcast-audio"><audio controls preload="metadata" aria-label="Mother Nature Academy podcast"><source src="/audio/mna-podcast.mp3" type="audio/mpeg" />Your browser does not support audio playback. Use the download link to listen.</audio><small>Audio · 7 minutes 41 seconds</small></div>
  </div></section>;
}
