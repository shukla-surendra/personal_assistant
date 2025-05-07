import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  useColorModeValue,
  Divider,
  Badge,
  Flex,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Stack,
  StackDivider,
} from '@chakra-ui/react';
import { FiArrowLeft, FiEdit2, FiTrash2, FiShare2 } from 'react-icons/fi';
import { Helmet } from 'react-helmet';
import { formatLocalDateTime } from '../../utils/locale';
import { retrieveNotes, updateTask } from '../../slices/tasks';
import EditNoteDrawer from '../../components/dashboard/drawers/EditNoteDrawer';
import DeleteTaskNoteModal from '../../components/dashboard/modals/DeleteTaskNoteModal';
import NoteViewModal from '../../components/dashboard/modals/NoteViewModal';
import TipTapEditor from '../../components/editor/TipTapEditor';

export default function NotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const edit_drawer = useDisclosure();
  const delete_modal = useDisclosure();
  const view_modal = useDisclosure();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');

  useEffect(() => {
    if (id) {
      dispatch(retrieveNotes())
        .unwrap()
        .then((data) => {
          const note = data.find(note => note.task_id === id);
          if (note) {
            setCurrentNote(note);
          } else {
            console.error('Note not found');
            navigate('/notes');
          }
        })
        .catch((error) => {
          console.error('Error fetching notes:', error);
          navigate('/notes');
        });
    }
  }, [dispatch, id, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentNote) return;
    
    setIsSaving(true);
    try {
      await dispatch(updateTask({ 
        task_id: currentNote.task_id, 
        data: currentNote 
      })).unwrap();
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    delete_modal.onOpen();
  };

  const handleView = () => {
    view_modal.onOpen();
  };

  const handleContentChange = (newContent) => {
    if (isEditing) {
      setCurrentNote(prev => ({
        ...prev,
        description: newContent
      }));
    }
  };

  if (!currentNote) {
    return (
      <Box minH="100vh" bg={bgColor} p={4}>
        <Container maxW="container.xl">
          <Text>Loading...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{currentNote.title} - Note</title>
        <meta name="description" content={currentNote.description?.substring(0, 160)} />
      </Helmet>

      <Box minH="100vh" bg={bgColor}>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <HStack spacing={4}>
                <IconButton
                  icon={<FiArrowLeft />}
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                />
                <Heading size="lg">{currentNote.title}</Heading>
              </HStack>
              <HStack spacing={2}>
                {isEditing ? (
                  <Button
                    colorScheme="blue"
                    onClick={handleSave}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    leftIcon={<FiEdit2 />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={handleEdit}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  leftIcon={<FiTrash2 />}
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </HStack>
            </Flex>

            <Divider />

            {/* Content */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Stack spacing={4}>
                  <Flex justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Badge colorScheme="blue">{currentNote.category || 'Uncategorized'}</Badge>
                      {currentNote.tags && currentNote.tags.map((tag, index) => (
                        <Badge key={index} colorScheme="green">{tag}</Badge>
                      ))}
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      Last updated: {formatLocalDateTime(currentNote.updated_at)}
                    </Text>
                  </Flex>
                </Stack>
              </CardHeader>
              <CardBody>
                <Stack divider={<StackDivider />} spacing="4">
                  <Box>
                    <TipTapEditor
                      key={`editor-${isEditing}`}
                      content={currentNote.description || ''}
                      onChange={handleContentChange}
                      editable={isEditing}
                    />
                  </Box>
                </Stack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>

      {/* Modals and Drawers */}
      <EditNoteDrawer
        currentTask={currentNote}
        setCurrentTask={setCurrentNote}
        disclosures={edit_drawer}
      />
      <DeleteTaskNoteModal
        currentTask={currentNote}
        disclosures={delete_modal}
        type="note"
      />
      <NoteViewModal
        isOpen={view_modal.isOpen}
        onClose={view_modal.onClose}
        note={currentNote}
        onEdit={handleEdit}
      />
    </>
  );
} 