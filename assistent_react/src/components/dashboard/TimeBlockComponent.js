import React, { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Flex,
  VStack,
  HStack,
  Badge,
  Text,
  useToast,
  Icon,
  Tooltip,
  IconButton,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid
} from '@chakra-ui/react';
import { useDispatch } from "react-redux";
import TimeBlock from './TimeBlock';
import { createGeneralTask } from '../../slices/tasks';
import { FiEdit2, FiTrash2, FiClock, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const TimeBlockComponent = ({ isDrawerOpen, setIsDrawerOpen, blocks, setBlocks, viewMode, selectedDate }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const [editingBlock, setEditingBlock] = useState(null);

  const [newBlock, setNewBlock] = useState({
    startTime: '',
    endTime: '',
    description: '',
    status: 'pending'
  });

  const handleTimeChange = (type, hours, minutes) => {
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    setNewBlock({
      ...newBlock,
      [type]: date
    });
  };

  const handleDescriptionChange = (event) => {
    setNewBlock({
      ...newBlock,
      description: event.target.value,
    });
  };

  const saveTask = () => {
    const task_to_save = {
      description: newBlock.description,
      start_time: newBlock.startTime.toISOString(),
      end_time: newBlock.endTime.toISOString(),
      task_type: 'time_block',
      status: newBlock.status
    };

    dispatch(createGeneralTask(task_to_save))
      .unwrap()
      .then(() => {
        toast({
          title: "Success",
          description: "Time block created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to create time block",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const handleAddBlock = () => {
    if (!newBlock.startTime || !newBlock.endTime || !newBlock.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newBlock.startTime >= newBlock.endTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    saveTask();
    setBlocks([...blocks, { ...newBlock, id: Date.now() }]);
    setIsDrawerOpen(false);
    setNewBlock({
      startTime: '',
      endTime: '',
      description: '',
      status: 'pending'
    });
  };

  const handleEditBlock = (block) => {
    setEditingBlock(block);
    setNewBlock(block);
    setIsDrawerOpen(true);
  };

  const handleDeleteBlock = (blockId) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
    toast({
      title: "Success",
      description: "Time block deleted successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in-progress':
        return 'blue';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const TimePicker = ({ type, value }) => {
    const hours = value ? value.getHours() : 0;
    const minutes = value ? value.getMinutes() : 0;

    return (
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel>Hours</FormLabel>
          <NumberInput
            value={hours}
            min={0}
            max={23}
            onChange={(_, val) => handleTimeChange(type, val, minutes)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel>Minutes</FormLabel>
          <NumberInput
            value={minutes}
            min={0}
            max={59}
            step={15}
            onChange={(_, val) => handleTimeChange(type, hours, val)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
      </SimpleGrid>
    );
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Time Blocks List */}
      {blocks.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Icon as={FiClock} boxSize={10} color="gray.400" mb={4} />
          <Text color="gray.500">No time blocks scheduled</Text>
          <Text color="gray.400" fontSize="sm">Click "New Block" to add your first time block</Text>
        </Box>
      ) : (
        blocks.map((block) => (
          <Box
            key={block.id}
            p={4}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            position="relative"
            _hover={{ boxShadow: 'md' }}
          >
            <Flex justify="space-between" align="center">
              <TimeBlock
                startTime={block.startTime}
                endTime={block.endTime}
                description={block.description}
              />
              <HStack spacing={2}>
                <Badge colorScheme={getStatusColor(block.status)}>
                  {block.status}
                </Badge>
                <Tooltip label="Edit">
                  <IconButton
                    icon={<FiEdit2 />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditBlock(block)}
                  />
                </Tooltip>
                <Tooltip label="Delete">
                  <IconButton
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteBlock(block.id)}
                  />
                </Tooltip>
              </HStack>
            </Flex>
          </Box>
        ))
      )}

      {/* Add/Edit Time Block Drawer */}
      <Drawer isOpen={isDrawerOpen} placement="right" onClose={() => {
        setIsDrawerOpen(false);
        setEditingBlock(null);
        setNewBlock({
          startTime: '',
          endTime: '',
          description: '',
          status: 'pending'
        });
      }}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{editingBlock ? 'Edit Time Block' : 'New Time Block'}</DrawerHeader>
          <DrawerBody>
            <Stack spacing="24px">
              <FormControl id="startTime">
                <FormLabel>Start Time</FormLabel>
                <TimePicker type="startTime" value={newBlock.startTime} />
              </FormControl>
              <FormControl id="endTime">
                <FormLabel>End Time</FormLabel>
                <TimePicker type="endTime" value={newBlock.endTime} />
              </FormControl>
              <FormControl id="description">
                <FormLabel>Description</FormLabel>
                <Input
                  type="text"
                  value={newBlock.description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter description"
                />
              </FormControl>
              <FormControl id="status">
                <FormLabel>Status</FormLabel>
                <Select
                  value={newBlock.status}
                  onChange={(e) => setNewBlock({ ...newBlock, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormControl>
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={() => {
              setIsDrawerOpen(false);
              setEditingBlock(null);
              setNewBlock({
                startTime: '',
                endTime: '',
                description: '',
                status: 'pending'
              });
            }}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddBlock}>
              {editingBlock ? 'Update' : 'Add'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </VStack>
  );
};

export default TimeBlockComponent;
