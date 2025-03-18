import type { MDXComponents } from 'mdx/types'

export const components: Readonly<MDXComponents> = {
  h1: (props) => <h2 className="font-mono text-2xl mt-4" {...props} />,
  h2: (props) => (
    <h2
      className="text-2xl first:mt-0 mt-10 mb-8 font-bold uppercase !tracking-normal"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="text-xl mt-8 mb-6 font-bold uppercase !tracking-normal"
      {...props}
    />
  ),
  h4: (props) => <h4 {...props} />,
  h5: (props) => <h5 {...props} />,
  h6: (props) => <h6 {...props} />,
  p: (props) => <p {...props} />,
  a: (props) => <a {...props} />,
  ul: (props) => <ul {...props} />,
  ol: (props) => <ol {...props} />,
  li: (props) => <li {...props} />,
  blockquote: (props) => <blockquote {...props} />,
  code: (props) => <code {...props} />,
  pre: (props) => (
    <pre
      className="rounded-xl text-sm border border-sand-4 py-4 px-4 bg-white dark:bg-black my-6 whitespace-pre-wrap"
      {...props}
    >
      {/* <span>{props.filename}</span> */}
      {props.children}
    </pre>
  ),
}
