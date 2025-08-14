import { useEffect, useMemo, useState } from 'react'
import {
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay,
  Box, HStack, VStack, Text, Badge, Input, IconButton, Tooltip, Spinner, Button, useToast
} from '@chakra-ui/react'
import { CopyIcon, RepeatIcon } from '@chakra-ui/icons'
import { fetchEventResponses } from '../../services/eventService'
import { prettyDateTime } from '../../utils/format'

export default function ParticipantsDrawer({ isOpen, onClose, event }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const toast = useToast()
  const eventId = event?.eventId

  const load = async () => {
    if (!eventId) return
    try {
      setLoading(true)
      const data = await fetchEventResponses(eventId)
      // Expect shape: [{ id, participantName, participantEmail, createdAt, answers: [...] }, ...]
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      toast({ status: 'error', title: 'Failed to load participants' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventId])

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const t = q.toLowerCase()
    return items.filter(r =>
      (r.participantName || '').toLowerCase().includes(t) ||
      (r.participantEmail || '').toLowerCase().includes(t)
    )
  }, [items, q])

  const emailsCSV = useMemo(
    () => filtered.map(r => r.participantEmail).filter(Boolean).join(', '),
    [filtered]
  )

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(emailsCSV)
      toast({ status: 'success', title: 'Emails copied' })
    } catch {
      toast({ status: 'error', title: 'Copy failed' })
    }
  }

  return (
    <Drawer isOpen={isOpen} placement="right" size="lg" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          Participants · {event?.name || 'Event'}{' '}
          <Badge ml={2} colorScheme="gray">{items.length}</Badge>
        </DrawerHeader>
        <DrawerBody>
          <HStack mb={3}>
            <Input
              placeholder="Search by name or email…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
            <Tooltip label="Reload">
              <IconButton aria-label="Reload" icon={<RepeatIcon />} onClick={load} />
            </Tooltip>
            <Tooltip label="Copy all emails">
              <IconButton aria-label="Copy emails" icon={<CopyIcon />} onClick={copyEmails} isDisabled={!emailsCSV} />
            </Tooltip>
          </HStack>

          {loading ? (
            <HStack><Spinner /><Text>Loading…</Text></HStack>
          ) : (
            <VStack align="stretch" spacing={3}>
              {filtered.map((r) => (
                <Box key={r.id} border="1px solid" borderColor="gray.200" rounded="lg" p={3}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="semibold">{r.participantName || 'Anonymous'}</Text>
                    <Text fontSize="sm" color="gray.600">{prettyDateTime(r.createdAt)}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.700">{r.participantEmail || '—'}</Text>

                  {Array.isArray(r.answers) && r.answers.length > 0 && (
                    <VStack align="stretch" spacing={1} mt={2}>
                      {r.answers.map((a, idx) => (
                        <Box key={idx} bg="gray.50" p={2} rounded="md">
                          <Text fontSize="sm" color="gray.600">{a.questionText || `Q${a.questionId}`}</Text>
                          <Text>{a.answerText ?? ''}</Text>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              ))}

              {!filtered.length && (
                <VStack py={10} color="gray.500">
                  <Text>No participants found.</Text>
                  <Button onClick={load} leftIcon={<RepeatIcon />}>Reload</Button>
                </VStack>
              )}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
