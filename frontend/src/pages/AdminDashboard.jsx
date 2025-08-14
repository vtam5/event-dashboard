import { useEffect, useState } from 'react';
import {
  Box, HStack, Heading, Spacer, Select, Button, useDisclosure, useToast, Skeleton,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  listEvents, createEvent, reorderEvents, exportEventsCSV, deleteEvent,
} from '../services/eventService';
import EventFormModal from '../components/Event/EventFormModal.jsx';
import EventList from '../components/Event/EventList.jsx';
import ParticipantsDrawer from '../components/Event/ParticipantsDrawer.jsx';
import EventPreviewModal from '../components/Event/EventPreviewModal.jsx';
import { SORT_OPTIONS } from '../utils/constants';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [sort, setSort] = useState('created');
  const [loading, setLoading] = useState(true);

  const [participantsEvent, setParticipantsEvent] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);

  const modal = useDisclosure();     // New Event
  const ppl = useDisclosure();       // Participants Drawer
  const preview = useDisclosure();   // Preview Modal
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      // admin listing, keep your same sort options
      const data = await listEvents({ admin: true, sort });
      setEvents(data || []);
    } catch (e) {
      console.error(e);
      toast({ status: 'error', title: 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sort]); // eslint-disable-line

  const onCreate = async (payload) => {
    try {
      await createEvent(payload);
      modal.onClose();
      await load();
      toast({ status: 'success', title: 'Event created' });
    } catch (e) {
      console.error(e);
      toast({ status: 'error', title: 'Create failed' });
    }
  };

  // ---- row interactions (unchanged UI; just smarter routes) ----
  const goEdit = (eventItem, tab /* optional: 'questions' | 'responses' */) => {
    const suffix = tab ? `?tab=${tab}` : '';
    navigate(`/admin/events/${eventItem.eventId}/edit${suffix}`);
  };

  const handlePreview = (eventItem) => { setPreviewEvent(eventItem); preview.onOpen(); };
  const handleOpenParticipants = (eventItem) => { setParticipantsEvent(eventItem); ppl.onOpen(); };
  const handleGoEdit = (eventItem, tab) => goEdit(eventItem, tab); // keeps old name used by EventList
  const handleDelete = async (eventItem) => {
    if (!window.confirm(`Delete "${eventItem.name}"?`)) return;
    try {
      await deleteEvent(eventItem.eventId);
      await load();
      toast({ status: 'success', title: 'Event deleted' });
    } catch (e) {
      console.error(e);
      toast({ status: 'error', title: 'Delete failed' });
    }
  };

  const onReorder = async (orderedIds) => {
    try { await reorderEvents(orderedIds); await load(); }
    catch (e) { console.error(e); toast({ status: 'error', title: 'Reorder failed' }); }
  };

  return (
    <Box>
      <HStack mb={3} spacing={3}>
        <Heading size="lg">Admin Dashboard</Heading>
        <Spacer />
        <Select maxW="220px" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Button onClick={() => exportEventsCSV()} variant="outline">Export Events CSV</Button>
        <Button colorScheme="blue" onClick={modal.onOpen}>New Event</Button>
      </HStack>

      {loading ? (
        <Skeleton height="260px" rounded="xl" />
      ) : (
        <EventList
          items={events}
          onPreviewEvent={handlePreview}
          onOpenParticipants={handleOpenParticipants}
          // Keep same prop names your list expects:
          onEditEvent={handleGoEdit}          // can be called as onEditEvent(e) or onEditEvent(e, 'questions')
          onDeleteEvent={handleDelete}
          sortable={sort === 'custom'}
          onReorder={onReorder}
        />
      )}

      <EventFormModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onSubmit={onCreate}
      />

      <ParticipantsDrawer
        isOpen={ppl.isOpen}
        onClose={ppl.onClose}
        event={participantsEvent}
      />

      <EventPreviewModal
        isOpen={preview.isOpen}
        onClose={preview.onClose}
        event={previewEvent}
      />
    </Box>
  );
}
