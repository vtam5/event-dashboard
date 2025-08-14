// src/components/Question/QuestionList.jsx
import { useEffect, useState } from 'react';
import {
  Box, HStack, Heading, Button, VStack, Skeleton, Text, useToast,
  IconButton, Input, Textarea, Select, Badge
} from '@chakra-ui/react';
import { Plus, Trash2, Save, Edit3 } from 'react-feather';
import {
  fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
  addQuestionOption, updateQuestionOption, deleteQuestionOption
} from '../../services/eventService';

const TEXT_TYPES = ['shortText','longText'];
const ALL_TYPES = [
  { value: 'shortText', label: 'Short answer' },
  { value: 'longText', label: 'Paragraph' },
  { value: 'singleChoice', label: 'Multiple choice (single)' },
  { value: 'multipleChoice', label: 'Checkboxes (multiple)' },
];

// NEW — informational card pinned at the top
function ParticipantInfoRequired() {
  return (
    <Box p={4} borderWidth="1px" rounded="lg" bg="gray.50">
      <Heading size="sm" mb={2}>Participant Info (required)</Heading>
      <Text fontSize="sm" color="gray.600" mb={3}>
        These fields are always collected on the public form and saved to Participants.
      </Text>
      <HStack spacing={3} wrap="wrap">
        <Badge colorScheme="red">First name</Badge>
        <Badge colorScheme="red">Last name</Badge>
        <Badge colorScheme="red">Email</Badge>
        <Badge colorScheme="red">Phone</Badge>
      </HStack>
    </Box>
  );
}

function QuestionCard({ eventId, q, onSaved, onDeleted }) {
  const toast = useToast();
  const [edit, setEdit] = useState(!q?.questionId);
  const [text, setText] = useState(q?.questionText || '');
  const [type, setType] = useState(q?.questionType || 'shortText');
  const [reqd, setReqd] = useState(!!q?.isRequired);
  const [options, setOptions] = useState(q?.options || []);
  const [newOpt, setNewOpt] = useState('');
  const isText = TEXT_TYPES.includes(type);

  const save = async () => {
    try {
      if (q?.questionId) {
        await updateQuestion(eventId, q.questionId, { questionText: text, questionType: type, isRequired: reqd });
        if (!isText) {
          for (const o of options) {
            if (o._dirty && o.optionId) {
              await updateQuestionOption(eventId, q.questionId, o.optionId, o.optionText);
              o._dirty = false;
            }
          }
        }
        toast({ status: 'success', title: 'Question updated' });
      } else {
        const { questionId } = await createQuestion(eventId, { questionText: text, questionType: type, isRequired: reqd });
        if (!isText) {
          for (const o of options) await addQuestionOption(eventId, questionId, o.optionText);
        }
        toast({ status: 'success', title: 'Question created' });
      }
      setEdit(false);
      onSaved?.();
    } catch (e) {
      toast({ status: 'error', title: e?.response?.data?.error || e.message });
    }
  };

  const addOpt = async () => {
    const val = newOpt.trim();
    if (!val) return;
    setNewOpt('');
    if (!q?.questionId) {
      setOptions(prev => [...prev, { optionText: val }]);
    } else {
      const { optionId } = await addQuestionOption(eventId, q.questionId, val);
      setOptions(prev => [...prev, { optionId, optionText: val }]);
    }
  };

  const removeOpt = async (opt) => {
    if (!q?.questionId || !opt.optionId) {
      setOptions(prev => prev.filter(o => o !== opt));
      return;
    }
    await deleteQuestionOption(eventId, q.questionId, opt.optionId);
    setOptions(prev => prev.filter(o => o.optionId !== opt.optionId));
  };

  const del = async () => {
    if (!q?.questionId) return onDeleted?.();
    await deleteQuestion(eventId, q.questionId);
    onDeleted?.();
  };

  return (
    <Box p={4} borderWidth="1px" rounded="lg">
      {edit ? (
        <VStack align="stretch" spacing={3}>
          <HStack>
            <Select value={type} onChange={(e)=>setType(e.target.value)} maxW="260px">
              {ALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Badge
              colorScheme={reqd ? 'red' : 'gray'}
              cursor="pointer"
              onClick={() => setReqd(!reqd)}
            >
              {reqd ? 'Required' : 'Optional'}
            </Badge>
          </HStack>
          {type === 'longText'
            ? <Textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Question text..." />
            : <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Question text..." />
          }
          {!isText && (
            <VStack align="stretch" spacing={2}>
              {options.map((o,i)=>(
                <HStack key={o.optionId || `new-${i}`}>
                  <Input
                    value={o.optionText}
                    onChange={e => {
                      const v = e.target.value;
                      setOptions(prev => prev.map((x,j)=> j===i ? { ...x, optionText:v, _dirty:true } : x));
                    }}
                  />
                  <IconButton aria-label="Remove" onClick={()=>removeOpt(o)} icon={<Trash2 size={16} />} />
                </HStack>
              ))}
              <HStack>
                <Input value={newOpt} onChange={e=>setNewOpt(e.target.value)} placeholder="Add option..." />
                <Button onClick={addOpt}>Add</Button>
              </HStack>
            </VStack>
          )}
          <HStack justify="flex-end">
            {q?.questionId && <Button variant="ghost" colorScheme="red" onClick={del} leftIcon={<Trash2 size={16} />}>Delete</Button>}
            <Button colorScheme="blue" onClick={save} leftIcon={<Save size={16} />}>Save</Button>
          </HStack>
        </VStack>
      ) : (
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <HStack>
              <Badge>{ALL_TYPES.find(t=>t.value===type)?.label || type}</Badge>
              {reqd && <Badge colorScheme="red">Required</Badge>}
            </HStack>
            <IconButton aria-label="Edit" icon={<Edit3 size={16} />} onClick={()=>setEdit(true)} />
          </HStack>
          <Text fontWeight="semibold">{text || <em>(untitled)</em>}</Text>
          {!isText && !!options.length && (
            <VStack align="stretch" spacing={1} pl={1}>
              {options.map((o,i)=><Text key={o.optionId || i}>• {o.optionText}</Text>)}
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}

export default function QuestionList({ eventId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchQuestions(eventId);
      setItems(rows || []);
    } catch (e) {
      toast({ status: 'error', title: 'Failed to load questions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventId]);

  return (
    <Box>
      <HStack mb={3}>
        <Heading size="md">Questions</Heading>
        <Button ml="auto" onClick={() => setItems(prev => [{ questionType:'shortText', isRequired:false, options:[] }, ...prev])}>
          Add Question
        </Button>
      </HStack>

      {loading ? (
        <VStack align="stretch" spacing={3}>
          {Array.from({length:3}).map((_,i)=><Skeleton key={i} h="110px" rounded="lg" />)}
        </VStack>
      ) : (
        <VStack align="stretch" spacing={4}>
          {/* Pinned informational card */}
          <ParticipantInfoRequired />

          {items.map((q, i) => (
            <QuestionCard
              key={q.questionId || `new-${i}`}
              eventId={eventId}
              q={q}
              onSaved={load}
              onDeleted={() => setItems(prev => prev.filter(x => x !== q))}
            />
          ))}
          {!items.length && <Text color="gray.500">No questions yet.</Text>}
        </VStack>
      )}
    </Box>
  );
}
