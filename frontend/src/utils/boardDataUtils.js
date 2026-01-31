// Frontend utility to display seeded board data
// Shows stats and sample tickets from boards

/**
 * Fetch board statistics including ticket counts
 */
export const fetchBoardStats = async (boardId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:4000/api/boards/${boardId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const board = data.data;

    // Calculate stats
    let totalTickets = 0;
    const columnStats = {};

    if (board.columns) {
      board.columns.forEach(column => {
        const ticketCount = column.tickets?.length || 0;
        columnStats[column.title] = ticketCount;
        totalTickets += ticketCount;
      });
    }

    return {
      boardId: board._id,
      boardTitle: board.title,
      totalTickets,
      columnStats,
      columns: board.columns
    };
  } catch (error) {
    console.error('Error fetching board stats:', error);
    return null;
  }
};

/**
 * Fetch all boards with their statistics
 */
export const fetchAllBoardsStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:4000/api/boards', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const boards = data.data || [];

    const stats = [];
    let totalTicketsAcross = 0;

    for (const board of boards) {
      const stat = await fetchBoardStats(board._id);
      if (stat) {
        stats.push(stat);
        totalTicketsAcross += stat.totalTickets;
      }
    }

    return {
      boardCount: boards.length,
      totalTickets: totalTicketsAcross,
      averagePerBoard: Math.round(totalTicketsAcross / boards.length),
      boards: stats
    };
  } catch (error) {
    console.error('Error fetching boards stats:', error);
    return null;
  }
};

/**
 * Get sample tickets from a board
 */
export const getSampleTickets = async (boardId, sampleSize = 5) => {
  try {
    const stats = await fetchBoardStats(boardId);
    if (!stats) return [];

    const samples = [];
    stats.columns?.forEach(column => {
      if (column.tickets && column.tickets.length > 0) {
        const tickets = column.tickets.slice(0, sampleSize);
        samples.push({
          columnTitle: column.title,
          tickets
        });
      }
    });

    return samples;
  } catch (error) {
    console.error('Error getting sample tickets:', error);
    return [];
  }
};

/**
 * Format statistics for display
 */
export const formatBoardStatsDisplay = (stats) => {
  if (!stats) return '';

  let display = `\n📊 Board Statistics\n`;
  display += `=${'='.repeat(50)}\n`;
  display += `Board: ${stats.boardTitle}\n`;
  display += `Total Tickets: ${stats.totalTickets}\n`;
  display += `\nColumn Breakdown:\n`;

  Object.entries(stats.columnStats).forEach(([column, count]) => {
    display += `  • ${column}: ${count} tickets\n`;
  });

  return display;
};

/**
 * Format all boards statistics for display
 */
export const formatAllBoardsStatsDisplay = (stats) => {
  if (!stats) return '';

  let display = `\n📊 All Boards Statistics\n`;
  display += `=${'='.repeat(50)}\n`;
  display += `Total Boards: ${stats.boardCount}\n`;
  display += `Total Tickets: ${stats.totalTickets}\n`;
  display += `Average per Board: ${stats.averagePerBoard}\n\n`;
  display += `Per Board Breakdown:\n`;

  stats.boards.forEach(board => {
    display += `\n  📋 ${board.boardTitle}: ${board.totalTickets} tickets\n`;
    Object.entries(board.columnStats).forEach(([column, count]) => {
      display += `     • ${column}: ${count}\n`;
    });
  });

  return display;
};

/**
 * Log board statistics to console
 */
export const logBoardStats = async (boardId) => {
  const stats = await fetchBoardStats(boardId);
  console.log(formatBoardStatsDisplay(stats));
  return stats;
};

/**
 * Log all boards statistics to console
 */
export const logAllBoardsStats = async () => {
  const stats = await fetchAllBoardsStats();
  console.log(formatAllBoardsStatsDisplay(stats));
  return stats;
};

/**
 * Display sample data from board
 */
export const displaySampleData = async (boardId) => {
  const samples = await getSampleTickets(boardId, 3);

  if (samples.length === 0) {
    console.log('No sample data available');
    return;
  }

  console.log(`\n📋 Sample Tickets from Board\n`);
  samples.forEach(({ columnTitle, tickets }) => {
    console.log(`\n${columnTitle}:`);
    tickets.forEach(ticket => {
      console.log(`  • ${ticket.title} [${ticket.priority}] ${ticket.assignee ? '👤' : '⊘'}`);
    });
  });
};

/**
 * Export board data as JSON
 */
export const exportBoardDataAsJSON = async (boardId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:4000/api/boards/${boardId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return null;

    const data = await response.json();
    return JSON.stringify(data.data, null, 2);
  } catch (error) {
    console.error('Error exporting board data:', error);
    return null;
  }
};

/**
 * Get ticket statistics (counts by priority, status, etc.)
 */
export const getTicketStats = async (boardId) => {
  try {
    const stats = await fetchBoardStats(boardId);
    if (!stats) return null;

    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    const statusCounts = {};
    const assignedCount = { assigned: 0, unassigned: 0 };

    stats.columns?.forEach(column => {
      column.tickets?.forEach(ticket => {
        // Count by priority
        if (ticket.priority) {
          priorityCounts[ticket.priority] = (priorityCounts[ticket.priority] || 0) + 1;
        }

        // Count by status (column)
        statusCounts[column.title] = (statusCounts[column.title] || 0) + 1;

        // Count by assignment
        if (ticket.assignee) {
          assignedCount.assigned += 1;
        } else {
          assignedCount.unassigned += 1;
        }
      });
    });

    return {
      byPriority: priorityCounts,
      byStatus: statusCounts,
      byAssignment: assignedCount
    };
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    return null;
  }
};
