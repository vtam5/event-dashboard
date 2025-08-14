import { HStack, Button, Text, Checkbox, Spacer } from '@chakra-ui/react'
import { updateEvent, deleteEvent } from '../../services/eventService'

export default function BulkToolbar({
  selectMode, setSelectMode,
  selectedIds, setSelectedIds,
  allIds, refresh
}) {
  const any = selectedIds.length > 0
  const toggleAll = () => setSelectedIds(
    selectedIds.length === allIds.length ? [] : [...allIds]
  )
  const bulk = async (fn) => {
    for (const id of selectedIds) { // simple sequential; fine for small lists
      // eslint-disable-next-line no-await-in-loop
      await fn(id)
    }
    await refresh?.()
    setSelectedIds([])
  }

  return (
    <HStack w="100%" p={2} borderWidth="1px" borderRadius="md" bg="gray.50">
      <Checkbox isChecked={selectMode} onChange={(e)=>setSelectMode(e.target.checked)}>Select</Checkbox>
      {selectMode && (
        <>
          <Button size="sm" onClick={toggleAll}>{selectedIds.length === allIds.length ? 'Clear All' : 'Select All'}</Button>
          <Text fontSize="sm" color="gray.600">{selectedIds.length} selected</Text>
          <Spacer />
          <Button size="sm" onClick={()=>bulk(id => updateEvent(id, { status: 'open' }, { admin: true }))}>Open</Button>
          <Button size="sm" onClick={()=>bulk(id => updateEvent(id, { status: 'private' }, { admin: true }))}>Make Private</Button>
          <Button size="sm" onClick={()=>bulk(id => updateEvent(id, { status: 'closed' }, { admin: true }))}>Close</Button>
          <Button size="sm" onClick={()=>bulk(id => updateEvent(id, { status: 'archived' }, { admin: true }))}>Archive</Button>
          <Button size="sm" colorScheme="red" onClick={()=>bulk(id => deleteEvent(id))}>Delete</Button>
        </>
      )}
    </HStack>
  )
}
