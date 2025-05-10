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
            <Box 
              className="ProseMirror"
              color={textColor}
              sx={{
                'ul, ol': {
                  padding: '0 1rem',
                  margin: '0.5em 0',
                  'li': {
                    position: 'relative',
                    paddingLeft: '1.5em',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '0.5em',
                      width: '0.5em',
                      height: '0.5em',
                      borderRadius: '50%',
                      backgroundColor: textColor,
                    },
                  },
                },
                'ol': {
                  counterReset: 'list-counter',
                  'li': {
                    counterIncrement: 'list-counter',
                    '&::before': {
                      content: 'counter(list-counter) "."',
                      position: 'absolute',
                      left: 0,
                      width: '1.5em',
                      textAlign: 'right',
                      color: textColor,
                      backgroundColor: 'transparent',
                      borderRadius: 0,
                    },
                  },
                },
                'ul[data-type="taskList"]': {
                  listStyle: 'none',
                  padding: 0,
                  'li': {
                    display: 'flex',
                    alignItems: 'flex-start',
                    '> label': {
                      flex: '0 0 auto',
                      marginRight: '0.5rem',
                      userSelect: 'none',
                    },
                    '> div': {
                      flex: '1 1 auto',
                    },
                  },
                },
                'h1, h2, h3, h4, h5, h6': {
                  lineHeight: '1.1',
                },
                'code': {
                  backgroundColor: useColorModeValue('gray.100', 'gray.700'),
                  borderRadius: '0.25em',
                  padding: '0.25em',
                },
                'pre': {
                  backgroundColor: useColorModeValue('gray.100', 'gray.700'),
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  'code': {
                    backgroundColor: 'transparent',
                    padding: 0,
                  },
                },
                'img': {
                  maxWidth: '100%',
                  height: 'auto',
                },
                'hr': {
                  border: 'none',
                  borderTop: `2px solid ${borderColor}`,
                  margin: '2rem 0',
                },
                'blockquote': {
                  paddingLeft: '1rem',
                  borderLeft: `4px solid ${borderColor}`,
                },
              }}
              dangerouslySetInnerHTML={{ __html: note?.description || 'No content available' }}
            />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NoteViewModal; 