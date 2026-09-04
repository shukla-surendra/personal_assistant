import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Center,
  Flex,
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  VStack,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FaCog, FaPowerOff, FaUser } from 'react-icons/fa';
import { MdExitToApp } from 'react-icons/md';
import { HiChevronUpDown } from 'react-icons/hi2';
import UserSettings from '../modals/UserSettings';
import UserProfile from '../modals/UserProfile';
import { selectWorkspace, fetchWorkspaces } from '../../../slices/workspaces';

import Auth from "../../../utils/auth";
import Config from "../../../utils/config"

function WorkspaceSelector() {
  const [currentWorkspace, setCurrentWorkspace] = useState(Config.getDefaultWorkspace());
  const workspaces = useSelector(state => state.workspaces.workspaces);
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const disclosures = useDisclosure();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const dispatch = useDispatch();
  const profileDisclosures = useDisclosure();
  const settingsDisclosures = useDisclosure();

  const initFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    dispatch(fetchWorkspaces())
      .unwrap()
      .catch(e => {
        console.error("Workspace fetch error:", e);
        setError("Failed to load workspaces");
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    initFetch();
  }, [initFetch]);

  const logout = (event) => {
    event.preventDefault();
    console.log("logged out")
    Auth.logout()
  }

  const openUserProfile = () => {
    profileDisclosures.onOpen();
  };

  const openUserSettings = () => {
    settingsDisclosures.onOpen();
  };

  const handleWorkspaceSelect = (workspace) => {
    setCurrentWorkspace(workspace);
    setIsPopoverOpen(false);
    Config.setDefaultWorkspace(workspace);
    // Optionally, trigger a soft reload or data refetch here instead of full reload
    // window.location.assign('/');
  };

  return (
    <>
      <UserProfile disclosures={profileDisclosures} user={user} />
      <UserSettings disclosures={settingsDisclosures} user={user} />
      <Box p="2" fontSize="14px">
        <Center>
          <Flex align="center" minW={0}>
            <Text
              fontWeight="bold"
              mr={1}
              maxW="160px"
              isTruncated
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {currentWorkspace.name}
            </Text>
            <Popover
              isOpen={isPopoverOpen}
              onOpen={() => setIsPopoverOpen(true)}
              onClose={() => setIsPopoverOpen(false)}
              placement="bottom"
            >
              <PopoverTrigger>
                <IconButton
                  aria-label="Select workspace"
                  icon={<HiChevronUpDown />}
                  size="sm"
                  variant="ghost"
                  alignSelf="center"
                  mt={0}
                  mb={0}
                  p={0}
                />
              </PopoverTrigger>
              <PopoverContent w="240px">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader mb="1">Workspaces</PopoverHeader>
                <PopoverBody pb="1">
                  {loading && <Spinner />}
                  {error && (
                    <Alert status="error" mb={2}>
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}
                  <VStack align="stretch" spacing="1">
                    {workspaces.map((workspace, index) => (
                      <Box
                        key={index}
                        p="1"
                        cursor="pointer"
                        onClick={() => handleWorkspaceSelect(workspace)}
                        _hover={{ bg: 'gray.100' }}
                        borderRadius="md"
                        bg={workspace.workspace_id === currentWorkspace.workspace_id ? 'gray.200' : 'transparent'}
                      >
                        <Text fontWeight={workspace.workspace_id === currentWorkspace.workspace_id ? 'bold' : 'normal'}>
                          {workspace.name}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                  <Box borderTop="1px solid" borderColor="gray.200" mt="1" pt="1">
                    <HStack align="center" justify="space-between">
                      <HStack spacing="1" cursor="pointer" onClick={openUserProfile}>
                        <FaUser />
                        <Text>Profile</Text>
                      </HStack>
                    </HStack>
                    <HStack align="center" justify="space-between" mt="1">
                      <HStack spacing="1" cursor="pointer" onClick={openUserSettings}>
                        <FaCog />
                        <Text>Settings</Text>
                      </HStack>
                    </HStack>
                    <HStack align="center" justify="space-between" mt="1">
                      <HStack spacing="1" cursor={'pointer'} onClick={logout}>
                        <MdExitToApp />
                        <Text>Logout</Text>
                      </HStack>
                    </HStack>
                  </Box>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Flex>
        </Center>
      </Box>
    </>
  );
}

export default WorkspaceSelector;
