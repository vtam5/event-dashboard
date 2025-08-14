import { useEffect, useState } from 'react';
import { Box, Heading, Input, HStack, Button, VStack, Text, Skeleton, useToast } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import EventTabs from '../components/Admin/EventTabs.jsx';
import { fetchEventResponses } from '../services/eventService';

export default function AdminResponses() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchEventResponses(eventId);
      setItems(rows);
    } catch (e) {
      toast({ status: 'error', title: 'Failed to load responses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventId]);

  const filtered = items.filter(r =>
    JSON.stringify(r).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Box p={6}>
      <EventTabs />
      <Heading size="md" mb={3}>Responses</Heading>
      <HStack mb={3}>
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={load}>Refresh</Button>
      </HStack>
      {loading ? (
        <VStack align="stretch">{Array.from({length:4}).map((_,i)=><Skeleton key={i} h="60px" rounded="md" />)}</VStack>
      ) : (
        <VStack align="stretch">
          {filtered.map((r,i)=>(
            <Box key={i} p={3} borderWidth="1px" rounded="md">
              <Text fontSize="sm" color="gray.600">Submission #{r.submissionId}</Text>
              <pre style={{whiteSpace:'pre-wrap', margin:0}}>{JSON.stringify(r, null, 2)}</pre>
            </Box>
          ))}
          {!filtered.length && <Text color="gray.500">No responses yet.</Text>}
        </VStack>
      )}
    </Box>
  );
}
