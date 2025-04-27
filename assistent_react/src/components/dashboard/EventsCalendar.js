import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const events = [
  {
    title: 'Meeting',
    start: new Date(2023, 3, 15, 10, 0),
    end: new Date(2023, 3, 15, 12, 0),
    allDay: false,
  },
  {
    title: 'Conference',
    start: new Date(2023, 3, 16, 9, 0),
    end: new Date(2023, 3, 16, 17, 0),
    allDay: false,
  },
  {
    title: 'Presentation',
    start: new Date(2023, 3, 18, 14, 0),
    end: new Date(2023, 3, 18, 16, 0),
    allDay: false,
  },
];

const EventsCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSelect = (event) => {
    console.log(event);
  };

  return (
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectEvent={handleSelect}
        onSelectSlot={(slotInfo) => console.log(slotInfo)}
        defaultView="month"
        defaultDate={selectedDate}
        style={{ minHeight: 600, height:'100%', width: '100%' }}
      // views={['month']}
      />
  );
};

export default EventsCalendar;
