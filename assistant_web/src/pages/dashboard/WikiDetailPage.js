import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, HStack, VStack, Input, Textarea, IconButton, Icon, Text, Checkbox,
  Divider, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Button,
  useColorModeValue, Spinner, Center, useToast,
} from '@chakra-ui/react';
import {
  FiArrowLeft, FiPlus, FiMoreVertical, FiTrash2, FiType, FiAlignLeft, FiList,
  FiCheckSquare, FiCode, FiMinus, FiImage, FiMenu as FiGrip,
} from 'react-icons/fi';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import PageService from '../../services/PageService';
import BlockService from '../../services/BlockService';

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: FiType },
  { type: 'paragraph', label: 'Paragraph', icon: FiAlignLeft },
  { type: 'bullet_list_item', label: 'Bulleted list', icon: FiList },
  { type: 'todo', label: 'To-do', icon: FiCheckSquare },
  { type: 'code', label: 'Code', icon: FiCode },
  { type: 'divider', label: 'Divider', icon: FiMinus },
  { type: 'image', label: 'Image', icon: FiImage },
];

const emptyContentFor = (type) => {
  switch (type) {
    case 'heading': return { text: '', level: 2 };
    case 'todo': return { text: '', checked: false };
    case 'image': return { url: '', caption: '' };
    case 'divider': return {};
    default: return { text: '' };
  }
};

function BlockContent({ block, onChange }) {
  const codeBg = useColorModeValue('gray.100', 'gray.900');
  const content = block.content || {};

  switch (block.type) {
    case 'heading': {
      const sizes = { 1: '2xl', 2: 'xl', 3: 'lg' };
      return (
        <Input
          value={content.text || ''}
          placeholder="Heading"
          variant="unstyled"
          fontWeight="bold"
          fontSize={sizes[content.level] || 'xl'}
          onChange={e => onChange({ ...content, text: e.target.value })}
        />
      );
    }
    case 'paragraph':
      return (
        <Textarea
          value={content.text || ''}
          placeholder="Type something..."
          variant="unstyled"
          resize="vertical"
          onChange={e => onChange({ ...content, text: e.target.value })}
        />
      );
    case 'bullet_list_item':
      return (
        <HStack align="flex-start" w="100%">
          <Text mt={2}>•</Text>
          <Input
            value={content.text || ''}
            placeholder="List item"
            variant="unstyled"
            onChange={e => onChange({ ...content, text: e.target.value })}
          />
        </HStack>
      );
    case 'todo':
      return (
        <HStack w="100%">
          <Checkbox
            isChecked={!!content.checked}
            onChange={e => onChange({ ...content, checked: e.target.checked })}
          />
          <Input
            value={content.text || ''}
            placeholder="To-do"
            variant="unstyled"
            textDecoration={content.checked ? 'line-through' : 'none'}
            color={content.checked ? 'gray.500' : undefined}
            onChange={e => onChange({ ...content, text: e.target.value })}
          />
        </HStack>
      );
    case 'code':
      return (
        <Textarea
          value={content.text || ''}
          placeholder="Code"
          fontFamily="mono"
          fontSize="sm"
          bg={codeBg}
          resize="vertical"
          onChange={e => onChange({ ...content, text: e.target.value })}
        />
      );
    case 'divider':
      return <Divider borderColor="gray.400" />;
    case 'image':
      return (
        <VStack align="stretch" w="100%">
          <Input
            value={content.url || ''}
            placeholder="Image URL"
            size="sm"
            onChange={e => onChange({ ...content, url: e.target.value })}
          />
          {content.url && <Box as="img" src={content.url} maxH="300px" objectFit="contain" alt={content.caption || ''} />}
          <Input
            value={content.caption || ''}
            placeholder="Caption (optional)"
            size="sm"
            variant="flushed"
            onChange={e => onChange({ ...content, caption: e.target.value })}
          />
        </VStack>
      );
    default:
      return <Text color="gray.500">Unsupported block type: {block.type}</Text>;
  }
}

