import { useCallback, useState } from 'react';
import { isDefined } from "../utils/lo";

export default function useModal(initialOpen = false) {
  const [modalOpen, setModalOpen] = useState(initialOpen);
  const [data, setData] = useState(null);

  const openModal = useCallback((data) => {
    setModalOpen(true);

    if (isDefined(data) && !(data instanceof Event) && !data.target) {
      setData(data);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => {
      setData(null);
    }, 500);
  }, []);

  return [modalOpen, openModal, closeModal, data, setModalOpen];
}
