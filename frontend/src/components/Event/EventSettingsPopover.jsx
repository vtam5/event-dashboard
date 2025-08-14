// frontend/src/components/Event/EventSettingsPopover.jsx
import { useState } from 'react';
import {
  Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton,
  PopoverHeader, PopoverBody, PopoverFooter,
  Button, Switch, FormControl, FormLabel, Select, Stack, useToast
} from '@chakra-ui/react';
import { updateEvent } from '../../services/eventService'; // ✅ make sure this exists (see below)

export default function EventSettingsPopover({ event, onSaved, children }) {
  const toast = useToast();

  // local working copies so toggles are controlled
  const [isPublished, setIsPublished] = useState(event?.isPublished || 'draft'); // 'public' | 'draft'
  const [status, setStatus] = useState(event?.status || 'closed');              // 'open' | 'closed'
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);

      // Normalize just in case anything different comes in
      const payload = {
        isPublished: String(isPublished).toLowerCase() === 'public' ? 'public' : 'draft',
        status: String(status).toLowerCase() === 'open' ? 'open' : 'closed',
      };

      // call backend
      const updated = await updateEvent(event.eventId, payload);

      toast({ status: 'success', title: 'Settings saved' });
      // notify parent (row/table) so it refreshes its state
      onSaved?.(updated || { ...event, ...payload });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Save failed';
      toast({ status: 'error', title: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>Event Settings</PopoverHeader>

        <PopoverBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Visibility</FormLabel>
              <Select
                value={isPublished}
                onChange={(e) => setIsPublished(e.target.value)}
              >
                <option value="draft">Private / Draft</option>
                <option value="public">Published</option>
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Open for responses</FormLabel>
              <Switch
                isChecked={status === 'open'}
                onChange={(e) => setStatus(e.target.checked ? 'open' : 'closed')}
              />
            </FormControl>
          </Stack>
        </PopoverBody>

        <PopoverFooter display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="ghost">Close</Button>
          {/* ✅ ensure this calls the handler; do NOT rely on form submit here */}
          <Button colorScheme="blue" onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}
