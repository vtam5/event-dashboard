// frontend/src/components/Event/EventFormModal.jsx
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, HStack, useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import EventFormFields from './EventFormFields.jsx';
import { toFormState, toPayload } from '../../utils/eventForm.js';

export default function EventFormModal({ isOpen, onClose, onSubmit }) {
  const toast = useToast();
  const [values, setValues] = useState(toFormState({}));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setValues(toFormState({}));
  }, [isOpen]);

  const submit = async () => {
    try {
      setSubmitting(true);
      const payload = toPayload(values);
      await onSubmit?.(payload);
      toast({ title: 'Event created', status: 'success', duration: 1600 });
      onClose?.();
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to create event', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Event</ModalHeader>
        <ModalBody>
          <EventFormFields values={values} setValues={setValues} />
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant="ghost" onClick={onClose} isDisabled={submitting}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={submit} isLoading={submitting}>
              Create
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
