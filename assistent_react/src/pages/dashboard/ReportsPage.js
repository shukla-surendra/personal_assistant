import React from 'react';
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
} from '@chakra-ui/react';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import { useDisclosure } from '@chakra-ui/react';

export default function ReportsPage() {
  const menu_open = useDisclosure();
  
  // Move hooks to component level
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');

  const reportCards = [
    {
      title: 'Task Completion',
      description: 'Track your task completion rates and productivity trends',
      icon: FiBarChart2,
      color: 'blue.500',
    },
    {
      title: 'Time Distribution',
      description: 'Analyze how you spend your time across different activities',
      icon: FiPieChart,
      color: 'green.500',
    },
    {
      title: 'Performance Trends',
      description: 'Monitor your performance trends over time',
      icon: FiTrendingUp,
      color: 'purple.500',
    },
    {
      title: 'Schedule Analysis',
      description: 'Review your schedule and identify patterns',
      icon: FiCalendar,
      color: 'orange.500',
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
                <Heading size="lg">Reports & Analytics</Heading>
                <Button colorScheme="blue" size="sm">
                  Export Data
                </Button>
              </Flex>

              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)"
                }}
                gap={6}
              >
                {reportCards.map((report, index) => (
                  <Card
                    key={index}
                    bg={cardBg}
                    borderRadius="lg"
                    boxShadow="md"
                  >
                    <CardHeader>
                      <Flex alignItems="center" gap={3}>
                        <Icon
                          as={report.icon}
                          boxSize={6}
                          color={report.color}
                        />
                        <Heading size="md">{report.title}</Heading>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <Text color={textColor}>
                        {report.description}
                      </Text>
                    </CardBody>
                    <CardFooter>
                      <Button
                        variant="ghost"
                        colorScheme="blue"
                        size="sm"
                        width="full"
                      >
                        View Details
                      </Button>
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