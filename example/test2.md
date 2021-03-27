![Android Matryoshka Dolls](undefined)

I think Kotlin delegates are underused; they are the best implementation of the “favor composition over inheritance” refrain.

![A class that is also a list by virtue of it having a reference to one](undefined)

In the above, the 
ListContainer is a 
List that can be iterated through by delegating to the backing 
List within itself. 
Delegates are so much more than that however; fundamentally a 
Delegate allows for a property to have its read and/or write semantics implemented by an arbitrary bit of code. One of the most underutilized, and therefore the least learned from in my opinion, is the 
map() 
Delegate.

![A class whose properties delegate to and therefore mutate the backing map passed to it](undefined)

In the above, read/writes to the 
User instance are delegated to the backing 
map; changes in the fields are reflected in the 
map immediately. Although a neat example, most Android apps don’t have data blobs marshaled in 
maps, they have it in 
[Bundles](https://developer.android.com/reference/android/os/Bundle). A more useful 
Delegate Android wise therefore would be:

![A Delegate for reading/writing from and to an Android Bundle](undefined)

This would let you write the following expressions to let you read/write from a 
Bundle without having to declare extra string constants all over the place, the key is simply the property name:

![](undefined)

The above is nice, but not very flexible as it’s an extension on the 
Bundle type itself. The more interesting usages of 
Bundles in Android tend to be via proxy; 
[Intent](https://developer.android.com/reference/android/content/Intent) extras, 
[Activity](https://developer.android.com/reference/android/app/Activity) deep link params and 
[Fragment](https://developer.android.com/guide/fragments) arguments all internally delegate to a 
Bundle instance. What would be really nice is if we could write a 
Delegate that itself delegated to something else that provides a type we already know how to delegate to; or ***delegation by inception*** as I like to call it:

![A Delegate whose implementation delegates to another Delegate via a mapper transform](undefined)

With the above, we can compose 
Delegates to arbitrarily read and write to any type, provided the type has a reference to another type that has a ready to use 
Delegate. So for 
Intents, 
Activities and 
Fragments we can write:

![Delegates for various Android types that use Bundles to marshal data](undefined)

With this 
Bundles become so much more convenient to work with:

![Examples of Android Delegates that all rely on a Bundle](undefined)

With this, a full User edit flow using the new [FragmentResult API](https://proandroiddev.com/android-fragments-fragment-result-805a6b2522ea) may look something like this:

![Example integration flow of Bundle delegates](undefined)

In the above, the edited user has their name set to “Blake”, wile keeping the existing user’s last name and age. Also in 
UserEditFragment, the user data will survive process death since it is stored in the arguments bundle; all this with no 
bundle.getParcelable(“propertyKey”), or 
fragment.arguments.getParcelable(“userKey”) in sight.

![We need to go deeper](undefined)

Why stop there though? I wrote recently on how 
ViewBinding [makes it really easy to express ](https://proandroiddev.com/android-views-as-a-function-of-state-with-viewbinding-case-study-1-the-live-game-stream-c8367ac13ace)
[Views](https://proandroiddev.com/android-views-as-a-function-of-state-with-viewbinding-case-study-1-the-live-game-stream-c8367ac13ace)[ as a function of their State](https://proandroiddev.com/android-views-as-a-function-of-state-with-viewbinding-case-study-1-the-live-game-stream-c8367ac13ace). In situations like that, it often is very helpful if the 
View could remember the last bit of state it was bound to; typically to memoize animations. Now all Android 
View instances let you save arbitrary bits of data in them via their 
setTag and 
getTag methods with unique integer resource ids. If this is making you start thinking of a 
map like 
Delegate for a 
View that took full advantage of this, you’re in luck:

![A delegate for a View to store arbitrary types via its tags](undefined)

Much like with 
Bundles above, if we have any class that has a reference to a 
View, we can write delegates for it that internally delegate to it:

![Delegates for a View, ViewBinding and even a RecyclerView ViewHolder](undefined)

Again, just like before with 
Intents, 
Activities and 
Fragments; any 
ViewBinding or 
RecyclerView.ViewHolder instance can have any arbitrary property. This is especially useful for:

1. 
- 
RecyclerView.ViewHolder instances, because it means you don’t ever need to subclass it again; just add 
private 
var properties that delegate to the type you want. This is the whole foundation for declarative 
RecyclerViews covered [here](https://proandroiddev.com/declarative-lists-on-android-with-recyclerview-viewbinding-4c1c7ead0e67).
- 
ViewBinding or 
View instances needing a custom animator. In the below, a 
TextView has a custom 
ObjectAnimator tightly coupled with it without needing to subclass it.

![Using a private delegate to strongly couple an ObjectAnimator with a TextView](undefined)

The possibilities are quite endless. JSON deserialization is one of the most common things an app has to do and libraries often use reflection at runtime to help with it. With the right 
Delegate however, you could declare fields in a class and read the value from a common JSON type without the need for reflection.

In summary, Kotlin delegates are one of the best features of the language, and seem to be woefully underused. In your codebase there’s probably some utility function that does a transform that a 
Delegate is better suited for. Why not add replacing it with a custom 
Delegate to your New Year’s resolutions?

All the aforementioned 
Delegates are bundled (pun intended) in the following dependency, and more reading about how Kotlin 
Delegates under the hood can be found [here](https://medium.com/androiddevelopers/delegating-delegates-to-kotlin-ee0a0b21c52b).

[

tunjid/Android-Extensions

# Install 1/2: Add this to pom.xml: Learn more about Maven or Gradle com.tunjid.androidx core 1.3.0-alpha01 Install 2/2…

github.com

](https://github.com/tunjid/Android-Extensions/packages/190263)