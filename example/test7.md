*Parsed from* [URL](https://medium.com/android-frontier/kelm-kotlin-ui-architecture-ea91fb745478)

 You can see [JSON](./test7.json) output

----

![Photograph by Bernard Miranda Lessa OUTSET_CENTER](https://miro.medium.com/1*_GgGa0h4458WDgqNA7Ar-w.jpeg)

### Kelm — Elm Architecture for Kotlin

In the heart of an Android app there are a multitude of async tasks like handling user inputs, network calls and accessing the persistence layer. The problem is that asynchronous tasks increase the complexity of state management by a considerable amount.

Jake Wharton showed one way to solve the state management problem with RxJava in his talk titled [Managing State with RxJava.](https://www.youtube.com/watch?v=0IKHxjkgop4) But there is one issue with this approach: in order to keep the state of the app correct all async tasks must be part of the same RxJava’s stream so that it can all be coordinated properly. This results in an incredible entanglement of complex and composed RxJava’s operators. Some of those operators are hard to master, thus making the code hard to read for devs that haven’t mastered RxJava yet.

“*So, RxJava is bad, now what!?”*. No no no no, RxJava is pretty awesome. The problem here is that managing the state of the app, or the UI, using RxJava’s alone can be a daunting task. Wouldn’t it be much better if we could write most of our UI logic in old, synchronous code? Well, that’s what Kelm tries to do!



### What’s Kelm?

Kelm is an open source Kotlin-only library powered by RxJava that aims to ease the state management of modern Android apps.

Kelm forces a clean separation between executing async tasks from handling their events. Async tasks are handled by RxJava streams, while handling their events is done by a pure synchronous function. This allows you to still **use the power of RxJava, but code most of the UI logic in simple synchronous code.**

### Kelm? Haven’t I heard about it?

Probably. Kelm was heavily inspired by the Elm Architecture. Kelm also follows the Unidirectional Data Flow pattern.

![ OUTSET_LEFT](https://miro.medium.com/1*3BViNj2pD-M1Mkt_wLqUzA@2x.jpeg)

The **Model** in the diagram is the state of the app. The **Update** is where most of an app’s logic is. It’s a pure function that takes the previous **Model** and a **Message** as input and returns a new **Model.**

The red part represents the pure part of the system. It has no side-effects and is completely synchronous, so it’s pretty awesome that this is where most of our code is.

The green part is where the side-effects and async tasks are. The **Update** can return **Commands,** that in turn are mapped to RxJava’s Maybe. These Maybe then return **Messages** that will then be passed to the **Update.** And the cycle is complete.

### Show me some code!

The following is a simple Kelm program that have three buttons on screen: a plus, a minus and a reset. Can you read this code and understand what it does?

```kt
object CounterElement : Kelm.Sandbox<Model, Msg>() {
    data class Model(val count: Int) {
        val resetBtEnabled = count > 0
        val minusBtEnabled = resetBtEnabled
    }

    sealed class Msg {
        object MinusClick : Msg()
        object PlusClick : Msg()
        object ResetClick : Msg()
    }

    fun initModel() = Model(count = 0)

    override fun updateSimple(model: Model, msg: Msg): Model? =
        when (msg) {
            is Msg.MinusClick -> model.copy(count = model.count - 1)
            is Msg.PlusClick -> model.copy(count = model.count + 1)
            is Msg.ResetClick -> model.copy(count = 0)
        }
}
```

In this sample we have the **Model b**eing a simple counter with derivative properties that control the enabled state for the reset and minus buttons. The **messages a**re the user actions.

### Where’s the async stuff? What about side-effects?

Kelm doesn’t allow any async calls nor side effects in its **Update** function. For that Kelm uses the concept of **Commands.** **Commands** are simple tasks that run and return a **Message** in the future. To use **Commands y**ou implement a Kelm **Element.**

This next sample showcases a full implementation of an app that requests random pictures of foxes from a REST API. When the request fails the user is prompted to retry.

```kt
object FoxServiceElement : Kelm.Element<Model, Msg, Cmd, Nothing>() {
    sealed class Model {
        object Loading : Model()
        object ConnError : Model()
        data class ContentLoaded(val foxPicUrl: URL) : Model()
    }

    sealed class Msg {
        object Fetch : Msg()
        data class GotFoxPicUrl(val url: URL) : Msg()
        object ConnError : Msg()
    }

    sealed class Cmd : kelm.Cmd() {
        object Fetch : Cmd()
    }

    fun initModel() = Model.Loading

    override fun initCmds(initModel: Model): List<Cmd>? = listOf(Cmd.Fetch)

    override fun UpdateContext<Model, Msg, Cmd, Nothing>.update(model: Model, msg: Msg): Model? =
        when (model) {
            is Model.Loading ->
                when (msg) {
                    is Msg.GotFoxPicUrl -> Model.ContentLoaded(foxPicUrl = msg.url)
                    is Msg.ConnError -> Model.ConnError
                    else -> null
                }

            is Model.ConnError ->
                when (msg) {
                    is Msg.Fetch -> Model.Loading.also {
                        +Cmd.Fetch
                    }
                    is Msg.GotFoxPicUrl -> Model.ContentLoaded(foxPicUrl = msg.url)
                    else -> null
                }

            is Model.ContentLoaded ->
                when (msg) {
                    is Msg.Fetch -> Model.Loading.also {
                        +Cmd.Fetch
                    }
                    else -> null
                }
        }
}
```

Note how **Messages** are used for both user inputs and responses from the service.

A **Command** is then mapped to an RxJava’s Maybe:

```kt
fun cmdToMaybe(cmd: Cmd): Maybe<Msg> =
    when (cmd) {
        is Cmd.Fetch -> fetchCmd()
    }

fun fetchCmd() =
    service.fetchRandomFoxPicUrl()
        .map(Msg::GotFoxPicUrl)
        .cast(Msg::class.java)
        .onErrorReturn { Msg.ConnError }
        .toMaybe()
```

### That’s cute, but can it handle the real world?

You can check the more advanced sample as it tries to mimic a sequence of screens of a real app. That samples separates each screen in its own **Element w**ith a parent element coordinating them. Note that the “child” elements doesn’t know anything about the parent element. The dependency is one way, thus helping maintain a healthy code.



Also, I have been successfully using the same ideas behind Kelm in production apps for more than 2 years now!

### What about tests? It should be hard because of RxJava, right?

😉 Have you noticed how the **Model,** **Messages a**nd **Commands a**re only data? They can be immutable *data classes.* The **Update f**unction is just a pure, synchronous function that takes data as input and outputs data.

In short, testing with Kelm is extreme easy and powerful. You don’t need to mock anything. You just pass data to the **Update f**unction and check it’s output. That’s it. It’s so easy to test with Kelm that writing tests before UI logic is usually the fastest way to code a new feature. Tests become just a very fast runtime. So when you finish a feature, you get it fully tested for free.

Well, check for yourself: [https://github.com/AllanHasegawa/kelm/blob/master/sample-android/src/test/java/kelm/sample/CounterElementTest.kt](https://github.com/AllanHasegawa/kelm/blob/master/sample-android/src/test/java/kelm/sample/CounterElementTest.kt)

### Oh wow, I love it!

Wait until you see Kelm with *Jetpack Compose* ;)