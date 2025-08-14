import { useEffect, useState } from 'react';
import { Box, Heading, HStack, Button, Skeleton, Text } from '@chakra-ui/react';
import { NavLink, useParams } from 'react-router-dom';
import { fetchEventAdmin } from '../../services/eventService';

const TabLink = ({ to, children }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      textDecoration: 'none',
      padding: '8px 12px',
      borderRadius: 10,
      fontWeight: 600,
      color: isActive ? 'white' : '#2D3748',
      background: isActive ? '#3182CE' : 'transparent',
      border: isActive ? '1px solid #3182CE' : '1px solid #E2E8F0'
    })}
  >
    {children}
  </NavLink>
);

export default function EventTabs() {
  const { eventId } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchEventAdmin(eventId);
      setEv(data);
      setLoading(false);
    })();
  }, [eventId]);

  return (
    <Box pb={4} borderBottom="1px solid #EDF2F7" mb={4}>
      {loading ? (
        <Skeleton h="28px" w="60%" mb={2} />
      ) : (
        <Heading size="md">{ev?.name || `Event ${eventId}`}</Heading>
      )}
      <HStack spacing={2} mt={3}>
        <TabLink to={`/admin/events/${eventId}/details`}>Details</TabLink>
        <TabLink to={`/admin/events/${eventId}/questions`}>Questions</TabLink>
        <TabLink to={`/admin/events/${eventId}/responses`}>Responses</TabLink>
      </HStack>
      {!loading && ev && (
        <Text mt={2} color="gray.500">
          {ev.date || '-'} {ev.time ? `• ${ev.time}` : ''} {ev.location ? `• ${ev.location}` : ''}
        </Text>
      )}
    </Box>
  );
}
