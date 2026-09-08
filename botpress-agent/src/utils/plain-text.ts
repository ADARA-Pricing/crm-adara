/** Remove generated presentation markup, not prices, links or business content. */
export function plainSalesText(text: string): string {
  return text
    .replace(/^[\t ]*```[^\n]*\n/gm, '')
    .replace(/```/g, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1: $2')
    .split(/(https?:\/\/\S+)/g)
    .map(part => /^https?:\/\//.test(part) ? part : part.replace(/`([^`\n]+)`/g, '$1').replace(/\*{1,2}([^*\n]+)\*{1,2}/g, '$1').replace(/[\t ]+([,.;:!?])/g, '$1'))
    .join('')
    .split('\n').map(line => line.trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
}
