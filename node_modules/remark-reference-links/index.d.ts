/**
 * Plugin to transform links and images into references and definitions.
 *
 * @type {import('unified').Plugin<void[], Root>}
 */
export default function remarkReferenceLinks():
  | void
  | import('unified').Transformer<import('mdast').Root, import('mdast').Root>
export type Root = import('mdast').Root
export type Definition = import('mdast').Definition
export type ImageReference = import('mdast').ImageReference
export type LinkReference = import('mdast').LinkReference
