import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Stack, Input, Textarea, Checkbox, CheckboxGroup,
  Radio, RadioGroup, Button, Skeleton, FormControl, FormLabel, FormErrorMessage
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchEventPublic, fetchQuestions, submitResponse } from '../../services/eventService';
import { useForm } from 'react-hook-form';
import { useToast } from '@chakra-ui/react';

const TEXT_TYPES = ['shortText', 'longText'];

export default function EventForm() {
  const toast = useToast(); // ✅ moved inside the component

  const { eventId } = useParams();
  const [ev, setEv] = useState(null);
  const [qs, setQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [e, questions] = await Promise.all([
        fetchEventPublic(eventId),
        fetchQuestions(eventId)
      ]);
      setEv(e || null);
      setQs(questions || []);
      setLoading(false);
    })();
  }, [eventId]);

  const onSubmit = async (data) => {
    const participant = {
      firstName:  data.firstName,
      lastName:   data.lastName,
      email:      data.email,
      phone:      data.phone,
      homeNumber: data.homeNumber,
      street:     data.street,
      apartment:  data.apartment || null,
      city:       data.city,
      state:      data.state,
      zipcode:    data.zipcode,
    };

    const answers = qs.map(q => {
      const key = `q_${q.questionId}`;
      const val = data[key] ?? null;
      return {
        questionId: q.questionId,
        answerText: Array.isArray(val) ? val.join(', ') : (val ?? '')
      };
    });

    try {
      await submitResponse(eventId, { participant, answers });
      toast({ status: 'success', title: 'Submitted!' });
      nav(`/event/${eventId}`);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Submit failed';
      toast({ status: 'error', title: msg });
    }
  };

  if (loading) return <Box p={6}><Skeleton h="320px" rounded="xl" /></Box>;
  if (!ev) return <Box p={6}><Text>Event not found.</Text></Box>;
  if (ev.status === 'closed') return <Box p={6}><Text>Registration is closed for this event.</Text></Box>;
  if (ev.status !== 'open')  return <Box p={6}><Text>Event is not accepting responses.</Text></Box>;

  return (
    <Box p={6} maxW="800px" mx="auto">
      <Heading mb={4}>Register: {ev.name}</Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={5}>
          {/* ===== Required participant info ===== */}
          <FormControl isRequired isInvalid={!!errors.firstName}>
            <FormLabel>First name</FormLabel>
            <Input {...register('firstName', { required: 'Required' })} />
            <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.lastName}>
            <FormLabel>Last name</FormLabel>
            <Input {...register('lastName', { required: 'Required' })} />
            <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              {...register('email', {
                required: 'Required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
              })}
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.phone}>
            <FormLabel>Phone</FormLabel>
            <Input type="tel" {...register('phone', { required: 'Required' })} />
            <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
          </FormControl>

          {/* ===== Address fields ===== */}
          <FormControl isRequired isInvalid={!!errors.homeNumber}>
            <FormLabel>Home Number</FormLabel>
            <Input {...register('homeNumber', { required: 'Required' })} />
            <FormErrorMessage>{errors.homeNumber?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.street}>
            <FormLabel>Street</FormLabel>
            <Input {...register('street', { required: 'Required' })} />
            <FormErrorMessage>{errors.street?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.apartment}>
            <FormLabel>Apartment (Optional)</FormLabel>
            <Input {...register('apartment')} />
            <FormErrorMessage>{errors.apartment?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.city}>
            <FormLabel>City</FormLabel>
            <Input {...register('city', { required: 'Required' })} />
            <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.state}>
            <FormLabel>State</FormLabel>
            <Input {...register('state', { required: 'Required' })} />
            <FormErrorMessage>{errors.state?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.zipcode}>
            <FormLabel>ZIP Code</FormLabel>
            <Input
              {...register('zipcode', {
                required: 'Required',
                pattern: { value: /^[0-9]{5}(-[0-9]{4})?$/, message: 'Invalid ZIP code' }
              })}
            />
            <FormErrorMessage>{errors.zipcode?.message}</FormErrorMessage>
          </FormControl>

          {/* ===== Dynamic custom questions ===== */}
          {qs.map(q => {
            const name = `q_${q.questionId}`;
            const req = !!q.isRequired;

            if (TEXT_TYPES.includes(q.questionType)) {
              return (
                <FormControl key={q.questionId} isRequired={req} isInvalid={!!errors[name]}>
                  <FormLabel>{q.questionText}</FormLabel>
                  {q.questionType === 'longText'
                    ? <Textarea {...register(name, { required: req && 'This field is required' })} />
                    : <Input {...register(name, { required: req && 'This field is required' })} />
                  }
                  <FormErrorMessage>{errors[name]?.message}</FormErrorMessage>
                </FormControl>
              );
            }

            if (q.questionType === 'singleChoice') {
              return (
                <FormControl key={q.questionId} isRequired={req} isInvalid={!!errors[name]}>
                  <FormLabel>{q.questionText}</FormLabel>
                  <RadioGroup onChange={(v)=>setValue(name, v)}>
                    <Stack>
                      {(q.options || []).map(o => (
                        <Radio key={o.optionId} value={o.optionText}>{o.optionText}</Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                  <input type="hidden" {...register(name, { required: req && 'Please select one' })} />
                  <FormErrorMessage>{errors[name]?.message}</FormErrorMessage>
                </FormControl>
              );
            }

            if (q.questionType === 'multipleChoice') {
              return (
                <FormControl key={q.questionId} isRequired={req} isInvalid={!!errors[name]}>
                  <FormLabel>{q.questionText}</FormLabel>
                  <CheckboxGroup onChange={(vals)=>setValue(name, vals)}>
                    <Stack>
                      {(q.options || []).map(o => (
                        <Checkbox key={o.optionId} value={o.optionText}>{o.optionText}</Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                  <input
                    type="hidden"
                    {...register(name, {
                      validate: v => (!req || (Array.isArray(v) && v.length > 0)) || 'Please select at least one'
                    })}
                  />
                  <FormErrorMessage>{errors[name]?.message}</FormErrorMessage>
                </FormControl>
              );
            }

            return <Text key={q.questionId}>Unsupported type: {q.questionType}</Text>;
          })}

          <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
            Submit
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
