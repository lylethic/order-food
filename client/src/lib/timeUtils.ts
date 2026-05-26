export const formatToDdMmYyyy = (dateString: string): string => {
  if (!dateString || dateString.startsWith('0001')) return '_'; // Handle null/default dates

  const date = new Date(dateString);

  // Option A: Manual formatting
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};
