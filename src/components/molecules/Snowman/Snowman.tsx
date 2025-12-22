import styles from './Snowman.module.css';

export const Snowman = () => {
  return (
    <div
      className={styles.container}
      aria-hidden="true"
      role="img"
      aria-label="A festive snowman swaying in the snow"
    >
      <div className={styles.snowmanBody}>
        <div className={styles.leftArm} />
        <div className={styles.rightArm} />
        <div className={styles.buttons} />
      </div>
      <div className={styles.snowmanHead}>
        <div className={styles.hat} />
        <div className={styles.eyes} />
        <div className={styles.nose} />
        <div className={styles.scarf} />
        <div className={styles.scarfDrape} />
      </div>
    </div>
  );
};
