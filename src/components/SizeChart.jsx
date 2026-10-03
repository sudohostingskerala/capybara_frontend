import { useState } from "react";
import styles from "./SizeChart.module.css";

const SizeChart = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className={styles.button}
                onClick={() => setIsOpen(true)}
            >
                Size Chart
            </button>

            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div className={styles.modal}>

                        <button
                            className={styles.close}
                            onClick={() => setIsOpen(false)}
                        >
                            ×
                        </button>

                        <img
                            src="/assets/size_chart.webp"
                            alt="Size Chart"
                            className={styles.image}
                        />

                    </div>
                </div>
            )}
        </>
    );
};

export default SizeChart;

