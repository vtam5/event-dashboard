// src/pages/EventEditor.jsx
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
  HStack, Button, Image, useToast
} from '@chakra-ui/react'

import { getEvent, updateEvent } from '../services/eventService'
import QuestionList from '../components/Question/QuestionList.jsx'
import ResponseTable from '../components/Response/ResponseTable.jsx'
import EventFormFields from '../components/Event/EventFormFields.jsx'
import { toFormState, toPayload } from '../utils/eventForm.js'

export default function EventEditor() {
  // Route is /admin/events/:id/edit
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [eventItem, setEventItem] = useState(null)
  const [values, setValues] = useState(toFormState({}))
  const [tabIndex, setTabIndex] = useState(0)
  const toast = useToast()

  // Debug: confirm we’re editing the file Vite is serving
  console.log('EventEditor loaded from:', import.meta.url)

  // Keep old URL tab behavior
  useEffect(() => {
    const t = (searchParams.get('tab') || '').toLowerCase()
    setTabIndex(t === 'responses' ? 1 : 0)
  }, [searchParams])

  const load = async () => {
    try {
      const ev = await getEvent(id, { admin: true })
      setEventItem(ev)
      setValues(toFormState(ev || {}))
    } catch (e) {
      console.error(e)
      toast({ status: 'error', title: 'Failed to load event' })
    }
  }

  useEffect(() => { load() }, [id])

  const saveMeta = async () => {
    try {
      const payload = toPayload(values)
      // ALWAYS derive a safe id for API calls
      const eid =
        (eventItem && (eventItem.eventId ?? eventItem.id)) ??
        id

      if (!eid) throw new Error('Missing event ID')

      console.log('Saving event', { eventId: eid, payload })
      await updateEvent(eid, payload, { admin: true })
      toast({ status: 'success', title: 'Event updated' })
      await load()
    } catch (e) {
      console.error(e)
      toast({ status: 'error', title: 'Failed to save event' })
    }
  }

  if (!eventItem) return <Heading size="md">Loading…</Heading>

  // Flyer URL
  const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
  const flyerUrl = (() => {
    const p = eventItem?.flyerPath
    if (!p) return null
    if (/^(https?:|data:|blob:)/i.test(p)) return p
    const rel = p.startsWith('/') ? p : `/${p}`
    return `${API_BASE}${rel}`
  })()

  const goTab = (t) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('tab', t)
      return n
    })
  }

  return (
    <Box>
      <Heading size="lg" mb={3} display="flex" alignItems="center" gap="12px">
        {eventItem?.name || 'Untitled Event'}
        <Button
          size="sm"
          variant="outline"
          as="a"
          href={`/event/${eventItem?.eventId || eventItem?.id || id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview Public Page
        </Button>
      </Heading>

      {flyerUrl && (
        <Image
          src={flyerUrl}
          alt="Event Flyer"
          maxH="300px"
          mt={2}
          borderRadius="md"
          boxShadow="md"
        />
      )}

      <EventFormFields values={values} setValues={setValues} />
      <HStack justify="flex-end" mt={3} mb={6}>
        <Button colorScheme="blue" onClick={saveMeta}>Save</Button>
      </HStack>

      <Tabs colorScheme="blue" index={tabIndex} onChange={(i) => setTabIndex(i)}>
        <TabList>
          <Tab onClick={() => goTab('questions')}>Questions</Tab>
          <Tab onClick={() => goTab('responses')}>Responses</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <QuestionList eventId={id} />
          </TabPanel>
          <TabPanel>
            <ResponseTable eventId={id} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
