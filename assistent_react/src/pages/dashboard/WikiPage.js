import React, { useState } from 'react';
import {
  Box,
  Flex,
  Grid,
  Text,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Icon,
  Button,
  Stack,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  AvatarGroup,
  Badge,
} from '@chakra-ui/react';
import { FiSearch, FiBook, FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import { useDisclosure } from '@chakra-ui/react';

export default function WikiPage() {
  const menu_open = useDisclosure();
  const [articles, setArticles] = useState([]);
  
  // Move hooks to component level
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('white', 'gray.700');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');

  const wikiSections = [
    {
      title: 'Getting Started',
      description: 'Learn the basics and get up to speed quickly',
      icon: FiBook,
      color: 'blue.500',
      articleCount: 5,
      lastUpdated: '2 days ago',
      contributors: 3,
    },
    {
      title: 'Features Guide',
      description: 'Detailed documentation of all features',
      icon: FiBook,
      color: 'green.500',
      articleCount: 12,
      lastUpdated: '1 week ago',
      contributors: 5,
    },
    {
      title: 'Team Collaboration',
      description: 'Best practices for team collaboration',
      icon: FiBook,
      color: 'purple.500',
      articleCount: 8,
      lastUpdated: '3 days ago',
      contributors: 4,
    },
    {
      title: 'Best Practices',
      description: 'Guidelines and recommendations',
      icon: FiBook,
      color: 'orange.500',
      articleCount: 6,
      lastUpdated: '1 day ago',
      contributors: 2,
    },
  ];

  return (
    <>
      <Box minH="100vh" bg={pageBg}>
        <Navbar />
        <Box
          ml={{ base: 0, md: 60 }}
          transition=".3s ease"
          p={{ base: 4, md: 6, lg: 8 }}
        >
          <Header menu_open={menu_open} />
          <Box
            as="main"
            p={{ base: 4, md: 6 }}
            minH="calc(100vh - 4rem)"
            bg={mainBg}
            borderRadius="lg"
            boxShadow="sm"
          >
            <Stack spacing={6}>
              <Flex
                justifyContent="space-between"
                alignItems="center"
                mb={6}
              >
                <Heading size="lg">Wiki & Documentation</Heading>
                <Button colorScheme="blue" size="sm">
                  New Article
                </Button>
              </Flex>

              <InputGroup maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search articles..."
                  bg={inputBg}
                />
              </InputGroup>

              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(2, 1fr)"
                }}
                gap={6}
              >
                {wikiSections.map((section, index) => (
                  <Card
                    key={index}
                    bg={cardBg}
                    borderRadius="lg"
                    boxShadow="md"
                  >
                    <CardHeader>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Flex alignItems="center" gap={3}>
                          <Icon
                            as={section.icon}
                            boxSize={6}
                            color={section.color}
                          />
                          <Heading size="md">{section.title}</Heading>
                        </Flex>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem icon={<FiEdit2 />}>Edit Section</MenuItem>
                            <MenuItem icon={<FiTrash2 />}>Delete Section</MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <Text color={textColor} mb={4}>
                        {section.description}
                      </Text>
                      <Flex alignItems="center" gap={4}>
                        <Badge colorScheme="blue">
                          {section.articleCount} articles
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          Updated {section.lastUpdated}
                        </Text>
                      </Flex>
                    </CardBody>
                    <CardFooter>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        width="full"
                      >
                        <AvatarGroup size="sm" max={3}>
                          {[...Array(section.contributors)].map((_, i) => (
                            <Avatar
                              key={i}
                              name={`Contributor ${i + 1}`}
                              src={`https://bit.ly/${i + 1}`}
                            />
                          ))}
                        </AvatarGroup>
                        <Button
                          variant="ghost"
                          colorScheme="blue"
                          size="sm"
                        >
                          View All Articles
                        </Button>
                      </Flex>
                    </CardFooter>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </Box>
        </Box>
      </Box>
    </>
  );
} 