import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Card, CardBody, Button, Icon, HStack, VStack,
  useColorModeValue, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, Input, useToast, Spinner, Center,
} from '@chakra-ui/react';
import { FiBook, FiPlus } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import { fetchPages, createPage } from '../../slices/pages';

function NewPageModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: "Page title can't be empty", status: "warning", duration: 2500, isClosable: true });
      return;
    }
    setIsSaving(true);
    dispatch(createPage({ title: title.trim() }))
      .unwrap()
      .then((page) => {
        toast({ title: "Page created", status: "success", duration: 2000, isClosable: true });
        setTitle('');
        onClose();
        navigate(`/wiki/${page.page_id}`);
      })
      .catch(err => toast({ title: "Couldn't create page", description: err, status: "error", duration: 3500, isClosable: true }))
      .finally(() => setIsSaving(false));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Page</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input placeholder="Page title" value={title} onChange={e => setTitle(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="blue" onClick={handleCreate} isLoading={isSaving}>Create</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function WikiPage() {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const newPageModal = useDisclosure();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pages, loading, error } = useSelector(state => state.pages);
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    dispatch(fetchPages());
  }, [dispatch]);

  return (
    <Box minH="100vh" bg={pageBg}>
      <Navbar isCollapsed={isMenuCollapsed} />
      <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }} transition="all 0.3s ease">
        <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
        <Box as="main" p={{ base: 3, md: 4 }} minH="calc(100vh - 4rem)" bg={mainBg} borderRadius="lg" boxShadow="sm">
          <HStack justify="space-between" mb={6}>
            <Heading size="lg">Wiki</Heading>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={newPageModal.onOpen}>
              New Page
            </Button>
          </HStack>

          {loading && <Center py={16}><Spinner /></Center>}
          {error && <Text color="red.500">{error}</Text>}
          {!loading && !error && pages.length === 0 && (
            <Center py={16}>
              <VStack spacing={3}>
                <Icon as={FiBook} boxSize={10} color="gray.400" />
                <Text color="gray.500">No pages yet. Create one to get started.</Text>
              </VStack>
            </Center>
          )}

          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {pages.map(page => (
              <Card
                key={page.page_id}
                bg={cardBg}
                cursor="pointer"
                _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.15s ease"
                onClick={() => navigate(`/wiki/${page.page_id}`)}
              >
                <CardBody>
                  <HStack>
                    <Icon as={FiBook} color="blue.500" />
                    <Heading size="sm" noOfLines={1}>{page.title}</Heading>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      </Box>
      <NewPageModal isOpen={newPageModal.isOpen} onClose={newPageModal.onClose} />
    </Box>
  );
}
