import React from "react";
import {
  Icon,
  useColorModeValue,
  Image,
  Divider,
  VStack,
  Text,
  Box,
  Flex,
  Link,
  useColorMode,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
// Here we have used react-icons package for the icons

import { 
  AiOutlineHome, 
  AiOutlineBook, 
  AiOutlineDatabase,
  AiOutlineTeam,
  AiOutlineSetting
} from 'react-icons/ai';
import { 
  BsCalendarCheck, 
  BsKanban,
  BsListTask,
  BsFileEarmarkText,
  BsGraphUp
} from 'react-icons/bs';
import { 
  FiClock, 
  FiWatch, 
  FiFileText, 
  FiCheckSquare,
  FiBook,
  FiDatabase,
  FiUsers,
  FiSettings,
  FiHome,
  FiCalendar,
  FiBarChart2,
  FiSun,
  FiMoon,
  FiSearch,
  FiGrid
} from 'react-icons/fi';
import { 
  MdOutlineDashboard,
  MdOutlineSpaceDashboard,
  MdOutlineAnalytics
} from 'react-icons/md';

import { Link as RouterLink } from 'react-router-dom';
import WorkspaceSelector from "./sections/WorkSpaceSelector";

const Navbar = ({ ...props }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      pb="10"
      overflowX="hidden"
      overflowY="auto"
      bg={useColorModeValue('white', 'gray.800')}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      borderRightWidth="1px"
      w="60"
      {...props}
    >
      <Flex px="4" py="5" align="center">
        <Text fontSize="2xl" ml="2" color="brand.500" fontWeight="semibold">
          Assistant AI
        </Text>
      </Flex>

      <VStack align="stretch" spacing={0} px="2">
        {/* Workspace Selector */}
        <Box px="4" py="2">
          <WorkspaceSelector />
        </Box>

        <Divider my={2} />

        {/* Quick Access */}
        <Text fontSize="xs" fontWeight="bold" color="gray.500" px="4" py="2">
          QUICK ACCESS
        </Text>
        <Flex direction="column" as="nav" fontSize="14px" color="gray.600" aria-label="Main Navigation">
          <NavItem icon={FiHome} to="/dashboard">Dashboard</NavItem>
          <NavItem icon={FiFileText} to="/tasks">Tasks</NavItem>
          <NavItem icon={FiBook} to="/notes">Notes</NavItem>
          <NavItem icon={FiCalendar} to="/calendar">Calendar</NavItem>
          <NavItem icon={FiClock} to="/timeblock">Time Block</NavItem>
          <NavItem icon={FiGrid} to="/notion">Notion Dashboard</NavItem>
          <NavItem icon={FiBarChart2} to="/reports">Reports</NavItem>
          <NavItem icon={FiDatabase} to="/database">Database</NavItem>
          <NavItem icon={FiUsers} to="/team">Team</NavItem>
          <NavItem icon={FiSearch} to="/search-tasks">Search Tasks</NavItem>
          <NavItem icon={FiSearch} to="/search-notebooks">Search Notebooks</NavItem>
        </Flex>

        <Divider my={2} />

        {/* Workspace */}
        <Text fontSize="xs" fontWeight="bold" color="gray.500" px="4" py="2">
          WORKSPACE
        </Text>
        <Flex direction="column" as="nav" fontSize="14px" color="gray.600">
          <NavItem icon={AiOutlineBook} to={'/wiki'}>Wiki</NavItem>
          <NavItem icon={BsListTask} to={'/projects'}>Projects</NavItem>
          <NavItem icon={AiOutlineDatabase} to={'/database'}>Database</NavItem>
          <NavItem icon={AiOutlineTeam} to={'/team'}>Team</NavItem>
        </Flex>

        <Divider my={2} />

        {/* Analytics */}
        <Text fontSize="xs" fontWeight="bold" color="gray.500" px="4" py="2">
          ANALYTICS
        </Text>
        <Flex direction="column" as="nav" fontSize="14px" color="gray.600">
          <NavItem icon={MdOutlineAnalytics} to={'/analytics'}>Analytics</NavItem>
          <NavItem icon={MdOutlineSpaceDashboard} to={'/reports'}>Reports</NavItem>
        </Flex>

        <Divider my={2} />

        {/* Settings */}
        <Text fontSize="xs" fontWeight="bold" color="gray.500" px="4" py="2">
          SETTINGS
        </Text>
        <Flex direction="column" as="nav" fontSize="14px" color="gray.600">
          <NavItem icon={FiSettings} to="/settings">Settings</NavItem>
          <NavItem icon={FiUsers} to={'/members'}>Members</NavItem>
        </Flex>

        <Divider my={2} />

        {/* Theme Toggle */}
        <Flex align="center" justify="space-between" px="4" py="2">
          <Text fontSize="sm" color="gray.500">Theme</Text>
          <IconButton
            aria-label="Toggle theme"
            icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            size="sm"
            variant="ghost"
          />
        </Flex>
      </VStack>
    </Box>
  );
};

const NavItem = ({ icon, children, to, ...rest }) => {
  return (
    <Link
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'cyan.400',
          color: 'white',
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'white',
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

export default Navbar;