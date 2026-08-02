import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import './Toast.css';

const icons = {
  success: <FiCheckCircle />,
  error: <FiAlertCircle />,
  info: <FiInfo />,
};

export default function Toast({ message, type = 'info', onDismiss }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className={`toast toast-${type}`}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          role="status"
          aria-live="polite"
        >
          <span className="toast-icon">{icons[type] || icons.info}</span>
          <span>{message}</span>
          <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
