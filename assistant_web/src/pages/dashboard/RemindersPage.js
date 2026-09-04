import React from 'react';
import { Box, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { FiBell } from 'react-icons/fi';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import ComingSoon from '../../components/dashboard/ComingSoon';

// Placeholder route -- the backend already has a Reminder model
// (adapters/orm/models/pg_models.py) seeded via fixtures.py, but there's no
// frontend for it yet. See docs/PRODUCT_ROADMAP.md.
export default function RemindersPage() {
  const menu_open = useDisclosure();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');

  return (
    <Box minH="100vh" bg={pageBg}>
      <Navbar />
      <Box ml={{ base: 0, md: 60 }} transition=".3s ease" p={{ base: 4, md: 6, lg: 8 }}>
        <Header menu_open={menu_open} />
        <Box as="main" p={{ base: 4, md: 6 }} minH="calc(100vh - 4rem)" bg={mainBg} borderRadius="lg" boxShadow="sm">
          <ComingSoon
            icon={FiBell}
            title="Reminders"
            description="Standalone reminders, separate from task due dates -- get nudged about anything, not just what's on your task list."
            accentColor="orange.500"
            features={[
              'One-off and recurring reminders',
              'Snooze and reschedule',
              'Linked to a task, note, or standalone',
              'Notification when due',
            ]}
          />
        </Box>
      </Box>
    </Box>
  );
}
