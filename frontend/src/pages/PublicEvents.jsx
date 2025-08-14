// src/pages/PublicEvents.jsx
import { useEffect, useState } from 'react';
import { Box, Heading, VStack, Skeleton, Text, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { listEvents } from '../services/eventService';

export default function PublicEvents() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const rows = await listEvents({ admin: false, when: 'active' }); // backend filters to open/closed
      setItems(rows || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Box p={6}><Skeleton h="240px" rounded="xl" /></Box>;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Public Events</Heading>
      <VStack align="stretch" spacing={3}>
        {items.length === 0 && <Text color="gray.500">No events available.</Text>}
        {items.map(e => (
          <Box key={e.eventId} p={4} borderWidth="1px" rounded="md">
            <Heading size="md">{e.name}</Heading>
            <Text color="gray.600">{e.date} {e.time ? `• ${e.time}` : ''} {e.location ? `• ${e.location}` : ''}</Text>
            <Button
              as={RouterLink}
              to={`/event/${e.eventId}`}
              mt={3}
              colorScheme="blue"
            >
              View
            </Button>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
