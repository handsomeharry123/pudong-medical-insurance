import { useEffect, useState } from 'react';
import './video-background.css';

export default function VideoBackground() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPlay(!preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  return <div className="video-background" aria-hidden="true">
    {play && <video autoPlay muted loop playsInline preload="metadata" poster="/media/portal-background-clean.jpg"><source src="/media/portal-background-clean.mp4" type="video/mp4" /></video>}
  </div>;
}
