export function formatLocalDateTime(datetimeStr) {
    if (!datetimeStr) return ''; // return empty string if datetimeStr is null or undefined
    
    const utcDate = new Date(datetimeStr);
    const options = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    const localDateStr = utcDate.toLocaleString('en-US', options);
    
    return localDateStr;
  }