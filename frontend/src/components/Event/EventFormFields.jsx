// frontend/src/components/Event/EventFormFields.jsx
import {
  FormControl, FormLabel, Input, Textarea, Switch, Select, HStack, NumberInput,
  NumberInputField, SimpleGrid
} from '@chakra-ui/react';

export default function EventFormFields({ values, setValues }) {
  const set = (key) => (eOrVal) => {
    const val = eOrVal?.target ? eOrVal.target.value : eOrVal;
    setValues((v) => ({ ...v, [key]: val }));
  };

  const setBool = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.checked }));

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      <FormControl isRequired>
        <FormLabel>Name</FormLabel>
        <Input value={values.name} onChange={set('name')} placeholder="Event name" />
      </FormControl>

      <FormControl>
        <FormLabel>Status</FormLabel>
        <Select value={values.status} onChange={set('status')}>
          <option value="private">Private</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Date</FormLabel>
        <Input type="date" value={values.date} onChange={set('date')} />
      </FormControl>

      <HStack spacing={4}>
        <FormControl>
          <FormLabel>Start Time</FormLabel>
          <Input type="time" value={values.time} onChange={set('time')} />
        </FormControl>
        <FormControl>
          <FormLabel>End Time</FormLabel>
          <Input type="time" value={values.endTime} onChange={set('endTime')} />
        </FormControl>
      </HStack>

      <FormControl>
        <FormLabel>Location</FormLabel>
        <Input value={values.location} onChange={set('location')} placeholder="Location" />
      </FormControl>

      <FormControl>
        <FormLabel>Flyer Path (optional)</FormLabel>
        <Input value={values.flyerPath} onChange={set('flyerPath')} placeholder="/uploads/flyer.png" />
      </FormControl>

      <FormControl gridColumn={{ base: 'span 1', md: 'span 2' }}>
        <FormLabel>Description</FormLabel>
        <Textarea value={values.description} onChange={set('description')} rows={4} />
      </FormControl>

      <FormControl>
        <FormLabel>Capacity Limit</FormLabel>
        <NumberInput
          value={values.capacityLimit ?? ''}
          onChange={(_, num) => setValues((v) => ({ ...v, capacityLimit: Number.isFinite(num) ? num : '' }))}
          min={0}
        >
          <NumberInputField placeholder="Leave empty for unlimited" />
        </NumberInput>
      </FormControl>

      <FormControl>
        <FormLabel>Close On</FormLabel>
        <Input type="datetime-local" value={values.closeOn} onChange={set('closeOn')} />
      </FormControl>

      <FormControl display="flex" alignItems="center">
        <FormLabel mb="0">Allow Response Editing</FormLabel>
        <Switch isChecked={values.allowResponseEdit} onChange={setBool('allowResponseEdit')} />
      </FormControl>

      <FormControl display="flex" alignItems="center">
        <FormLabel mb="0">Email Confirmation</FormLabel>
        <Switch isChecked={values.emailConfirmation} onChange={setBool('emailConfirmation')} />
      </FormControl>
    </SimpleGrid>
  );
}
