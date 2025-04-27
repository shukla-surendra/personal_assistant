import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Link as ChakraLink,
  useColorModeValue,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiCalendar,
  FiClock,
  FiFileText,
  FiSettings,
  FiUsers,
  FiBarChart2,
  FiDatabase,
  FiTrash2,
  FiPlus,
} from 'react-icons/fi';

const MenuItem = ({ icon, label, to, isActive }) => (
  <ChakraLink
    as={Link}
    to={to}
    w="full"
    _hover={{ textDecoration: 'none' }}
  >
    <HStack
      spacing={3}
      p={3}
      borderRadius="md"
      bg={isActive ? 'blue.50' : 'transparent'}
      color={isActive ? 'blue.600' : 'gray.600'}
      _hover={{ bg: 'blue.50' }}
    >
      <Icon as={icon} />
      <Text>{label}</Text>
    </HStack>
  </ChakraLink>
);

const DashboardMenu = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const menuItems = [
    { icon: FiHome, label: 'Home', to: '/dashboard' },
    { icon: FiCalendar, label: 'Calendar', to: '/dashboard/calendar' },
    { icon: FiClock, label: 'Pomodoro', to: '/dashboard/pomodoro' },
    { icon: FiFileText, label: 'Notion', to: '/dashboard/notion' },
    { icon: FiDatabase, label: 'Databases', to: '/dashboard/databases' },
    { icon: FiUsers, label: 'Team', to: '/dashboard/team' },
    { icon: FiBarChart2, label: 'Analytics', to: '/dashboard/analytics' },
    { icon: FiTrash2, label: 'Trash', to: '/dashboard/trash' },
  ];

  return (
    <Box
      w="250px"
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      position="fixed"
      left={0}
      top={0}
    >
      <VStack h="full" align="stretch" spacing={4} p={4}>
        {/* Logo and User Section */}
        <HStack spacing={4} mb={4}>
          <Avatar size="sm" name="User Name" />
          <Text fontWeight="medium">User Name</Text>
        </HStack>

        {/* Quick Actions */}
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          variant="solid"
          size="sm"
        >
          New Page
        </Button>

        <Divider />

        {/* Main Menu */}
        <VStack spacing={1} align="stretch" flex={1}>
          {menuItems.map((item) => (
            <MenuItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
            />
          ))}
        </VStack>

        <Divider />

        {/* Settings */}
        <MenuItem
          icon={FiSettings}
          label="Settings"
          to="/dashboard/settings"
          isActive={location.pathname === '/dashboard/settings'}
        />
      </VStack>
    </Box>
  );
};

export default DashboardMenu; 