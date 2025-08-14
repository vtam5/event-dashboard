import {
    Button, FormControl, FormLabel, Input, Switch, Select, HStack, useDisclosure, Modal, ModalOverlay,
    ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, IconButton
  } from '@chakra-ui/react'
  import { useForm } from 'react-hook-form'
  import { createQuestion, updateQuestion } from '../../services/questionService'
  import { QUESTION_TYPES } from '../../utils/constants'
  import { EditIcon } from '@chakra-ui/icons'
  
  export default function QuestionForm({ eventId, onSaved, defaultValues, variant }) {
    const { register, handleSubmit, reset } = useForm({ defaultValues })
    const modal = useDisclosure()
  
    const submit = async (data) => {
      if (defaultValues) {
        await updateQuestion(eventId, defaultValues.questionId || defaultValues.id, data)
      } else {
        await createQuestion(eventId, data)
      }
      reset()
      modal.onClose()
      onSaved?.()
    }
  
    if (variant === 'icon') {
      return <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" onClick={modal.onOpen} />
    }
  
    return (
      <>
        <Button onClick={modal.onOpen} colorScheme="blue" size="sm">
          {defaultValues ? 'Edit Question' : 'Add Question'}
        </Button>
  
        <Modal isOpen={modal.isOpen} onClose={modal.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{defaultValues ? 'Edit Question' : 'New Question'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={3} isRequired>
                <FormLabel>Question Text</FormLabel>
                <Input {...register('questionText', { required: true })} />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select {...register('questionType')} defaultValue={defaultValues?.questionType || 'text'}>
                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Required</FormLabel>
                  <Switch {...register('isRequired')} defaultChecked={!!defaultValues?.isRequired}/>
                </FormControl>
              </HStack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={modal.onClose}>Cancel</Button>
              <Button colorScheme="blue" onClick={handleSubmit(submit)}>
                {defaultValues ? 'Save' : 'Create'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }
  