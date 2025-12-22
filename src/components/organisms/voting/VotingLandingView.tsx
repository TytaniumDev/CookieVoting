import type { Category } from '../../../lib/types';
import styles from './VotingLandingView.module.css';

interface VotingLandingViewProps {
  eventName: string;
  categories: Category[];
  onStart: () => void;
}

export const VotingLandingView = ({ eventName, categories, onStart }: VotingLandingViewProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>{eventName}</h1>
        <p className={styles.subtitle}>Ready to cast your votes?</p>

        <div className={styles.carouselContainer}>
          <div className={styles.carouselTrack}>
            {/* Duplicate categories for infinite scroll illusion if needed, or just map once */}
            {categories.map((cat) => (
              <div key={cat.id} className={styles.carouselItem}>
                <img src={cat.imageUrl} alt={cat.name} className={styles.image} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={onStart} className={styles.startButton}>
          Start Voting
        </button>
      </div>

      <div className={styles.backgroundDecorations}>
        {/* Add some festive/cookie decorations if desired */}
      </div>
    </div>
  );
};