function SortableBlock({ block, onChangeContent, onChangeType, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.block_id });
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <Flex
      ref={setNodeRef}
      style={style}
      align="flex-start"
      role="group"
      py={1}
      px={2}
      borderRadius="md"
      _hover={{ bg: hoverBg }}
    >
      <HStack spacing={0} opacity={0} _groupHover={{ opacity: 1 }} mt={1}>
        <IconButton
          {...attributes}
          {...listeners}
          icon={<FiGrip />}
          size="xs"
          variant="ghost"
          cursor="grab"
          aria-label="Drag to reorder"
        />
        <Menu>
          <MenuButton as={IconButton} icon={<FiMoreVertical />} size="xs" variant="ghost" aria-label="Block options" />
          <MenuList>
            {BLOCK_TYPES.map(bt => (
              <MenuItem key={bt.type} icon={<Icon as={bt.icon} />} onClick={() => onChangeType(bt.type)}>
                Turn into {bt.label}
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem icon={<FiTrash2 />} color="red.500" onClick={onDelete}>Delete</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
      <Box flex={1} pt={1}>
        <BlockContent block={block} onChange={onChangeContent} />
      </Box>
    </Flex>
  );
}

export default function WikiDetailPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [page, setPage] = useState(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([PageService.get(pageId), BlockService.getAll(pageId)])
      .then(([pageRes, blocksRes]) => {
        setPage(pageRes.data);
        setTitle(pageRes.data.title);
        setBlocks(blocksRes.data);
      })
      .catch(() => setError('Failed to load page'))
      .finally(() => setLoading(false));
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  const saveTitle = () => {
    if (!title.trim() || title === page?.title) return;
    PageService.update(pageId, { title: title.trim() }).catch(() => {
      toast({ title: "Couldn't save title", status: 'error', duration: 3000, isClosable: true });
    });
  };

  const persistOrder = (list) => {
    list.forEach((block, index) => {
      if (block.order !== index) {
        BlockService.update(pageId, block.block_id, { order: index }).catch(() => {});
      }
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks((prev) => {
      const oldIndex = prev.findIndex(b => b.block_id === active.id);
      const newIndex = prev.findIndex(b => b.block_id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
      persistOrder(reordered);
      return reordered;
    });
  };

  const insertBlock = (afterIndex, type) => {
    const order = afterIndex + 1;
    BlockService.create(pageId, { type, content: emptyContentFor(type), order })
      .then((res) => {
        setBlocks((prev) => {
          const next = [...prev];
          next.splice(order, 0, res.data);
          const renumbered = next.map((b, i) => ({ ...b, order: i }));
          persistOrder(renumbered);
          return renumbered;
        });
      })
      .catch(() => toast({ title: "Couldn't add block", status: 'error', duration: 3000, isClosable: true }));
  };

  const updateBlockContent = (blockId, content) => {
    setBlocks((prev) => prev.map(b => (b.block_id === blockId ? { ...b, content } : b)));
  };

  const saveBlockContent = (blockId) => {
    const block = blocks.find(b => b.block_id === blockId);
    if (!block) return;
    BlockService.update(pageId, blockId, { content: block.content }).catch(() => {
      toast({ title: "Couldn't save block", status: 'error', duration: 3000, isClosable: true });
    });
  };

  const changeBlockType = (blockId, type) => {
    setBlocks((prev) => prev.map(b => (b.block_id === blockId ? { ...b, type, content: emptyContentFor(type) } : b)));
    BlockService.update(pageId, blockId, { type, content: emptyContentFor(type) }).catch(() => {
      toast({ title: "Couldn't change block type", status: 'error', duration: 3000, isClosable: true });
    });
  };

  const deleteBlock = (blockId) => {
    BlockService.remove(pageId, blockId)
      .then(() => setBlocks((prev) => prev.filter(b => b.block_id !== blockId)))
      .catch(() => toast({ title: "Couldn't delete block", status: 'error', duration: 3000, isClosable: true }));
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={pageBg}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }}>
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Center py={20}><Spinner /></Center>
        </Box>
      </Box>
    );
  }

  if (error || !page) {
    return (
      <Box minH="100vh" bg={pageBg}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }}>
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Center py={20}><Text color="red.500">{error || 'Page not found'}</Text></Center>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg}>
      <Navbar isCollapsed={isMenuCollapsed} />
      <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }} transition="all 0.3s ease">
        <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
        <Box as="main" p={{ base: 3, md: 4 }} minH="calc(100vh - 4rem)" bg={mainBg} borderRadius="lg" boxShadow="sm">
          <Box maxW="720px" mx="auto">
            <IconButton icon={<FiArrowLeft />} variant="ghost" size="sm" aria-label="Back to wiki" onClick={() => navigate('/wiki')} mb={4} />

            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              placeholder="Untitled"
              variant="unstyled"
              fontSize="3xl"
              fontWeight="bold"
              mb={6}
            />

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.block_id)} strategy={verticalListSortingStrategy}>
                <VStack align="stretch" spacing={0}>
                  {blocks.map((block) => (
                    <Box key={block.block_id} onBlur={() => saveBlockContent(block.block_id)}>
                      <SortableBlock
                        block={block}
                        onChangeContent={(content) => updateBlockContent(block.block_id, content)}
                        onChangeType={(type) => changeBlockType(block.block_id, type)}
                        onDelete={() => deleteBlock(block.block_id)}
                      />
                    </Box>
                  ))}
                </VStack>
              </SortableContext>
            </DndContext>

            <Menu>
              <MenuButton as={Button} leftIcon={<FiPlus />} variant="ghost" size="sm" mt={2}>
                Add block
              </MenuButton>
              <MenuList>
                {BLOCK_TYPES.map(bt => (
                  <MenuItem key={bt.type} icon={<Icon as={bt.icon} />} onClick={() => insertBlock(blocks.length - 1, bt.type)}>
                    {bt.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
