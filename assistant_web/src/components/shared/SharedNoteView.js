import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, VStack, HStack, Tag,
  TagLabel, Spinner, useToast, useColorModeValue, Divider,
  Icon, Button, Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import TaskDataService from '../../services/taskservice';
import { formatLocalDateTime } from '../../utils/locale';
import RichTextEditor from '../dashboard/editor/RichTextEditor';

const SharedNoteView = () => {
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { noteId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await TaskDataService.getPublicNote(noteId);
        if (response && response.data) {
          if (!response.data.public_access) {
            throw new Error('This note is not publicly accessible');
          }
          setNote(response.data);
        } else {
          throw new Error('Note not found');
        }
      } catch (error) {
        console.error('Error fetching shared note:', error);
        setError(error.response?.data?.detail || error.message || 'Failed to load the shared note');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={bgColor}
      >
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={bgColor}
      >
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          maxW="500px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Error Loading Note
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Button
              leftIcon={<FaArrowLeft />}
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Tag colorScheme="green" size="lg">
              <TagLabel>Public Note</TagLabel>
            </Tag>
          </HStack>

          <VStack spacing={4} align="stretch">
            <Heading size="xl" color={textColor}>
              {note.title}
            </Heading>
            <Text fontSize="sm" color={mutedColor}>
              Last updated: {formatLocalDateTime(note.updated_at)}
            </Text>
          </VStack>

          <Divider />

          <Box>
            <RichTextEditor
              value={note.description || ''}
              onChange={() => {}}
              editable={false}
            />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default SharedNoteView; 