import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import { 
  FiUsers, 
  FiPlus, 
  FiMoreVertical,
  FiTrash2,
  FiEdit2,
  FiChevronRight,
  FiHome,
  FiMail,
  FiUser,
  FiX
} from 'react-icons/fi';
import { Helmet } from 'react-helmet';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import MemberService from '../../services/MemberService';
import ConfigService from '../../utils/config';

const MembersPage = () => {
  const menu_open = useDisclosure();
  const addMemberDrawer = useDisclosure();
  const toast = useToast();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'member'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentWorkspace = ConfigService.getDefaultWorkspace();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await MemberService.getMembers(currentWorkspace.workspace_id);
        setMembers(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch members');
        toast({
          title: 'Error',
          description: 'Failed to fetch workspace members',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentWorkspace?.workspace_id) {
      fetchMembers();
    }
  }, [currentWorkspace?.workspace_id, toast]);

  const handleAddMember = async () => {
    try {
      const response = await MemberService.addMember(currentWorkspace.workspace_id, newMember.email);
      setMembers([...members, response.data]);
      setNewMember({ email: '', role: 'member' });
      addMemberDrawer.onClose();
      
      toast({
        title: 'Member added',
        description: `${newMember.email} has been invited to the workspace`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error adding member',
        description: error.response?.data?.detail || 'Failed to add member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await MemberService.removeMember(currentWorkspace.workspace_id, memberId);
      setMembers(members.filter(member => member.user_id !== memberId));
      
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the workspace',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error removing member',
        description: error.response?.data?.detail || 'Failed to remove member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await MemberService.updateMemberRole(currentWorkspace.workspace_id, memberId, newRole);
      setMembers(members.map(member => 
        member.user_id === memberId ? { ...member, role: newRole } : member
      ));
      
      toast({
        title: 'Role updated',
        description: 'Member role has been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating role',
        description: error.response?.data?.detail || 'Failed to update role',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={pageBg}>
        <Navbar />
        <Box
          ml={{ base: 0, md: 60 }}
          transition=".3s ease"
          p={{ base: 4, md: 6, lg: 8 }}
        >
          <Header menu_open={menu_open} />
          <Container maxW="container.xl" py={4}>
            <Text>Loading members...</Text>
          </Container>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg}>
        <Navbar />
        <Box
          ml={{ base: 0, md: 60 }}
          transition=".3s ease"
          p={{ base: 4, md: 6, lg: 8 }}
        >
          <Header menu_open={menu_open} />
          <Container maxW="container.xl" py={4}>
            <Text color="red.500">{error}</Text>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Members - Assistant AI</title>
        <meta name="description" content="Workspace Members Management" />
      </Helmet>

      <Box minH="100vh" bg={pageBg}>
        <Navbar />
        <Box
          ml={{ base: 0, md: 60 }}
          transition=".3s ease"
          p={{ base: 4, md: 6, lg: 8 }}
        >
          <Header menu_open={menu_open} />
          <Container maxW="container.xl" py={4}>
            {/* Breadcrumb Navigation */}
            <Breadcrumb spacing="8px" separator={<FiChevronRight color="gray.500" />} mb={6}>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <HStack>
                    <Icon as={FiHome} />
                    <Text>Dashboard</Text>
                  </HStack>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>Members</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            {/* Header Section */}
            <Flex justify="space-between" align="center" mb={6}>
              <Heading size="lg">Workspace Members</Heading>
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                onClick={addMemberDrawer.onOpen}
              >
                Add Member
              </Button>
            </Flex>

            {/* Members Table */}
            <Box bg={mainBg} borderRadius="lg" boxShadow="sm" p={6}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Member</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {members.map((member) => (
                    <Tr key={member.user_id}>
                      <Td>
                        <HStack>
                          <Avatar size="sm" name={member.name} src={member.avatar} />
                          <Text>{member.name}</Text>
                        </HStack>
                      </Td>
                      <Td>{member.email}</Td>
                      <Td>
                        <Badge colorScheme={member.role === 'admin' ? 'purple' : 'blue'}>
                          {member.role}
                        </Badge>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<Icon as={FiMoreVertical} />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem 
                              icon={<Icon as={FiEdit2} />}
                              onClick={() => {
                                const newRole = member.role === 'admin' ? 'member' : 'admin';
                                handleUpdateRole(member.user_id, newRole);
                              }}
                            >
                              {member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={FiTrash2} />}
                              color="red.500"
                              onClick={() => handleRemoveMember(member.user_id)}
                            >
                              Remove
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Add Member Drawer */}
      <Drawer
        isOpen={addMemberDrawer.isOpen}
        placement="right"
        onClose={addMemberDrawer.onClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Add New Member
          </DrawerHeader>

          <DrawerBody>
            <VStack spacing={4} mt={4}>
              <FormControl>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Role</FormLabel>
                <Menu>
                  <MenuButton as={Button} rightIcon={<Icon as={FiChevronRight} />}>
                    {newMember.role.charAt(0).toUpperCase() + newMember.role.slice(1)}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setNewMember({ ...newMember, role: 'admin' })}>
                      Admin
                    </MenuItem>
                    <MenuItem onClick={() => setNewMember({ ...newMember, role: 'member' })}>
                      Member
                    </MenuItem>
                  </MenuList>
                </Menu>
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={handleAddMember}
                isFullWidth
                mt={4}
              >
                Add Member
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MembersPage; 