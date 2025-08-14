import { useEffect, useState } from 'react';
import { Box, Heading, Text, Stack, Button, Skeleton, Image } from '@chakra-ui/react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { fetchEventPublic } from '../../services/eventService';

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function EventDetails() {
  const { eventId } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const e = await fetchEventPublic(eventId);
      setEv(e || null);
      setLoading(false);
    })();
  }, [eventId]);

  if (loading) return <Box p={6}><Skeleton h="220px" rounded="xl" /></Box>;
  if (!ev) return <Box p={6}><Heading size="md">Event not found</Heading></Box>;

  const flyerUrl = ev.flyerPath
    ? (/^(https?:|data:|blob:)/i.test(ev.flyerPath) ? ev.flyerPath : `${BASE}${ev.flyerPath.startsWith('/') ? '' : '/'}${ev.flyerPath}`)
    : null;

  return (
    <Box p={6} maxW="900px" mx="auto">
      <Stack spacing={4}>
        <Heading>{ev.name}</Heading>
        <Text>{ev.date} {ev.time ? `• ${ev.time}` : ''} {ev.location ? `• ${ev.location}` : ''}</Text>
        {flyerUrl && <Image src={flyerUrl} alt="Event flyer" maxH="300px" objectFit="contain" borderRadius="md" />}
        <Text whiteSpace="pre-line">{ev.description || 'No description provided.'}</Text>

        {ev.status === 'open' && (
          <Button as={RouterLink} to={`/event/${eventId}/register`} colorScheme="blue">
            Register
          </Button>
        )}
        {ev.status === 'closed' && (
          <Text color="orange.500" fontWeight="semibold">Registration is closed.</Text>
        )}
      </Stack>
    </Box>
  );
}
