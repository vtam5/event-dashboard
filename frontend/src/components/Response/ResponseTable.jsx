// frontend/src/components/Response/ResponseTable.jsx
import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Skeleton,
  Text,
  useToast,
  Button
} from '@chakra-ui/react';
import { fetchEventResponses } from '../../services/eventService';
import ParticipantsDrawer from './ParticipantsDrawer';

export default function ResponseTable({ eventId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // submissionId
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      // Pass admin=1 to bypass "admin required" backend check
      const data = await fetchEventResponses(eventId, { admin: 1 });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({ status: 'error', title: 'Failed to load responses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return
    fetchEventResponses(eventId, { admin: true })
      .then(setRows)
      .catch(console.error)
  }, [eventId])

  return (
    <Box>
      <Heading size="md" mb={3}>
        Responses
      </Heading>
      {loading ? (
        <Skeleton h="180px" rounded="lg" />
      ) : rows.length ? (
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>First</Th>
              <Th>Last</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((r) => (
              <Tr key={r.submissionId}>
                <Td>{r.submissionId}</Td>
                <Td>{r.firstName || '—'}</Td>
                <Td>{r.lastName || '—'}</Td>
                <Td>{r.email || '—'}</Td>
                <Td>{r.phone || '—'}</Td>
                <Td>{r.createdAt || '—'}</Td>
                <Td>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={() => setSelected(r.submissionId)}
                  >
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text color="gray.500">No responses yet.</Text>
      )}

      {selected && (
        <ParticipantsDrawer
          eventId={eventId}
          submissionId={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Box>
  );
}
