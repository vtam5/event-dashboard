import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getEvent } from '../services/eventService'
import { listQuestions } from '../services/questionService'
import { createResponse } from '../services/responseService'
import {
  Box, Heading, Text, VStack, FormControl, FormLabel, Input, Textarea,
  Button, useToast, Spinner
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import EventBlock from '../components/Public/EventBlock.jsx'

export default function PublicForm() {
  const { id } = useParams()
  const [eventItem, setEventItem] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const ev = await getEvent(id, { admin: false })
        const qs = await listQuestions(id)
        if (!alive) return
        setEventItem(ev)
        setQuestions(qs)
      } catch (e) {
        console.error(e)
        toast({ status: 'error', title: 'Failed to load event' })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id, toast])

  const submit = async (data) => {
    try {
      const answers = questions.map(q => ({
        questionId: q.questionId || q.id,
        answerText: data[`q_${q.questionId || q.id}`] ?? ''
      }))
      const payload = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        answers
      }
      await createResponse(id, payload)
      toast({ status: 'success', title: 'Submitted!' })
      reset()
    } catch (e) {
      console.error(e)
      toast({ status: 'error', title: 'Submit failed' })
    }
  }

  if (loading) return <Spinner />

  if (!eventItem) return <Heading size="md">Event not found</Heading>

  return (
    <Box>
      {/* 🔹 Event details card ABOVE the form */}
      <Box mb={6}>
        <EventBlock item={eventItem} clickable={false} />
      </Box>

      {/* 🔹 Registration form */}
      <form onSubmit={handleSubmit(submit)}>
        <VStack align="stretch" bg="white" p={5} rounded="md" shadow="sm" spacing={4}>
          <Heading size="sm">Your Info</Heading>
          <FormControl><FormLabel>First Name</FormLabel><Input {...register('firstName')} /></FormControl>
          <FormControl><FormLabel>Last Name</FormLabel><Input {...register('lastName')} /></FormControl>
          <FormControl><FormLabel>Email</FormLabel><Input type="email" {...register('email')} /></FormControl>
          <FormControl><FormLabel>Phone</FormLabel><Input {...register('phone')} /></FormControl>
          <FormControl><FormLabel>Address</FormLabel><Textarea rows={2} {...register('address')} /></FormControl>

          <Heading size="sm" pt={2}>Questions</Heading>
          {questions.map(q => (
            <FormControl key={q.questionId || q.id} isRequired={!!q.isRequired}>
              <FormLabel>{q.questionText}</FormLabel>
              {/* TODO: extend by q.type (radio/checkbox/etc.) */}
              <Input {...register(`q_${q.questionId || q.id}`, { required: q.isRequired })} />
            </FormControl>
          ))}

          <Button type="submit" colorScheme="blue" alignSelf="flex-end">Submit</Button>
        </VStack>
      </form>
    </Box>
  )
}
