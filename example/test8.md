*Parsed from* [URL](https://medium.com/open-graphql/how-to-resolve-import-for-the-graphql-file-with-typescript-and-webpack-7a34c906e4c1)

 You can see [JSON](./test8.json) output

----

### How to resolve import for the .graphql file with typescript and webpack

![ INSET_CENTER](https://miro.medium.com/1*XtbL8cQkqP0pt-fA8MbDiA.png)

Hi, I’m Mohsen ZareZardeyni, and I’m a software engineer at [Sigma Telecom LLC.](https://sigmasoftwares.com/)

At Sigma, for developing our back office application, we decided to use GraphQL, Typescript and Apollo server. We choose Schema first approach and stored our schema in separate `.graphql` files. In order to import our schema within our Typescript code, we ended up using Webpack as our transpiler.

As I was looking for a way to do so, I didn’t find any good tutorial on this matter so I’m providing this tutorial for future researchers!🤠

First, you need to add the following configuration to your `tsconfig.json.` This will tell Typescript to use `src/@types` folder in addition to `node_modules/@types` in order to identify your types.

```json
{
  "compilerOptions": {
    ...
    "typeRoots": ["node_modules/@types", "src/@types"],
  },
  "files": ["src/@types/graphql.d.ts"],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

Then you need to introduce `.graphql` files to Typescript. In order to do this, you need to create a `graphql.d.ts` in your `src/@types` folder. Following code will tell typescript every time it sees an imported file with `.graphql` extention, it will provide a `GraphQL DocumentNode,` which is the type you need to provide for your GraphQL schema.

```d.ts
declare module '*.graphql' {
  import { DocumentNode } from 'graphql'
  const Schema: DocumentNode

  export = Schema
}

```

In our case, we used `apollo-server` from [Apollo Foundation,](null) but any other GraphQL server library uses the same pattern. With pervious steps, the following code will let you to import your `.graphql` files without any typing issue.

```ts
import { ApolloServer } from 'apollo-server'
import { resolvers } from './graphql/resolvers'
import typeDefs from './graphql/Query.graphql'

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
})
```

Finally, the last step is to tell `webpack` how to treat `.graphql` imports. The following code will tell webpack every time it sees a `.graphql` file, it should use `graphql-tag/loader` in order to load the content.

```config.js
module.exports = {
  ...
  module: {
    ...
    rules: [
      ...
      {
        test: /\.graphql$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
    ]
}
```

Hope this helps you:)

Also, you can find me on [linkedin](https://www.linkedin.com/in/mohsen89z/) and [twitter.](https://twitter.com/MohsenZZardeyni)