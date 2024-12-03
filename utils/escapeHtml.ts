export default function escapeHtml(unsafe: string): string {
    return unsafe.replace(/[&<"'>]/g, (match: string) => {
      const escape: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return escape[match] || match;
    });
  }