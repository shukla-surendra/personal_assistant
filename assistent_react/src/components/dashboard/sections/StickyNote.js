import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { Box, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Stack, useColorModeValue, Text } from "@chakra-ui/react";
import FtQuickNoteEditor from "./FtQuickNoteEditor";
import { ChevronRightIcon } from '@chakra-ui/icons';
import { BiDotsVertical, BiFullscreen } from "react-icons/bi";
import { updateTask, deleteTask } from "../../../slices/tasks";
import { ViewIcon, EditIcon, DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons';

const StickyNote = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Saving..");
  const dispatch = useDispatch();

  const initialQuickNotes = {
    task_id: null,
    title: "",
    description: "",
    priority: "",
    task_type: 'quick_note',
    published: false
  };

  const [quickText, setQuickText] = useState(initialQuickNotes);

  const me = useSelector(state => state.users.me);
  const saveItem = () => {
    console.log("saving-------", quickText)
    setIsLoading(true);
    setMessage("Saving ...");
    dispatch(updateTask({ task_id: quickText.task_id, data: quickText }))
      .unwrap()
      .then(response => {
        console.log(response);
        setMessage("Saved !");
        setIsLoading(false);
      })
      .catch(e => {
        console.log(e);
        setMessage("Error in Saving !");
        setIsLoading(false);
      });
  }

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <Box
      position={isFullScreen ? "fixed" : "relative"}
      top={isFullScreen ? 0 : undefined}
      left={isFullScreen ? 0 : undefined}
      right={isFullScreen ? 0 : undefined}
      bottom={isFullScreen ? 0 : undefined}
      borderRadius="10px"
      backgroundColor="white"
      boxShadow="lg"
      padding={'10px'}
      zIndex={isFullScreen ? "1150" : "auto"}
      overflowY={'scroll'}
      width={isFullScreen ? "100vw" : "100%"}
      height={isFullScreen ? "100vh" : "auto"}
      maxW="100%"
    >
      <Flex justifyContent="space-between" alignItems="center" padding="2">
        <Box color={'#146CA4'} fontSize="16px">
          QUICK NOTE <ChevronRightIcon />
        </Box>
        <Flex justifyContent="flex-end" padding="2">
          <IconButton
            aria-label="Toggle Full Screen"
            icon={<BiFullscreen />}
            onClick={handleToggleFullScreen}
            marginX="1"
          />
        </Flex>
        <Menu>
          <MenuButton as={IconButton} icon={<BiDotsVertical />} />
          <MenuList>
            <MenuItem fontSize="12px" onClick={saveItem}>Save</MenuItem>
            <MenuItem fontSize="12px">Convert To Note</MenuItem>
            <MenuItem fontSize="12px">Clear & Save</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      <FtQuickNoteEditor quickText={quickText} setQuickText={setQuickText} />
    </Box>
  );
};

export default StickyNote;
