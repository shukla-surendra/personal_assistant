import React, { useState, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

const TimeBlock = ({ startTime, endTime, description }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const totalMinutes = (endTime - startTime) / 1000 / 60;
  const elapsedMinutes = (currentTime - startTime) / 1000 / 60;
  const progress = Math.min((elapsedMinutes / totalMinutes) * 100, 100);

  const progressBarStyles = {
    height: '4px',
    borderRadius: 'md',
    backgroundColor: 'gray.100',
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: `${progress}%`,
    transition: 'width 1s linear',
  };

  return (
    <Flex alignItems="center" position="relative">
      <Box
        height="40px"
        width="40px"
        borderRadius="50%"
        backgroundColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent="center"
        marginRight="4"
      >
        <Text fontWeight="bold" fontSize="md">
          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Box>
      <Box flexGrow={1} position="relative">
        <Text fontWeight="bold" fontSize="md">
          {description}
        </Text>
        <Text color="gray.500" fontSize="sm">
          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Box bg="blue.500" position="absolute" bottom="0" left="0" style={progressBarStyles} />
      </Box>
    </Flex>
  );
};

export default TimeBlock;
