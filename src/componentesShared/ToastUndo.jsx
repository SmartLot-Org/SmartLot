import { useEffect, useRef } from "react";
import "./ToastUndo.css";

export default function ToastUndo({ message, onUndo, onClose }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 5000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleUndo = () => {
    clearTimeout(timerRef.current);
    onUndo();
    onClose();
  };

  return (
    <div className="toast-container">
      <div className="toast" role="status" aria-live="polite">
        <span className="toast__message">{message}</span>
        <button className="toast__undo" onClick={handleUndo}>Deshacer</button>
        <div className="toast__progress" />
      </div>
    </div>
  );
}
