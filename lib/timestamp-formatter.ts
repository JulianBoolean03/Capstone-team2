/**
 * Intelligently format a timestamp for display
 * - Same day → "2:45 PM"
 * - Yesterday → "Yesterday"
 * - Within last 7 days → "Monday", "Tuesday", etc.
 * - Older → "Feb 27" or "2/27/26"
 */
export function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    // Get dates at start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if it's today
    if (messageDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Check if it's yesterday
    if (messageDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    // Check if it's within the last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (messageDate.getTime() > sevenDaysAgo.getTime()) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    // Older than 7 days - show short date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
