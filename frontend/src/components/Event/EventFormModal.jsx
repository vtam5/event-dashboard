import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, HStack
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import EventFormFields from './EventFormFields.jsx'
import { toFormState, toPayload } from '../../utils/eventForm.js'

export default function EventFormModal({ isOpen, onClose, onSubmit }) {
  const [values, setValues] = useState(toFormState({}))

  useEffect(() => {
    if (isOpen) setValues(toFormState({}))
  }, [isOpen])

  const submit = async () => {
    await onSubmit?.(toPayload(values))
  }

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
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={submit}>Create</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
