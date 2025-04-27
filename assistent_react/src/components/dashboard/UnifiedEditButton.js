import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Icon,
  Text
} from '@chakra-ui/react';
import { FaEdit } from 'react-icons/fa';

const UnifiedEditButton = ({ item, type, onEdit }) => {
  const handleEdit = () => {
    onEdit(item);
  };

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<Icon as={FaEdit} />}
        variant="ghost"
        size="sm"
        aria-label="Edit"
      />
      <MenuList>
        <MenuItem onClick={handleEdit}>
          <Text>Edit {type === 'note' ? 'Note' : 'Task'}</Text>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default UnifiedEditButton; 