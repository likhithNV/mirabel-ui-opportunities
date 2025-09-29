
// Color mapping utilities for view management
export const getViewColor = (index, isGlobal) => {
  const globalColors = ['bg-gray-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
  const myColors = ['bg-purple-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500'];
  const colors = isGlobal ? globalColors : myColors;
  return colors[index % colors.length];
};

export const getColumnCount = (visibleColumns) => {
  if (!visibleColumns) return 0;
  return visibleColumns.split(',').filter(col => col.trim()).length;
};
