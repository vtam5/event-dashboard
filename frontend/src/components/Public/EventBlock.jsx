import { useState } from 'react'
import { Box, Stack, Heading, Text, Button, Badge, Image } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { formatEventDateTime } from '../../utils/format.js'

export default function EventBlock({ event, item, clickable = true }) {
  const ev = event || item || {}
  const eventId = ev.eventId

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const flyerPath = ev?.flyerPath || ''
  const flyerUrl = flyerPath
    ? (/^(https?:|data:|blob:)/i.test(flyerPath)
        ? flyerPath
        : `${API_BASE}${flyerPath.startsWith('/') ? flyerPath : `/${flyerPath}`}`)
    : ''

  const [imgOk, setImgOk] = useState(true)
  const when = formatEventDateTime(ev.date, ev.time)
  const where = ev.location ? ` • ${ev.location}` : ''

  const cap = Number.isFinite(+ev.capacityLimit) ? +ev.capacityLimit : null
  const count = Number.isFinite(+ev.participantCount) ? +ev.participantCount : 0
  const capacityLeft = cap == null ? null : Math.max(0, cap - count)

  // prefer displayStatus if backend provided it, fallback to status or empty string
  const status = String(ev.displayStatus || ev.status || '').toLowerCase()

  return (
    <Box
      as={clickable && eventId != null ? Link : 'div'}
      to={clickable && eventId != null ? `/event/${eventId}` : undefined}
      border="1px solid"
      borderColor="gray.200"
      rounded="xl"
      p={4}
      _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
    >
      <Stack spacing={2}>
        {flyerUrl && (
          imgOk ? (
            <Box>
              <Image
                src={flyerUrl}
                alt={`${ev.name || 'Event'} flyer`}
                rounded="md"
                objectFit="cover"
                maxH="140px"
                onError={()=>setImgOk(false)}
              />
            </Box>
          ) : (
            <Button
              as="a"
              href={flyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="sm"
              alignSelf="start"
              onClick={(e)=>e.stopPropagation()}
            >
              Open flyer URL
            </Button>
          )
        )}

        <Heading size="md" noOfLines={2}>{ev.name || 'Untitled Event'}</Heading>

        {(when || ev.location) && (
          <Text fontSize="sm" color="gray.600">
            {when}{where}
          </Text>
        )}

        <Stack direction="row" spacing={2} align="center">
          <Badge variant="subtle">
            {status === 'open' ? 'OPEN'
             : status === 'closed' ? 'CLOSED'
             : status === 'private' ? 'PRIVATE'
             : status === 'archived' ? 'ARCHIVED'
             : 'DRAFT'}
          </Badge>
          {cap != null && (
            <Badge colorScheme={capacityLeft > 0 ? 'green' : 'red'}>
              {capacityLeft > 0 ? `${capacityLeft} SPOTS LEFT` : 'FULL'}
            </Badge>
          )}
        </Stack>

        {clickable && eventId != null && (
          <Button as={Link} to={`/event/${eventId}`} colorScheme="blue" size="sm" alignSelf="start">
            View & Register
          </Button>
        )}
      </Stack>
    </Box>
  )
}
