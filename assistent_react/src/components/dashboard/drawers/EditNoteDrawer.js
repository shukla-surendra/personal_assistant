import React, { useState, useEffect } from "react";
import { Flex, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, DrawerFooter } from "@chakra-ui/react";
import { Box, Button, FormControl, Input, MenuButton, Menu, MenuItem, MenuList } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { updateTask, deleteTask } from "../../../slices/tasks";
import TaskDataService from "../../../services/taskservice";
import { Icon } from "@chakra-ui/react";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import {BiCommentDetail} from "react-icons/bi"
import {BsGearFill} from "react-icons/bs"
import FtTextEditor from "../sections/FtTextEditor";
import { Spinner } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Text } from "@chakra-ui/react";
import { Popover, PopoverTrigger, IconButton } from "@chakra-ui/react";
import { HiChevronUpDown } from "react-icons/hi2";

export default function EditNoteDrawer(props) {
  const [isLoading, setIsLoading] = useState(false);
  const { currentTask, setCurrentTask } = props;
  const [size] = useState('xl');
  const initialRef = React.useRef(null);
  let navigate = useNavigate();
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const { isOpen, onOpen, onClose } = props.disclosures;

  const getTask = task_id => {
    setIsLoading(true);
    TaskDataService.get(task_id)
      .then(response => {
        if (response && response.data) {
          setCurrentTask(response.data);
        }
      })
      .catch(e => {
        console.error('Error loading note:', e);
        setMessage("Error loading note");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && currentTask && currentTask.task_id) {
      getTask(currentTask.task_id);
    }
  }, [isOpen, currentTask?.task_id]);

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const updateContent = () => {
    setIsLoading(true);
    setMessage("Saving ...");
    dispatch(updateTask({ task_id: currentTask.task_id, data: currentTask }))
      .unwrap()
      .then(response => {
        setMessage("Saved !");
        setIsLoading(false);
        setTimeout(() => setMessage(""), 1000);
      })
      .catch(e => {
        setMessage("Error in Saving !");
        setIsLoading(false);
        setTimeout(() => setMessage(""), 2000);
      });
  };

  return (
    <Drawer onClose={onClose} isOpen={isOpen} size={size}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" pb={2}>
          <Flex justifyContent="space-between" alignItems="center" pr={10}>
            <Button onClick={onClose} leftIcon={<Icon as={FaArrowLeft} />} variant="ghost" size="sm">
              Back
            </Button>
            <Flex gap={2} alignItems="center">
              <Button leftIcon={<Icon as={BiCommentDetail} />} variant="ghost" size="sm">
                Comments
              </Button>
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost" size="sm">
                  <Icon as={BsGearFill} />
                </MenuButton>
                <MenuList>
                  <MenuItem>Convert to blog</MenuItem>
                  <MenuItem>Download as Pdf</MenuItem>
                  <MenuItem>Share</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
        </DrawerHeader>

        <DrawerBody>
          <Box>
            <FormControl mb={4}>
              <Input
                ref={initialRef}
                placeholder="Title"
                id="title"
                required
                value={currentTask?.title || ''}
                onChange={handleInputChange}
                name="title"
                size="lg"
                fontWeight="bold"
                borderColor="gray.300"
                bg="gray.50"
              />
            </FormControl>
            <FormControl>
              <FtTextEditor currentTask={currentTask} setCurrentTask={setCurrentTask} />
            </FormControl>
          </Box>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" pt={2}>
          <Flex w="100%" justify="space-between" align="center">
            <Box color={isLoading ? "blue.500" : "gray.600"} fontSize="sm">
              {isLoading && (
                <>
                  <Spinner size="sm" mr={2} />
                  {message}
                </>
              )}
              {!isLoading && message}
            </Box>
            <Button
              onClick={updateContent}
              leftIcon={<Icon as={FaSave} />}
              colorScheme="blue"
              isLoading={isLoading}
            >
              Save
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}