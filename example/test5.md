*Parsed from* [URL](https://medium.com/@lukasz.marczak314/how-to-search-with-android-jetpack-ea55307e49a9)

 You can see [JSON](./test5.json) output

----

### How to search with Android Jetpack?

![ OUTSET_CENTER](https://miro.medium.com/1*F2pe6U6CoaEYf181yts1lA.jpeg)

Some time ago we learned how to do a search on Android with SearchView. Not only pure UI component which consumes your typos, but more: makes your Activity ***[SEARCHABLE ](https://developer.android.com/guide/topics/search/searchable-config)— e***.g. providing search suggestions, voice search, etc:

[![](https://img.youtube.com/vi/9OWmnYPX1uc/0.jpg)](https://www.youtube.com/watch?v=9OWmnYPX1uc&t=210))

I am not sure you are familiar with searchables, but there’s a lot of ceremonies to do so — we need to touch several XMLs:

- AndroidManifest(add **android.intent.action.SEARCH* **i*ntent-filter* t*o your target Activity*).*

- Create custom *searchable *under res/xml

- edit some res/layout — put some additional properties to SearchView 😀

Apart from that, you still need to dodge some Android gotchas — like **singleTop **flag for your activity, overriding **onNewIntent() a**nd so on... I know implementing search is a pain, but it’s doable 😅

Let’s think about voice search — *some people prefer to talk, rather than write.* What’s more, when the user relies on 3rd party keyboard(and it breaks for some reason), it’s quite convenient having a fallback for searching via voice. We, Android guys are happy to configure voice search to make it possible:

![Just a little mike on the right. Right? INSET_CENTER](https://miro.medium.com/1*jVmog9aNKyRXS5gyoH_6KQ.png)

Well, no exactly…

#### 2018: Single Activity approach

[![](https://img.youtube.com/vi/2k8x8V77CrU/0.jpg)](https://www.youtube.com/watch?v=2k8x8V77CrU))

Android ecosystem evolves, so does the guidelines and design decisions. Searchable fits well for an individual screen — a single activity that is responsible for doing one operation 🔎. This is a bit obsolete now, thus we can already have the single activity with dozens of fragments inside. What will happen if we decide to put into our app more than one search 🔍? In other words — how to deal with many voice search features in single activity architecture? 🔍 🔎

![ INSET_CENTER](https://miro.medium.com/1*q-89TrGa8253fH0vYJ6W4Q.jpeg)

When we click on the microphone icon in SearchView, search by voice is triggered and the result is delivered back via activity’s ***onNewIntent(Intent). H***ow can we distinguish which of the SearchView has triggered this search, and update UI accordingly? If we deal with a single fragment on the screen — this is fine, but what about foldable /multi-window apps /many fragments on the same screen?

![Who called this search 🤔? INSET_CENTER](https://miro.medium.com/1*F9pUS-1ZLxvPCaxfXF6ndQ.png)

#### 1. Naive approach — store information where searched recently

One of the solution is to keep which of the search queried recently. We need to keep that tiny portion of data somewhere. Beware *SharedPreferences,* or databases — we don’t want to use cannon to kill a mosquito. It probably needs to be cleared if your user logs out… We need to make it volatile as much as possible.

#### 2. Better one — onSaveInstanceState()

Keeping information in *onSavedInstanceState *bundle looks promising but wait — it is really needed?

#### 3. Diving into SearchView API 🎉 🎉 🎉

It turns out that we can dodge our problem with little hack regarding SearchView:

![ INSET_CENTER](https://miro.medium.com/1*Zcn9w9X143MY2IVzZhW0vg.jpeg)

As docs say:

![ INSET_CENTER](https://miro.medium.com/1*V0lpC_WlbET8A4Ph4T4z_A.png)

How does it work? It is possible to configure SearchView with search data — we can pass bundle for (external) voice search dialog. When our activity is calling ***onNewIntent t***hereafter with the result, the intent already contains the bundle we passed before. A lot better👌

#### Conclusion

Riddle presented here is available on Github 🐙 😺 **[HERE
](https://github.com/Marchuck/MultipleSearchViews)**I used[ LordsOfTheRings API ](https://the-one-api.herokuapp.com/documentation)for sample content 😁
(searching hobbits 💍 or elves 🏹)

Feel free to comment ✍️, clap 👏 or star the [repo ](https://github.com/Marchuck/MultipleSearchViews)⭐️

See you next time!