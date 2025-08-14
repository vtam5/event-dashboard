// frontend/src/components/Event/EventSettingsPopover.jsx
import { useState } from 'react';
import {
  Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton,
  PopoverHeader, PopoverBody, PopoverFooter,
  Button, Switch, FormControl, FormLabel, Select, Stack, useToast
} from '@chakra-ui/react';
import { updateEvent } from '../../services/eventService';

const STATUS = ['private','open','closed','archived'];

export default function EventSettingsPopover({ event, onSaved, children }) {
  const toast = useToast();
  const [status, setStatus] = useState(event?.status || 'private');
  const [allowResponseEdit, setAllowResponseEdit] = useState(!!event?.allowResponseEdit);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateEvent(event.eventId || event.id, { status, allowResponseEdit }, { admin: true });
      toast({ status: 'success', title: 'Settings saved' });
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast({ status: 'error', title: 'Save failed', description: e?.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent w="360px">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader fontWeight="semibold">Event Settings</PopoverHeader>
        <PopoverBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                {STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb="0">Allow response editing</FormLabel>
              <Switch isChecked={allowResponseEdit} onChange={e => setAllowResponseEdit(e.target.checked)} />
            </FormControl>
          </Stack>
        </PopoverBody>

        <PopoverFooter display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="ghost">Close</Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}
