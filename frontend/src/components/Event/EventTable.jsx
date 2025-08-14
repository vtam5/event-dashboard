import { Link } from 'react-router-dom'
import {
  Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton, HStack, Spinner, useToast, useDisclosure
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, ViewIcon, SettingsIcon } from '@chakra-ui/icons'
import { deleteEvent, updateEvent } from '../../services/eventService'
import EventFormModal from './EventFormModal.jsx'
import EventSettingsPopover from './EventSettingsPopover.jsx'
import ConfirmDialog from '../Shared/ConfirmDialog.jsx'
import { useState } from 'react'

export default function EventTable({ items = [], loading, onChanged }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const editModal = useDisclosure()
  const toast = useToast()

  const onDelete = async () => {
    try {
      await deleteEvent(deleting.eventId || deleting.id)
      toast({ status: 'success', title: 'Event deleted' })
      setDeleting(null)
      onChanged?.()
    } catch {
      toast({ status: 'error', title: 'Delete failed' })
    }
  }

  const onEdit = async (payload) => {
    await updateEvent(editing.eventId || editing.id, payload, { admin: true })
    editModal.onClose(); setEditing(null)
    onChanged?.()
    toast({ status: 'success', title: 'Event updated' })
  }

  if (loading) return <Spinner />

  return (
    <>
      <Table bg="white" rounded="md" shadow="sm">
        <Thead>
          <Tr>
            <Th>Name</Th><Th>Date</Th><Th>Participants</Th><Th>Status</Th><Th isNumeric>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map(ev => (
            <Tr key={ev.eventId || ev.id}>
              <Td>{ev.name}</Td>
              <Td>{ev.date ?? ''}</Td>
              <Td>{ev.participantCount ?? '-'}</Td>
              <Td>{ev.isPublished === 'published' || ev.isPublished === true
                  ? <Badge colorScheme="green">Published</Badge>
                  : <Badge>Draft</Badge>}
              </Td>
              <Td isNumeric>
                <HStack justify="flex-end" spacing={1}>
                  <IconButton as={Link} to={`/admin/events/${ev.eventId || ev.id}`} aria-label="View" icon={<ViewIcon />} size="sm"/>
                  <IconButton aria-label="Edit" icon={<EditIcon />} size="sm"
                    onClick={()=>{ setEditing(ev); editModal.onOpen() }} />
                  <EventSettingsPopover eventItem={ev} onChanged={onChanged} />
                  <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red"
                    onClick={()=>setDeleting(ev)} />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {editing && (
        <EventFormModal
          isOpen={editModal.isOpen}
          onClose={()=>{ editModal.onClose(); setEditing(null) }}
          onSubmit={onEdit}
          defaultValues={editing}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={()=>setDeleting(null)}
        title="Delete event?"
        message="This cannot be undone."
        onConfirm={onDelete}
      />
    </>
  )
}
