import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useParams, Link as RouterLink } from 'react-router-dom';

export default function ThankYou() {
  const { eventId } = useParams();
  return (
    <Box p={6} textAlign="center">
      <Heading mb={3}>Thanks for registering!</Heading>
      <Text mb={6}>We’ve recorded your response.</Text>
      <Button as={RouterLink} to={`/event/${eventId}`} variant="outline">
        Back to event
      </Button>
    </Box>
  );
}
