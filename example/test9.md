*Parsed from* [URL](https://medium.com/open-graphql/create-a-multiuser-graphql-crud-l-app-in-5-minutes-with-the-amplify-datastore-902764f27404)

 You can see [JSON](./test9.json) output

----

### Create a Multiuser GraphQL CRUD(L) App in 5 minutes with the Amplify DataStore

A little longer than a year ago I wrote about [my experience with the Amplify CLI,](https://medium.com/open-graphql/create-a-multiuser-graphql-crud-l-app-in-10-minutes-with-the-new-aws-amplify-cli-and-in-a-few-73aef3d49545) just released back then, and how it enabled me to create a multiuser GraphQL CRUD(L) application in minutes. It’s probably a good time to revisit the article and update/refactor my old app to use the recently released Amplify DataStore, taking advantage of its simpler programming model and convenient built-in capabilities as well as getting on with the times and adding React Hooks to the mix.

But what’s the Amplify DataStore and how it can make my life as a developer easier? In case you have some spare time, here’s a great video explaining why the DataStore was created and what problems it’s trying to solve:



In case you don’t have spare time now, save the video for later and keep reading.

The mission if you chose to accept it: create a secure multiuser CRUDL app with even less lines of code and in less time than the app I created last year. How can the Amplify DataStore help?

The Amplify DataStore is a queryable, on-device data store for web, browsers, IoT, and mobile developers developing JavaScript, iOS, Android, and React Native apps. It provides a simple programming model for leveraging shared and distributed data without writing additional code for offline and online scenarios, which makes working with distributed, cross-user data just as simple as working with local-only data — allowing developers to create rich app experiences.

You can chose to use the DataStore standalone in your application without an AWS account however, when connected to the cloud, it enables very interesting capabilities. With a simple command you can add powerful built-in scalable real-time, offline, versioning, conflict detection and conflict resolution features powered by AWS AppSync and Amazon DynamoDB while still using a simple local-first programming model. Best of all, you don’t even need to know GraphQL to use it. GraphQL is in place behind the scenes acting as a protocol to interact with a flexible and highly available API automatically synchronizing the data to the cloud.

Same as before, in this article we have sample code that will allow you to get started quickly with a very simple CRUD application behind a managed GraphQL API backend. This is just a sample that should be used for learning purposes, it’s not one size fits all and you’ll need to adapt and change for your specific use cases.

In order to get started we’ll need to install and configure the Amplify CLI, and you can do so by following a quick tutorial [here.](https://aws-amplify.github.io/docs/#node-link) After the CLI is configured with proper AWS credentials, execute the following commands:

```
$ npx create-react-app notesapp --use-npm
$ cd notesapp
$ npm install aws-amplify aws-amplify-react @aws-amplify/core @aws-amplify/datastore bootstrap
$ npx amplify-app
$ amplify init 
```

Since this is a multiuser application, we need to manage users from a central location or Identity Provider and authenticate them accordingly. Let’s update the API we just created to use a Cognito User Pool that will authenticate and authorize users as required:

```
$ amplify update api
```

```
? Please select from one of the below mentioned services: GraphQL
? Choose the default authorization type for the API 
Amazon Cognito User Pool
Using service: Cognito, provided by: awscloudformation
```

```
The current configured provider is Amazon Cognito.
```

```
Do you want to use the default authentication and security configuration? Default configuration
Warning: you will not be able to edit these selections.
How do you want users to be able to sign in? Username
Do you want to configure advanced settings? No, I am done.
```

```
Successfully added auth resource
```

```
? Do you want to configure advanced settings for the GraphQL API 
No, I am done.
```

Edit the schema file `notesapp/amplify/backend/api/amplifyDatasource/schema.graphql `and replace its contents with:

```
type Note @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  note: String
  owner: String
}
```

As before we’re taking advantage of the [GraphQL Transform ](https://aws-amplify.github.io/docs/cli-toolchain/graphql)useful directives such as [`@model `](https://aws-amplify.github.io/docs/cli-toolchain/graphql#model)that will automatically create a DynamoDB table and all the CRUDL logic behind the scenes to store and interact with the data behind an AWS AppSync GraphQL API. We leverage the [`@auth `](https://aws-amplify.github.io/docs/cli-toolchain/graphql#auth)directive and its ability to easily create simple or complex authorization rules. Notice we added an additional field `owner `that was not present in the old app, this is needed to authorize real-time subscriptions in the DataStore.

Now use the following commands to generate the data model then commit the changes and start the deployment of the managed serverless cloud resources (GraphQL API and noSQL table):

```
$ npm run amplify-modelgen
$ npm run amplify-push
```

The backend services and resources will be configured, linked and deployed following all the AWS best practices:

![Services deployed and configured with a “push” INSET_CENTER](https://miro.medium.com/1*0vBzLU_NBjEQSyMcWN381w.png)

Finally, while CloudFormation is doing its job to create and configure the scalable cloud resources, here’s the last piece of the puzzle. Edit the file `src/App.js `in the local project and overwrite the content with the following code:

```js
import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Amplify,{ Hub } from "@aws-amplify/core";
import { DataStore, Predicates } from "@aws-amplify/datastore";
import { Note } from "./models";
import { withAuthenticator } from "aws-amplify-react";
import aws_exports from "./aws-exports"; // specify the location of aws-exports.js file on your project
Amplify.configure(aws_exports);

async function listNotes(setNotes) {
  const notes = await DataStore.query(Note, Predicates.ALL);
  setNotes(notes);
}

function App() {
  const [notes, setNotes] = useState([]);
  const [value, setValue] = useState("");
  const [id, setId] = useState("");
  const [displayAdd, setDisplayAdd] = useState(true);
  const [displayUpdate, setDisplayUpdate] = useState(false);
  const [displaySearch, setDisplaySearch] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    await DataStore.save(
      new Note({
        note: value
      })
    );
    listNotes(setNotes);
    setValue("");
  };

  async function handleSearch(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    setDisplaySearch(true);
    const search = await DataStore.query(Note, c => c.note("contains", value));
    setNotes(search);
    setValue("");
  }

  async function handleDelete(id) {
    const toDelete = await DataStore.query(Note, id);
    await DataStore.delete(toDelete);
  }

  async function handleSelect(note) {
    setValue(note.note);
    setId(note.id);
    setDisplayUpdate(true);
    setDisplayAdd(false);
  }

  async function handleUpdate(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const original = await DataStore.query(Note, id);
    await DataStore.save(
      Note.copyOf(original, updated => {
        updated.note = value;
      })
    );
    listNotes(setNotes);
    setDisplayAdd(true);
    setDisplayUpdate(false);
    setValue("");
  }

  useEffect(() => {
    listNotes(setNotes);

    const listener = (data) => {
      if (data.payload.event === "signOut"){
        DataStore.clear();
      }
    }
    Hub.listen('auth', listener);

    const subscription = DataStore.observe(Note).subscribe(msg => {
      listNotes(setNotes);
    });

    const handleConnectionChange = () => {
      const condition = navigator.onLine ? "online" : "offline";
      console.log(condition);
      if (condition === "online") {
        listNotes(setNotes);
      }
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <header className="jumbotron jumbotron-fluid bg-dark">
        <img src={logo} className="App-logo" alt="logo" style={{ height: "150px" }}/>
      </header>
      <div className="container">
        {displayAdd ? (
          <form>
            <div className="input-group mb-3">
              <input type="text" className="form-control form-control-lg" placeholder="New Note" aria-label="Note" aria-describedby="basic-addon2" value={value} onChange={e => setValue(e.target.value)} />
              <div className="input-group-append">
                <button className="btn btn-warning border border-light text-white font-weight-bold" type="button" onClick={e => { handleSubmit(e); }} >
                  Add Note
                </button>
                <button className="btn btn-warning border border-light text-white font-weight-bold" type="button" onClick={e => { handleSearch(e); }} >
                  Search
                </button>
              </div>
            </div>
          </form>
        ) : null}
        {displayUpdate ? (
          <form onSubmit={e => { handleUpdate(e); }} >
            <div className="input-group mb-3">
              <input type="text" className="form-control form-control-lg" placeholder="Update Note" aria-label="Note" aria-describedby="basic-addon2" value={value} onChange={e => setValue(e.target.value)} />
              <div className="input-group-append">
                <button className="btn btn-warning text-white font-weight-bold" type="submit" >
                   Update Note
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </div>
      <div className="container">
        {notes.map((item, i) => {
          return (
            <div className="alert alert-warning alert-dismissible text-dark show" role="alert">
              <span key={item.i} onClick={() => handleSelect(item)}>
                {item.note}
              </span>
              <button key={item.i} type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => { handleDelete(item.id); listNotes(setNotes); }} >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          );
        })}
        {displaySearch ? (
          <button className="button btn-warning float-right text-white font-weight-bold" onClick={() => {setDisplaySearch(false); listNotes(setNotes); }}>
            <span aria-hidden="true">Clear Search</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
```

Time to test! Execute `amplify serve `or `npm start `to test it locally then sign up a couple of users with a valid e-mail (you can use the same e-mail for different users) and mobile number, add some new notes and confirm one user has no access to the notes of the other user:

![DataStore in action INSET_CENTER](https://miro.medium.com/1*Sl9iejb9dax3roR62l-qaA.png)

Users can create, read, update, delete, list and search their own notes in the app interacting with the data directly from the local DataStore. Everything is automatically synchronized with the DynamoDB table in the background. Offline and real-time features are built-in, users can interact with their data when disconnected or automatically get new notes or updates to current notes when connected to different devices.

Locally the data is stored on IndexedDB and can be accessed using the developer tools in the browser. In case on native mobile apps, the data would be stored in SQLite on device. Following a local first programming model, the DataStore is always interacting with local data providing fast performance and a great user experience:

![DataStore locally on IndexedDB INSET_CENTER](https://miro.medium.com/1*YQbVoUWobAdDA7fldYd5qA.png)

It’s not all apples to apples though. The original article used an Elasticsearch cluster to search data, with the DataStore we are using its local querying capabilities. On the other hand, the old app didn’t have any offline or real-time capabilities powered by WebSockets and now this is all integrated in the new app. How about lines of code? The new app has 158 lines of code whereas the old app in its final state had 185 lines of code. Mission accomplished!

The code is available on **[GitHub.](https://github.com/awsed/AppSyncGraphQLNotes)** From the repo you can deploy the whole app with 1-click to the Amplify Console (or directly from [here)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/awsed/AppSyncGraphQLNotes), give it a try.

![DataStore from Amplify Console INSET_CENTER](https://miro.medium.com/1*jhPN_D1UzBBnG-FuoxeHIA.gif)

The Amplify DataStore allows developers to focus on their business logic, which is what will truly differentiate their applications. You can interact with local and cloud data interchangeably with simple intuitive commands such as `DataStore.save() `, `DataStore.query(),` `DataStore.delete(),` `DataStore.clear() `and receive real-time updates with `DataStore.observe().` All the complexities of distributed data conflict resolution, real-time, offline and versioning capabilities are handled for you.

