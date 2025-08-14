import { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Box,
  Text,
  Stack,
  Skeleton,
  useToast
} from '@chakra-ui/react';
import { fetchParticipantDetails } from '../../services/eventService';

export default function ParticipantsDrawer({ eventId, submissionId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchParticipantDetails(eventId, submissionId);
        setData(res);
      } catch (err) {
        toast({ status: 'error', title: 'Failed to load participant details' });
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) load();
  }, [eventId, submissionId, toast]);

  return (
    <Drawer isOpen={!!submissionId} placement="right" size="md" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Participant Details</DrawerHeader>
        <DrawerBody>
          {loading ? (
            <Skeleton h="200px" rounded="md" />
          ) : data ? (
            <Box>
              {/* Basic Info */}
              <Stack spacing={1} mb={4}>
                <Text><strong>Name:</strong> {data.firstName} {data.lastName}</Text>
                <Text><strong>Email:</strong> {data.email || '—'}</Text>
                <Text><strong>Phone:</strong> {data.phone || '—'}</Text>
                <Text><strong>Submitted:</strong> {data.createdAt || '—'}</Text>
              </Stack>

              {/* Questions + Answers */}
              <Box>
                <Text fontWeight="bold" mb={2}>Responses</Text>
                {data.answers && data.answers.length ? (
                  <Stack spacing={3}>
                    {data.answers.map((qa, i) => (
                      <Box key={i} p={3} borderWidth="1px" rounded="md">
                        <Text fontWeight="medium" mb={1}>
                          {qa.questionText}
                        </Text>
                        <Text color="gray.700">
                          {qa.answerText || '—'}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Text color="gray.500">No answers recorded.</Text>
                )}
              </Box>
            </Box>
          ) : (
            <Text color="gray.500">No details found.</Text>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
