import React from 'react';
import { Box, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { BsKanban } from 'react-icons/bs';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import ComingSoon from '../../components/dashboard/ComingSoon';

// Placeholder route -- the backend already has Board/BoardItem models
// (adapters/orm/models/pg_models.py) and a seeded "Sprint Board" fixture,
// but there's no Kanban frontend yet, only TaskBoardViewBox.js (a card
// used inside TaskDetailPage's subtask list, not a real board view). See
// docs/PRODUCT_ROADMAP.md.
export default function BoardsPage() {
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
            icon={BsKanban}
            title="Boards"
            description="A Trello-style Kanban board -- drag tasks between columns, grouped by board instead of the flat Tasks list."
            accentColor="teal.500"
            features={[
              'Drag-and-drop columns (To Do / In Progress / Done)',
              'Multiple boards per workspace',
              'Same underlying Tasks, viewed as cards',
              'Per-board membership and activity',
            ]}
          />
        </Box>
      </Box>
    </Box>
  );
}
