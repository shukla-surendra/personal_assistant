import {
  Box,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useColorModeValue,
  Heading,
  Button,
  HStack,
  Select,
  VStack,
  useToast
} from '@chakra-ui/react';

import React, { useState, useEffect } from "react";
import { Flex, Text, useDisclosure } from "@chakra-ui/react";
import { FiPlus } from 'react-icons/fi';
import Navbar from "../../components/dashboard/Navbar";
import { Helmet } from 'react-helmet';
import TimeBlockComponent from "../../components/dashboard/TimeBlockComponent";
import Header from "../../components/dashboard/Header";
import TaskDataService from "../../services/taskservice";

export default function TimeBlockPage() {
  const menu_open = useDisclosure();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const toast = useToast();

  const getBlockList = () => {
    TaskDataService.getAllTimeBlocks()
      .then(response => {
        console.log("received Time blocks", response.data);
        if(response.data.length > 0){
          const timeBlockList = response.data.map(block => ({
            id: block.id,
            startTime: new Date(Date.parse(block.start_time)),
            endTime: new Date(Date.parse(block.end_time)),
            description: block.description,
            status: block.status || 'pending'
          }));
          setBlocks(timeBlockList);
        } else {
          // Add sample data if no blocks exist
          const sampleBlocks = [
            {
              id: 1,
              startTime: new Date(new Date().setHours(9, 0, 0)),
              endTime: new Date(new Date().setHours(10, 30, 0)),
              description: 'Morning Meeting',
              status: 'completed'
            },
            {
              id: 2,
              startTime: new Date(new Date().setHours(11, 0, 0)),
              endTime: new Date(new Date().setHours(12, 30, 0)),
              description: 'Project Planning',
              status: 'in-progress'
            },
            {
              id: 3,
              startTime: new Date(new Date().setHours(14, 0, 0)),
              endTime: new Date(new Date().setHours(15, 30, 0)),
              description: 'Client Call',
              status: 'pending'
            }
          ];
          setBlocks(sampleBlocks);
        }
      })
      .catch(e => {
        console.log(e);
        toast({
          title: "Error",
          description: "Failed to fetch time blocks",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  useEffect(() => {
    getBlockList();
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    // Here you would typically fetch data for the selected view mode
  };

  return (
    <>
      <Helmet>
        <title>Time Block</title>
        <meta name="description" content="Manage your time blocks and schedule" />
        <meta name="theme-color" content="#008f68" />
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

          <Box as="main" p={4} minH="25rem" bg={useColorModeValue('auto', 'gray.800')}>
            <VStack spacing={4} align="stretch">
              {/* Header Section */}
              <Flex justifyContent="space-between" alignItems="center" p={4} borderRadius="lg" bg="white" boxShadow="sm">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color="blue.600">Time Blocks</Heading>
                  <Text color="gray.500" fontSize="sm">Manage your daily schedule</Text>
                </VStack>

                <HStack spacing={4}>
                  <Select
                    value={viewMode}
                    onChange={(e) => handleViewModeChange(e.target.value)}
                    size="sm"
                    width="120px"
                  >
                    <option value="day">Day View</option>
                    <option value="week">Week View</option>
                    <option value="month">Month View</option>
                  </Select>
                  
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() => setIsDrawerOpen(true)}
                  >
                    New Block
                  </Button>
                </HStack>
              </Flex>

              {/* Time Blocks Section */}
              <Box borderRadius="lg" p={4} bg="white" boxShadow="sm">
                <TimeBlockComponent
                  isDrawerOpen={isDrawerOpen}
                  setIsDrawerOpen={setIsDrawerOpen}
                  blocks={blocks}
                  setBlocks={setBlocks}
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                />
              </Box>
            </VStack>
          </Box>
        </Box>
      </Box>
    </>
  );
}
