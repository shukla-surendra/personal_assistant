export const extractTextFromLexicalJSON = (json) => {
  if (!json || !json.root || !json.root.children) return '';
  
  return json.root.children
    .map(child => {
      if (child.type === 'paragraph' && child.children) {
        return child.children.map(text => text.text).join('');
      }
      return '';
    })
    .join('\n');
}; 