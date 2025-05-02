import React from "react";
import {
  Icon,
  useColorModeValue,
  Divider,
  VStack,
  Text,
  Box,
  Flex,
  useColorMode,
  IconButton,
  Tooltip,
  useDisclosure,
  Spacer
} from '@chakra-ui/react';
// Here we have used react-icons package for the icons

import { 
  AiOutlineBook, 
  AiOutlineDatabase,
  AiOutlineTeam
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
  FiGrid,
  FiMenu,
  FiX,
  FiPlus,
  FiList
} from 'react-icons/fi';
import { 
  MdOutlineDashboard,
  MdOutlineSpaceDashboard,
  MdOutlineAnalytics
} from 'react-icons/md';

import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import WorkspaceSelector from "./sections/WorkSpaceSelector";

const Navbar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onToggle: onWorkspaceToggle } = useDisclosure();

  const handleCreateTask = () => {
    navigate('/tasks/new');
  };

  const handleCreateNote = () => {
    navigate('/notes/new');
  };

  return (
    <Box
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      w={isCollapsed ? '60px' : '250px'}
      pos="fixed"
      h="full"
      transition="all 0.3s ease"
      zIndex="sticky"
    >
      <VStack h="full" align="stretch" spacing={0}>
        {/* Header */}
        <Flex
          p={4}
          align="center"
          borderBottom="1px"
          borderColor={borderColor}
          justify="space-between"
          bg={bgColor}
          position="sticky"
          top={0}
          zIndex={1}
        >
          <RouterLink to="/dashboard" style={{ textDecoration: 'none' }}>
            <Flex align="center" gap={2}>
              <Text 
                fontSize={isCollapsed ? "xl" : "lg"} 
                fontWeight="bold" 
                color={useColorModeValue("gray.800", "white")}
              >
                {isCollapsed ? "A" : "Assistant.AI"}
              </Text>
            </Flex>
          </RouterLink>
          <IconButton
            icon={<Icon as={isCollapsed ? FiMenu : FiX} />}
            variant="ghost"
            onClick={onToggle}
            aria-label="Toggle Menu"
            size="sm"
          />
        </Flex>

        {/* Scrollable Content */}
        <Box overflowY="auto" flex={1}>
          {/* Workspace Selector */}
          <Box p={2}>
            <WorkspaceSelector isCollapsed={isCollapsed} />
          </Box>

          <Divider />

          {/* Quick Access */}
          <Box p={2}>
            {!isCollapsed && (
              <Text
                px={4}
                py={2}
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
              >
                Quick Access
              </Text>
            )}
            <NavItem
              icon={FiHome}
              to="/dashboard"
              isActive={location.pathname === '/dashboard'}
              isCollapsed={isCollapsed}
            >
              Dashboard
            </NavItem>
            <NavItem
              icon={FiFileText}
              to="/tasks"
              isActive={location.pathname === '/tasks'}
              isCollapsed={isCollapsed}
            >
              Tasks
            </NavItem>
            <NavItem
              icon={FiBook}
              to="/notes"
              isActive={location.pathname === '/notes'}
              isCollapsed={isCollapsed}
            >
              Notes
            </NavItem>
            <NavItem
              icon={FiCalendar}
              to="/calendar"
              isActive={location.pathname === '/calendar'}
              isCollapsed={isCollapsed}
            >
              Calendar
            </NavItem>
            <NavItem
              icon={FiClock}
              to="/timeblock"
              isActive={location.pathname === '/timeblock'}
              isCollapsed={isCollapsed}
            >
              Time Block
            </NavItem>
            <NavItem
              icon={FiGrid}
              to="/notion"
              isActive={location.pathname === '/notion'}
              isCollapsed={isCollapsed}
            >
              Notion Dashboard
            </NavItem>
            <NavItem
              icon={FiSearch}
              to="/search-tasks"
              isActive={location.pathname === '/search-tasks'}
              isCollapsed={isCollapsed}
            >
              Search Tasks
            </NavItem>
            <NavItem
              icon={FiSearch}
              to="/search-notebooks"
              isActive={location.pathname === '/search-notebooks'}
              isCollapsed={isCollapsed}
            >
              Search Notebooks
            </NavItem>
          </Box>

          <Divider />

          {/* Create New */}
          <Box p={2}>
            {!isCollapsed && (
              <Text
                px={4}
                py={2}
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
              >
                Create New
              </Text>
            )}
            <NavItem
              icon={FiPlus}
              onClick={handleCreateTask}
              isCollapsed={isCollapsed}
            >
              New Task
            </NavItem>
            <NavItem
              icon={FiPlus}
              onClick={handleCreateNote}
              isCollapsed={isCollapsed}
            >
              New Note
            </NavItem>
          </Box>

          <Divider />

          {/* Workspace */}
          <Box p={2}>
            {!isCollapsed && (
              <Text
                px={4}
                py={2}
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
              >
                Workspace
              </Text>
            )}
            <NavItem
              icon={AiOutlineBook}
              to="/wiki"
              isActive={location.pathname === '/wiki'}
              isCollapsed={isCollapsed}
            >
              Wiki
            </NavItem>
            <NavItem
              icon={BsListTask}
              to="/projects"
              isActive={location.pathname === '/projects'}
              isCollapsed={isCollapsed}
            >
              Projects
            </NavItem>
            <NavItem
              icon={AiOutlineDatabase}
              to="/database"
              isActive={location.pathname === '/database'}
              isCollapsed={isCollapsed}
            >
              Database
            </NavItem>
            <NavItem
              icon={AiOutlineTeam}
              to="/team"
              isActive={location.pathname === '/team'}
              isCollapsed={isCollapsed}
            >
              Team
            </NavItem>
          </Box>

          <Divider />

          {/* Analytics */}
          <Box p={2}>
            {!isCollapsed && (
              <Text
                px={4}
                py={2}
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
              >
                Analytics
              </Text>
            )}
            <NavItem
              icon={MdOutlineAnalytics}
              to="/analytics"
              isActive={location.pathname === '/analytics'}
              isCollapsed={isCollapsed}
            >
              Analytics
            </NavItem>
            <NavItem
              icon={MdOutlineSpaceDashboard}
              to="/reports"
              isActive={location.pathname === '/reports'}
              isCollapsed={isCollapsed}
            >
              Reports
            </NavItem>
          </Box>
        </Box>

        {/* Fixed Footer */}
        <Box>
          <Divider />
          {/* Settings */}
          <Box p={2}>
            {!isCollapsed && (
              <Text
                px={4}
                py={2}
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
              >
                Settings
              </Text>
            )}
            <NavItem
              icon={FiSettings}
              to="/settings"
              isActive={location.pathname === '/settings'}
              isCollapsed={isCollapsed}
            >
              Settings
            </NavItem>
            <NavItem
              icon={FiUsers}
              to="/members"
              isActive={location.pathname === '/members'}
              isCollapsed={isCollapsed}
            >
              Members
            </NavItem>
          </Box>

          {/* Theme Toggle */}
          <Box p={2}>
            <Flex align="center" justify="space-between" px={4} py={2}>
              {!isCollapsed && (
                <Text fontSize="sm" color="gray.500">Theme</Text>
              )}
              <IconButton
                aria-label="Toggle theme"
                icon={<Icon as={colorMode === "light" ? FiMoon : FiSun} />}
                onClick={toggleColorMode}
                size="sm"
                variant="ghost"
              />
            </Flex>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

const NavItem = ({ icon, children, isCollapsed, to, isActive, onClick, ...rest }) => {
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.300');
  const color = useColorModeValue('gray.700', 'gray.200');

  return (
    <Tooltip
      label={children}
      placement="right"
      isDisabled={!isCollapsed}
      hasArrow
    >
      <Box
        as={to ? RouterLink : 'div'}
        to={to}
        onClick={onClick}
        style={{ textDecoration: 'none' }}
        _focus={{ boxShadow: 'none' }}
        cursor="pointer"
      >
        <Flex
          align="center"
          p="3"
          mx="2"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          _hover={{
            bg: hoverBg,
          }}
          bg={isActive ? activeBg : 'transparent'}
          color={isActive ? activeColor : color}
          transition="all 0.2s"
          {...rest}
        >
          {icon && (
            <Icon
              mr={isCollapsed ? 0 : 4}
              fontSize="16"
              _groupHover={{
                color: activeColor,
              }}
              as={icon}
            />
          )}
          {!isCollapsed && (
            <Text
              fontSize="sm"
              fontWeight="medium"
              transition="all 0.2s"
              _groupHover={{
                color: activeColor,
              }}
            >
              {children}
            </Text>
          )}
        </Flex>
      </Box>
    </Tooltip>
  );
};

export default Navbar;