import { useState } from 'react';

interface NotificationState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showSuccess = (title: string, message: string, confirmText: string = 'OK') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: 'success',
      confirmText
    });
  };

  const showError = (title: string, message: string, confirmText: string = 'OK') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: 'error',
      confirmText
    });
  };

  const showWarning = (title: string, message: string, confirmText: string = 'OK') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: 'warning',
      confirmText
    });
  };

  const showInfo = (title: string, message: string, confirmText: string = 'OK') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: 'info',
      confirmText
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Delete',
    cancelText: string = 'Cancel'
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const handleConfirm = () => {
    if (notification.onConfirm) {
      notification.onConfirm();
    }
    hideNotification();
  };

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    hideNotification,
    handleConfirm
  };
};