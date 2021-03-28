*Parsed from* [URL](https://medium.com/open-graphql/react-hooks-for-graphql-3fa8ebdd6c62)

 You can see [JSON](./test10.json) output

----

### Writing Custom React Hooks for GraphQL

How to create custom React hooks to handle common GraphQL operations.

![ INSET_CENTER](https://miro.medium.com/1*dbOsj7tToXW7wO7fPycrEA.jpeg)

With the recent release of the new React APIs at React Conf 2018 there has been a flurry of discussion & open source libraries created around the new opportunities that hooks have made available to React developers.

When hooks first came out, I had a question:



What I learned was that, at their core, hooks allow developers to do 2 things that either were not possible before without an additional library or that were much more difficult before the new API was created:

0. Use state within a functional React component.

0. Make shared behaviors across different components into a hook, that you previously could not really refactor into shared code.

Because I’ve been working a lot with GraphQL (specifically [AWS AppSync)](https://aws.amazon.com/appsync/), I immediately thought of using hooks to more easily set up GraphQL subscriptions:



After getting subscriptions working, my mind jumped next to “what about queries & mutations?”.

Believe it or not, because I did not fully understand how to work with explicit asynchronous calls with React hooks, the idea of subscriptions was easier for me to immediately grok than mutations & subscriptions.

In this post, I’ll walk you through what I have learned & how to perform GraphQL **queries,** **mutations,** & **subscriptions **using custom React hooks.

### Hooks

The three hooks we’ll be working with are:

#### **[useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect)**

> Docs: The function passed to useEffect will run after the render is committed to the screen. Think of effects as an escape hatch from React’s purely functional world into the imperative world.

The way I’ve thought of `useEffect `is similar to the way I would have thought about `componentDidMount `& `componentDidUpdate `in the past.

#### **[useState](https://reactjs.org/docs/hooks-reference.html#usestate)**

> Docs: Returns a stateful value, and a function to update it.

We will use `useState `to keep up with state in our functional components.

#### **[useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer)**

> Docs: An alternative to [`useState.`](https://reactjs.org/docs/hooks-reference.html#usestate) Accepts a reducer of type `(state, action) => newState,` and returns the current state paired with a `dispatch `method.

`useReducer `works exactly how redux reducers work. We’ll use `useReducer `when we need to maintain state between multiple parts of our hook when necessary.

*If you’re looking to learn more about hooks, the two resources that helped me really understand how they work are the docs [here,](https://reactjs.org/docs/hooks-reference.html) & [Ryan Florence ](null)React Conf talk [here.](https://www.youtube.com/watch?v=wXLf18DsV-I)*

-----

I*’ll be using the [AWS Amplify ](https://aws-amplify.github.io/)GraphQL client with an AWS AppSync API in this example, but if you’d like to follow along using the Apollo client, you can use the client with a similar API by using the following configuration:*

```js
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';

// optional, this configuration is only necessary if you're working with AWS AppSync
const middlewareLink = setContext(() => ({
  headers: {
    'X-Api-Key': 'YOUR_API_KEY'
  }
}));

const httpLink = new HttpLink({
  uri: 'YOUR_URL',
});

const link = middlewareLink.concat(httpLink);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
```

### Queries

> Update: In the future, React Suspense & React-cache will have a first-class method of handling asynchronous data fetching & will provide a possibly better API for queries. I’ve set up a working example [here ](https://github.com/dabit3/react-graphql-suspense)if you’re interested in new & unstable things *😀.*

The first thing we’ll look at how to do is perform a GraphQL query. There are two ways to think about doing this:

0. Query immediately when the component renders

0. Have a button or event that triggers the query

Let’s look at how to do both.

#### Hook to query when the component renders

```js
import React, { useEffect, useState } from 'react'
import { API, graphqlOperation } from 'aws-amplify'

const query = `
  query {
    listTodos {
      items {
        id
        name
        description
      }
    }
  }
`

export default function() {
  const [todos, updateTodos] = useState([])

  useEffect(async() => {
    try {
      const todoData = await API.graphql(graphqlOperation(query))
      updateTodos(todoData.data.listTodos.items)
    } catch (err) {
      console.log('error: ', err)
    }
  }, [])

  return todos
}
```

In this example we’ve created a hook to query from the GraphQL API immediately when the hook is called.

We use the `useState `hook to create some initial state, setting the todos array to an empty array.

When the hook is used, `useEffect `will be triggered, querying the API & updating the todos array. Here, we’re using `useEffect `similarly to how you might have used `componentDidMount `in a class component.

Finally, the hook returns the most up to date version of the todos array.

Now, how would we use this hook? Well, it’s actually pretty easy:

```js
import useQuery from './useQuery'

const MainApp = () => {
  const todos = useQuery()
  return (
    <div>
      <h1>Hello World</h1>
      {
        todos.map((todo, i) => <p key={i}>{todo.name}</p>)
      }
    </div>
  )
}
```

When we call `useQuery,` it returns an array with the most up to date version of our todo list. In the view we then map over the todos array.

#### Manually calling the query

What if we wanted to wait for an event before calling the query? Let’s take a look at how to call the query when a user clicks on a button.

```js
import React, { useState } from 'react'
import { API, graphqlOperation } from 'aws-amplify'

const query = `
  query {
    listTodos {
      items {
        id
        name
        description
      }
    }
  }
`

export default function() {
  const [todos, updateTodos] = useState([])

  async function queryTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(query))
      updateTodos(todoData.data.listTodos.items)
    } catch (err) {
      console.log('error: ', err)
    }
  }

  return [todos, queryTodos]
}
```

In this hook, we have a function called `queryTodos `that we will be using to call the API. The main difference here is that we are no longer using the `useEffect `hook to handle any side effects. When the hook loads, we don’t really do anything other than set some initial state.

In the return we now are returning an array of values vs a single value. The first value is the array of todos, the second value is the function call to trigger the API operation.

Now, when we want to use the hook we can import the two values from the hook:

```js
import useCallQuery from './useCallQuery'

const MainApp = () => {
  const [todos, queryTodos] = useCallQuery()
  return (
    <div>
      <h1>Hello World</h1>
      <button onClick={() => queryTodos()}>Query Todos</button>
      {
        todos.map((todo, i) => <p key={i}>{todo.name}</p>)
      }
    </div>
  )
}
```

### Mutations

Now that we know how to query for data, let’s look at how to create mutations.

Well, there’s actually no hook needed for mutations. They can be created directly from the component:

```js
import { API, graphqlOperation } from 'aws-amplify'

const mutation = `
  mutation create($input: CreateTodoInput!) {
    createTodo(input: $input) {
      name
      description
    }
  }
`

const MainApp = () => {
  async function createTodo(CreateTodoInput) {
    try {
      await API.graphql(graphqlOperation(mutation, {input: CreateTodoInput}))
      console.log('successfully created todo')
    } catch (err) {
      console.log('error creating todo: ', err)
    }
  }

  const input = {
    name: "Todo from React",
    description: "Some description"
  }

  return (
    <div>
      <h1>Hello World</h1>
      {
        todos.map((todo, i) => <p key={i}>{todo.name}</p>)
      }
      <button onClick={() => createTodo(input)}>Create Todo</button>
    </div>
  )
}
```

### Subscriptions

One very cool use case (& one that fits perfectly with the paradigm of hooks) is handling GraphQL subscriptions.

Because subscriptions have been typically created & torn down using lifecycle methods in a class, the new `useEffect `hook from React is the perfect place for subscriptions to be implemented.

For this example, we’ll first query the initial array of todos & store them in the state when they are returned in a `useEffect `hook when the component loads.

We’ll create another `useEffect `hook to create a GraphQL subscription. The subscription will listen for new todos being created. When a new todo is created, the subscription will fire & we’ll update the todos array to add the new todo in the subscription data.

The way that we’re managing state here is different than in the past when we used `useState.` Here, we’re using a reducer by leveraging the `useReducer `hook because we need to share state across multiple effects but only want the subscription to fire when the component loads. In order to achieve this, we’ll manage all of our state in this single reducer that will be used in both `useEffect `hooks.

```js
const initialState = { todoList: [] }

function reducer(state, action) {
  switch (action.type) {
    case "set":
      return { todoList: action.payload }
    case "add":
      return { todoList: [...state.todoList, action.payload] }
  }
}

export function useSubscription() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(async () => {
    const todoData = await API.graphql(graphqlOperation(query))
    dispatch({ type: "set", payload: todoData.data.listTodos.items })
  }, [])

  useEffect(() => {
    const subscriber = API.graphql(graphqlOperation(subscription)).subscribe({
      next: data => {
        const {
          value: {
            data: { onCreateTodo }
          }
        } = data
        dispatch({ type: "add", payload: onCreateTodo })
      }
    });
    return () => subscriber.unsubscribe()
  }, []);

  return state.todoList
}
```

In the above subscription hook, we first fetch the initial array of todos. Once they come back from the API, we update the todos array in the state.

We also set up a subscription to listen for new todos, when they are created we update the todos array in the state.

```js
import { useSubscription } from './useSubscription'

const MainApp = () => {
  const todos = useSubscription()

  return (
    <div>
      <h1>Hello World</h1>
      {
        todos.map((todo, i) => <p key={i}>{todo.name}</p>)
      }
    </div>
  )
}
```

In the main application, we import the todos & map over them in our UI.

> Getting subscriptions to work properly with useReducer took some time for me to figure out. Thanks to [hurabielle marc ](null)for [helping me figure out the solution!](https://github.com/facebook/react/issues/14042#issuecomment-434646741)

### Conclusion

I have not touched on caching or optimistic UI / working with the Apollo store, though I would be really interested to see some examples of hooks that managed caching / optimistic UI.

In our examples of working with hooks we’ve used the AWS Amplify GraphQL client that does not yet support caching, but both the Apollo Client & AWS AppSync JS SDK both do & can be used with a similar API using `client.query,` `client.mutate,` & `client.subscribe `(see docs [here)](https://www.apollographql.com/docs/react/api/apollo-client.html#apollo-client).

> *My Name is [Nader Dabit .](https://twitter.com/dabit3)*

> *I am a Developer Advocate at [AWS Mobile ](https://aws.amazon.com/mobile/)working with projects like [AWS AppSync ](https://aws.amazon.com/appsync/)and [AWS [A](https://github.com/aws/aws-amplify)mplify,](https://github.com/aws/aws-amplify) the author of [React Native in Action,](https://www.manning.com/books/react-native-in-action) & the editor of [React Native Training ](https://medium.com/react-native-training)& [OpenGraphQL.](https://medium.com/open-graphql)*