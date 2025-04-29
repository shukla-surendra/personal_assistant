import React from 'react';
import {
  Box,
  useColorModeValue,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import NotionDashboard from '../../components/dashboard/NotionDashboard';

const NotionPage = () => {
  const menu_open = useDisclosure();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('white', 'gray.800');

  return (
    <>
      <Helmet>
        <title>Notion Dashboard - Assistant AI</title>
        <meta name="description" content="Notion-like Dashboard" />
      </Helmet>

      <Box minH="100vh" bg={pageBg}>
        <Navbar display={{ base: 'none', md: 'unset' }} />
        <Drawer isOpen={menu_open.isOpen} onClose={menu_open.onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <Navbar w="full" borderRight="none" />
          </DrawerContent>
        </Drawer>
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
            <NotionDashboard />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default NotionPage; 