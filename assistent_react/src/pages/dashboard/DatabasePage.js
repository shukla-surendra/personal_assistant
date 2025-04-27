import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useDisclosure,
  VStack,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Badge,
  Divider,
  Avatar,
  AvatarGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  useToast,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  useBreakpointValue,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spacer
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiDatabase, 
  FiPlus, 
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiFilter,
  FiChevronRight,
  FiHome
} from 'react-icons/fi';
import { Helmet } from 'react-helmet';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';

export default function DatabasePage() {
  const menu_open = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Sample database tables - replace with actual data from your backend
  const tables = [
    {
      id: 1,
      name: 'Users',
      description: 'User information and authentication data',
      records: 156,
      lastUpdated: '2 hours ago',
      size: '2.5 MB',
      growth: 12
    },
    {
      id: 2,
      name: 'Tasks',
      description: 'Task management and tracking',
      records: 892,
      lastUpdated: '1 hour ago',
      size: '4.2 MB',
      growth: 8
    },
    {
      id: 3,
      name: 'Notes',
      description: 'User notes and documentation',
      records: 345,
      lastUpdated: '3 hours ago',
      size: '1.8 MB',
      growth: 5
    },
    {
      id: 4,
      name: 'Projects',
      description: 'Project management data',
      records: 45,
      lastUpdated: '5 hours ago',
      size: '0.9 MB',
      growth: 3
    }
  ];

  const handleBackup = () => {
    toast({
      title: "Backup Started",
      description: "Database backup process has been initiated",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRestore = () => {
    toast({
      title: "Restore Started",
      description: "Database restore process has been initiated",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <>
      <Helmet>
        <title>Database - Assistant AI</title>
        <meta name="description" content="Database Management" />
      </Helmet>

      <Box as="section" bg={useColorModeValue('gray.50', 'gray.700')} minH="100vh">
        <Navbar display={{ base: 'none', md: 'unset' }} />
        <Drawer isOpen={menu_open.isOpen} onClose={menu_open.onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <Navbar w="full" borderRight="none" />
          </DrawerContent>
        </Drawer>
        <Box ml={{ base: 0, md: 60 }} transition=".3s ease">
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
                <BreadcrumbLink>Database</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            {/* Header Section */}
            <Flex justify="space-between" align="center" mb={6}>
              <Box>
                <Heading size="lg">Database Management</Heading>
                <Text color="gray.500" mt={1}>Manage and monitor your application database</Text>
              </Box>
              <HStack spacing={4}>
                <Tooltip label="Create database backup">
                  <Button leftIcon={<FiDownload />} onClick={handleBackup} colorScheme="blue" variant="outline">
                    Backup
                  </Button>
                </Tooltip>
                <Tooltip label="Restore from backup">
                  <Button leftIcon={<FiUpload />} onClick={handleRestore} colorScheme="blue" variant="outline">
                    Restore
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>

            {/* Search and Filter Section */}
            <Flex mb={6} gap={4} direction={{ base: 'column', md: 'row' }}>
              <InputGroup flex="1">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search tables..." 
                  bg={useColorModeValue('white', 'gray.700')}
                  borderColor={borderColor}
                />
              </InputGroup>
              <HStack spacing={4}>
                <Select
                  placeholder="Filter by"
                  w="200px"
                  bg={useColorModeValue('white', 'gray.700')}
                  borderColor={borderColor}
                >
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                  <option value="records">Records</option>
                </Select>
                <Tooltip label="Refresh database stats">
                  <IconButton
                    icon={<FiRefreshCw />}
                    aria-label="Refresh"
                    colorScheme="blue"
                    variant="ghost"
                  />
                </Tooltip>
              </HStack>
            </Flex>

            {/* Database Stats */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Tables</StatLabel>
                    <StatNumber>{tables.length}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      23.36%
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Records</StatLabel>
                    <StatNumber>{tables.reduce((sum, table) => sum + table.records, 0)}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      12.5%
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Size</StatLabel>
                    <StatNumber>
                      {tables.reduce((sum, table) => {
                        const size = parseFloat(table.size);
                        return sum + size;
                      }, 0).toFixed(1)} MB
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      8.2%
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Database Tables */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Database Tables</Heading>
                  <Tooltip label="Create new database table">
                    <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm">
                      New Table
                    </Button>
                  </Tooltip>
                </Flex>
              </CardHeader>
              <CardBody p={0}>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Table Name</Th>
                        <Th>Description</Th>
                        <Th>Records</Th>
                        <Th>Size</Th>
                        <Th>Growth</Th>
                        <Th>Last Updated</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tables.map((table) => (
                        <Tr key={table.id} _hover={{ bg: hoverBg }}>
                          <Td>
                            <HStack>
                              <Icon as={FiDatabase} color="blue.500" />
                              <Text fontWeight="medium">{table.name}</Text>
                            </HStack>
                          </Td>
                          <Td>{table.description}</Td>
                          <Td>{table.records}</Td>
                          <Td>{table.size}</Td>
                          <Td>
                            <Progress 
                              value={table.growth} 
                              size="sm" 
                              colorScheme="blue"
                              borderRadius="full"
                            />
                          </Td>
                          <Td>{table.lastUpdated}</Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                variant="ghost"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem icon={<FiEdit2 />}>Edit Table</MenuItem>
                                <MenuItem icon={<FiTrash2 />} color="red.500">Delete Table</MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </Container>
        </Box>
      </Box>
    </>
  );
} 