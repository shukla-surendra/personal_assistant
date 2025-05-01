import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Badge,
  Flex,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { formatLocalDateTime } from '../../../utils/locale';

const NoteViewModal = ({ isOpen, onClose, note, onEdit }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');

  const extractTextFromLexicalJSON = (json) => {
    if (!json || !json.root || !json.root.children) return '';
    
    return json.root.children
      .map(child => {
        if (child.type === 'paragraph' && child.children) {
          return child.children.map(text => text.text).join('');
        }
        return '';
      })
      .join('\n');
  };

  const getNoteContent = () => {
    if (!note?.description) return 'No content available';
    
    try {
      const jsonContent = typeof note.description === 'string' 
        ? JSON.parse(note.description) 
        : note.description;
      
      return extractTextFromLexicalJSON(jsonContent);
    } catch (error) {
      console.error('Error parsing description:', error);
      return note.description;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bg}>
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold">{note?.title}</Text>
            <Badge colorScheme="blue">Note</Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box mb={4}>
            <Text fontSize="sm" color="gray.500">
              Created: {formatLocalDateTime(note?.created_at)}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Updated: {formatLocalDateTime(note?.updated_at)}
            </Text>
          </Box>
          <Divider mb={4} />
          <Box>
            <Text color={textColor} whiteSpace="pre-wrap">
              {getNoteContent()}
            </Text>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NoteViewModal; 