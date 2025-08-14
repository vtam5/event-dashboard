// src/pages/AdminQuestions.jsx
import { useEffect, useState } from 'react';
import {
  Box, Heading, HStack, Button, Select, Input, Textarea, IconButton,
  VStack, Badge, useToast, Skeleton, Text
} from '@chakra-ui/react';
import { Plus, Trash2, Save, Edit3 } from 'react-feather';
import { useParams, Link as RouterLink } from 'react-router-dom';
import EventTabs from '../components/Admin/EventTabs.jsx';
import {
  fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
  addQuestionOption, updateQuestionOption, deleteQuestionOption,
  fetchEventAdmin
} from '../services/eventService';

const TEXT_TYPES = ['shortText', 'longText'];
const ALL_TYPES = [
  { value: 'shortText', label: 'Short answer' },
  { value: 'longText', label: 'Paragraph' },
  { value: 'singleChoice', label: 'Multiple choice (single)' },
  { value: 'multipleChoice', label: 'Checkboxes (multiple)' },
];

function EditableQuestion({ eventId, q, onSaved, onDeleted }) {
  const toast = useToast();
  const [editing, setEditing] = useState(!q?.questionId);
  const [text, setText] = useState(q?.questionText || '');
  const [type, setType] = useState(q?.questionType || 'shortText');
  const [reqd, setReqd] = useState(Boolean(q?.isRequired));
  const [options, setOptions] = useState(q?.options || []);
  const [newOpt, setNewOpt] = useState('');
  const [saving, setSaving] = useState(false);

  const isText = TEXT_TYPES.includes(type);

  const save = async () => {
    try {
      setSaving(true);
      if (q?.questionId) {
        await updateQuestion(eventId, q.questionId, {
          questionText: text,
          questionType: type,
          isRequired: reqd,
        });
        if (!isText) {
          for (const opt of options) {
            if (opt._dirty && opt.optionId) {
              await updateQuestionOption(eventId, q.questionId, opt.optionId, opt.optionText);
              opt._dirty = false;
            }
          }
        }
        toast({ status: 'success', title: 'Question updated' });
        onSaved?.();
        setEditing(false);
      } else {
        const { questionId } = await createQuestion(eventId, {
          questionText: text,
          questionType: type,
          isRequired: reqd,
        });
        if (!isText && options.length) {
          for (const opt of options) {
            await addQuestionOption(eventId, questionId, opt.optionText);
          }
        }
        toast({ status: 'success', title: 'Question created' });
        onSaved?.();
        setEditing(false);
      }
    } catch (e) {
      toast({
        status: 'error',
        title: 'Save failed',
        description: e?.response?.data?.error || e.message,
      });
    } finally {
      setSaving(false);
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
    <Box p={4} borderWidth="1px" rounded="xl">
      {editing ? (
        <VStack align="stretch" spacing={3}>
          <HStack>
            <Select value={type} onChange={e => setType(e.target.value)} maxW="260px">
              {ALL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            <Badge
              colorScheme={reqd ? 'red' : 'gray'}
              cursor="pointer"
              onClick={() => setReqd(!reqd)}
            >
              {reqd ? 'Required' : 'Optional'}
            </Badge>
          </HStack>

          {type === 'longText' ? (
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Question text..."
            />
          ) : (
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Question text..."
            />
          )}

          {!isText && (
            <Box>
              <Text fontWeight="semibold" mb={2}>Options</Text>
              <VStack align="stretch" spacing={2}>
                {options.map((opt, i) => (
                  <HStack key={opt.optionId || `new-${i}`}>
                    <Input
                      value={opt.optionText}
                      onChange={e => {
                        const v = e.target.value;
                        setOptions(prev =>
                          prev.map((o, j) =>
                            j === i ? { ...o, optionText: v, _dirty: true } : o
                          )
                        );
                      }}
                    />
                    <IconButton
                      aria-label="Remove option"
                      icon={<Trash2 size={16} />}
                      onClick={() => removeOpt(opt)}
                    />
                  </HStack>
                ))}
                <HStack>
                  <Input
                    value={newOpt}
                    onChange={e => setNewOpt(e.target.value)}
                    placeholder="Add option..."
                  />
                  <Button onClick={addOpt} leftIcon={<Plus size={16} />}>Add</Button>
                </HStack>
              </VStack>
            </Box>
          )}

          <HStack justify="space-between" pt={2}>
            <Button
              variant="outline"
              onClick={() => (q?.questionId ? setEditing(false) : onDeleted?.())}
            >
              Cancel
            </Button>
            <HStack>
              {q?.questionId && (
                <Button
                  colorScheme="red"
                  variant="ghost"
                  onClick={del}
                  leftIcon={<Trash2 size={16} />}
                >
                  Delete
                </Button>
              )}
              <Button
                colorScheme="blue"
                onClick={save}
                isLoading={saving}
                leftIcon={<Save size={16} />}
              >
                Save
              </Button>
            </HStack>
          </HStack>
        </VStack>
      ) : (
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <HStack>
              <Badge>{ALL_TYPES.find(t => t.value === type)?.label || type}</Badge>
              {reqd && <Badge colorScheme="red">Required</Badge>}
            </HStack>
            <IconButton
              aria-label="Edit"
              icon={<Edit3 size={16} />}
              onClick={() => setEditing(true)}
            />
          </HStack>
          <Text fontWeight="semibold">{text || <em>(untitled)</em>}</Text>
          {!isText && !!options?.length && (
            <VStack align="stretch" spacing={1} pl={1}>
              {options.map((o, i) => <Text key={o.optionId || i}>• {o.optionText}</Text>)}
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}

export default function AdminQuestions() {
  const { eventId } = useParams();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [qs, ev] = await Promise.all([
        fetchQuestions(eventId),
        fetchEventAdmin(eventId),
      ]);
      setItems(qs || []);
      setEvent(ev || null);
    } catch (e) {
      toast({ status: 'error', title: 'Failed to load', description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventId]);

  const addNew = () =>
    setItems(prev => [{ questionType: 'shortText', isRequired: false, options: [] }, ...prev]);

  return (
    <Box p={6}>
      {/* Tabs header */}
      <EventTabs />

      <HStack mb={4}>
        <Heading size="lg">Questions</Heading>
        <Box flex="1" />
        <Button as={RouterLink} to={`/admin/events/${eventId}/details`} variant="outline">
          Back to Details
        </Button>
        <Button colorScheme="blue" onClick={addNew} leftIcon={<Plus size={16} />}>
          Add question
        </Button>
      </HStack>

      {event && (
        <Box mb={4} p={3} borderWidth="1px" rounded="md">
          <Text fontWeight="semibold">{event.name}</Text>
          <Text fontSize="sm" color="gray.500">Event ID: {eventId}</Text>
        </Box>
      )}

      {loading ? (
        <VStack align="stretch" spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h="110px" rounded="xl" />
          ))}
        </VStack>
      ) : (
        <VStack align="stretch" spacing={4}>
          {items.map((q, idx) => (
            <EditableQuestion
              key={q.questionId || `new-${idx}`}
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
