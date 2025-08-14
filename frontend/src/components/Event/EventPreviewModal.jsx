import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Button, Text, Stack, Divider, Badge, Image
  } from "@chakra-ui/react";
  
  export default function EventPreviewModal({ isOpen, onClose, event }) {
    if (!event) return null;
  
    const flyerUrl = event.flyerPath
      ? `${import.meta.env.VITE_API_BASE_URL || ""}${event.flyerPath}`
      : null;
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              {flyerUrl && (
                <Image
                  src={flyerUrl}
                  alt={`${event.name} flyer`}
                  borderRadius="md"
                  maxH="300px"
                  objectFit="cover"
                />
              )}
  
              <Text fontSize="xl" fontWeight="bold">{event.name}</Text>
              <Stack direction="row" spacing={2} align="center">
                <Badge
                  colorScheme={
                    event.isPublished === "open"
                      ? "green"
                      : event.isPublished === "closed"
                      ? "red"
                      : "gray"
                  }
                >
                  {event.isPublished?.toUpperCase()}
                </Badge>
                <Text>Date: {event.date || "-"}</Text>
                <Text>Time: {event.time || "-"}</Text>
              </Stack>
  
              <Text>Location: {event.location || "-"}</Text>
              <Divider />
              <Text whiteSpace="pre-line">
                {event.description || "No description provided."}
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
  