import React from 'react';
import { BadgeDerivationInput, deriveEarnedBadges } from '../../lib/badgeSystem';

type Props = BadgeDerivationInput;

export default function FacilityBadgeStrip(props: Props) {
  const earnedBadges = deriveEarnedBadges(props);
  if (earnedBadges.length === 0) return null;

  return (
    <section className="fp-badges" aria-label="SilverTech badges">
      <p className="fp-badges-title">SilverTech Badges</p>
      <div className="fp-badges-grid">
        {earnedBadges.map((badge) => (
          <article key={badge.id} className="fp-badge-card">
            <img
              src={badge.asset}
              alt=""
              aria-hidden="true"
              className="fp-badge-icon"
              loading="lazy"
              decoding="async"
            />
            <div>
              <p className="fp-badge-name">{badge.label}</p>
              <p className="fp-badge-note">{badge.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
