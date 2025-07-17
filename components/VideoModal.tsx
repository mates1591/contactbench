import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
}

export function VideoModal({ isOpen, onClose, videoSrc, title }: VideoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-neutral-dark rounded-xl shadow-xl max-w-4xl w-full border border-gray-800">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Title if provided */}
              {title && (
                <div className="px-4 py-3 border-b border-gray-800">
                  <h3 className="gradient-text text-xl">{title}</h3>
                </div>
              )}
              
              {/* Video container with 16:9 aspect ratio */}
              <div className="relative pt-[56.25%]">
                <iframe
                  src={videoSrc}
                  className="absolute inset-0 w-full h-full rounded-b-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 