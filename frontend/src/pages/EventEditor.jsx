// src/pages/EventEditor.jsx
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Button,
  Image,
  useToast,
} from '@chakra-ui/react'

import { getEvent, updateEvent } from '../services/eventService'
import QuestionList from '../components/Question/QuestionList.jsx'
import ResponseTable from '../components/Response/ResponseTable.jsx'
import EventFormFields from '../components/Event/EventFormFields.jsx'
import { toFormState, toPayload } from '../utils/eventForm.js'

export default function EventEditor() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [eventItem, setEventItem] = useState(null)
  const [values, setValues] = useState(toFormState({}))
  const [tabIndex, setTabIndex] = useState(0) // 0=Questions,1=Responses (we’ll map below)
  const toast = useToast()

  // map ?tab=... → index (keeps your layout but lets us deep-link)
  useEffect(() => {
    const t = (searchParams.get('tab') || '').toLowerCase()
    // your order in markup is Questions first, then Responses
    if (t === 'responses') setTabIndex(1)
    else setTabIndex(0) // default "questions"
  }, [searchParams])

  const load = async () => {
    const ev = await getEvent(id, { admin: true })
    setEventItem(ev)
    setValues(toFormState(ev))
  }

  useEffect(() => { load() }, [id])

  const saveMeta = async () => {
    await updateEvent(id, toPayload(values), { admin: true })
    toast({ status: 'success', title: 'Event updated' })
    await load()
  }

  if (!eventItem) return <Heading size="md">Loading…</Heading>

  // Flyer URL handling
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const flyerUrl = (() => {
    const p = eventItem?.flyerPath
    if (!p) return null
    if (/^(https?:|data:|blob:)/i.test(p)) return p
    const rel = p.startsWith('/') ? p : `/${p}`
    return `${API_BASE}${rel}`
  })()

  const goTab = (t) => {
    // update ?tab=... without remounting
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('tab', t)
      return n
    })
  }

  return (
    <Box>
      <Heading size="lg" mb={3} display="flex" alignItems="center" gap="12px">
        {eventItem.name || 'Untitled Event'}
        <Button
          size="sm"
          variant="outline"
          as="a"
          href={`/event/${eventItem.eventId || eventItem.id}`}
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

      {/* Meta form (unchanged layout) */}
      <EventFormFields values={values} setValues={setValues} />
      <HStack justify="flex-end" mt={3} mb={6}>
        <Button colorScheme="blue" onClick={saveMeta}>Save</Button>
      </HStack>

      {/* Bottom tabs exactly like before */}
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
