// src/components/Event/EventRow.jsx
import { Link } from 'react-router-dom'
import {
  Box, Grid, GridItem, Text, Badge, HStack,
  IconButton, Tooltip, useToast
} from '@chakra-ui/react'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { formatEventDateTime } from '../../utils/format.js'
import EventSettingsPopover from './EventSettingsPopover.jsx'
import StatusPill from './StatusPill.jsx'
import { deleteEvent } from '../../services/eventService'

function ParticipantsCell({ responsesCount = 0, capacityLimit = null }) {
  const n = Number(responsesCount) || 0
  const cap = Number.isFinite(capacityLimit) ? capacityLimit : null
  return (
    <Badge variant="subtle" colorScheme="gray">
      {cap != null ? `${n} / ${cap}` : `${n}`}
    </Badge>
  )
}

export default function EventRow({ eventItem, displayIndex = '', onChanged }) {
  const toast = useToast()
  const eid = eventItem?.eventId

  const remove = async () => {
    if (!window.confirm('Delete this event?')) return
    await deleteEvent(eid)
    toast({ status: 'success', title: 'Event deleted' })
    onChanged?.()
  }

  // Keep grid the same as header (see EventList.jsx)
  return (
    <Box
      as="article"
      border="1px solid"
      borderColor="gray.200"
      rounded="xl"
      bg="white"
      shadow="sm"
      _hover={{ borderColor: 'gray.300', shadow: 'md' }}
    >
      <Grid
        alignItems="center"
        px={4}
        py={3}
        columnGap={4}
        templateColumns="
          64px            /* #   */
          2fr             /* Name */
          140px           /* Date */
          110px           /* Time */
          1.4fr           /* Location */
          130px           /* Participants */
          120px           /* Status */
          160px           /* Actions */
        "
      >
        <GridItem>
          <Badge variant="subtle" colorScheme="gray" minW="44px" textAlign="center">
            #{displayIndex}
          </Badge>
        </GridItem>

        <GridItem minW={0}>
          <Text
            as={Link}
            to={`/admin/events/${eid}`}
            fontWeight="semibold"
            noOfLines={1}
            title={eventItem.name}
          >
            {eventItem.name}
          </Text>
        </GridItem>

        <GridItem>
          <Text fontSize="sm" color="gray.700">
            {formatEventDateTime(eventItem.date, null)?.split('•')[0] || '-'}
          </Text>
        </GridItem>

        <GridItem>
          <Text fontSize="sm" color="gray.700">
            {eventItem.time || '—'}
          </Text>
        </GridItem>

        <GridItem>
          <Text fontSize="sm" color="gray.700" noOfLines={1} title={eventItem.location || ''}>
            {eventItem.location || '—'}
          </Text>
        </GridItem>

        <GridItem>
          <ParticipantsCell
            responsesCount={eventItem.responsesCount}
            capacityLimit={eventItem.capacityLimit}
          />
        </GridItem>

        <GridItem>
          <StatusPill state={eventItem.displayStatus || eventItem.status} />
        </GridItem>

        <GridItem>
          <HStack justify="flex-end" spacing={3}>
            <Tooltip label="Edit">
              <IconButton
                as={Link}
                to={`/admin/events/${eid}`}
                aria-label="Edit"
                icon={<EditIcon />}
                size="sm"
                variant="outline"
              />
            </Tooltip>

            <EventSettingsPopover eventItem={eventItem} onChanged={onChanged} />

            <Tooltip label="Delete">
              <IconButton
                aria-label="Delete"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                onClick={remove}
              />
            </Tooltip>
          </HStack>
        </GridItem>
      </Grid>
    </Box>
  )
}
