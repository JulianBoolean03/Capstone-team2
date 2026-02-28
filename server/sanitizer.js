/**
 * Sanitize and validate message content
 * - Remove HTML tags
 * - Trim whitespace
 * - Ensure max length (2000 chars from schema)
 */
function sanitizeMessageContent(content) {
    if (!content || typeof content !== 'string') {
        return null;
    }

    // Remove HTML tags
    let sanitized = content.replace(/<[^>]*>/g, '');

    // Unescape common HTML entities
    sanitized = sanitized
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Check length
    if (sanitized.length === 0 || sanitized.length > 2000) {
        return null;
    }

    return sanitized;
}

module.exports = { sanitizeMessageContent };
