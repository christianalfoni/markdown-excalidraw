declare module "markdown-contents" {
  function MarkdownContents(markdown: string): {
    tree(): any[];
  };
  export default MarkdownContents;
}
