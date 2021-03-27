*Parsed from* [URL](https://proandroiddev.com/kotlin-delegation-by-inception-61f8beaae0db)

----

### Kotlin Delegation by Inception

#### Delegating to delegates with a functional twist

![Android Matryoshka Dolls INSET_CENTER](https://miro.medium.com/1*P372On2TSH-rAuBsbWLGSQ.jpeg)

I think Kotlin delegates are underused; they are the best implementation of the “favor composition over inheritance” refrain.

```kt
data class ListContainer(val backing: List<Int>): List<Int> by backing
```

In the above, the `ListContainer `is a `List `that can be iterated through by delegating to the backing `List `within itself. `Delegates `are so much more than that however; fundamentally a `Delegate `allows for a property to have its read and/or write semantics implemented by an arbitrary bit of code. One of the most underutilized, and therefore the least learned from in my opinion, is the `map() ``Delegate.`

```kt
class User(val map: MutableMap<String, Any?>) {
    var name: String by map
    var age: Int by map
}
```

In the above, read/writes to the `User `instance are delegated to the backing `map;` changes in the fields are reflected in the `map `immediately. Although a neat example, most Android apps don’t have data blobs marshaled in `maps,` they have it in [`Bundles.`](https://developer.android.com/reference/android/os/Bundle) A more useful `Delegate `Android wise therefore would be:

```kt
private class BundleDelegate<T>(
    private val default: T? = null
) : ReadWriteProperty<Bundle, T> {
    @Suppress("UNCHECKED_CAST")
    override operator fun getValue(
        thisRef: Bundle,
        property: KProperty<*>
    ): T = when (val value = thisRef.get(property.name)) {
        null -> default
        else -> value
    } as T

    override fun setValue(thisRef: Bundle, property: KProperty<*>, value: T) =
        thisRef.putAll(bundleOf(property.name to value))
}
```

This would let you write the following expressions to let you read/write from a `Bundle `without having to declare extra string constants all over the place, the key is simply the property name:

```kt
var Bundle.booleanProperty by BundleDelegate(true)
var Bundle.numberProperty by BundleDelegate(1)
var Bundle.stringProperty by BundleDelegate("Hi")
var Bundle.parcelableProperty by BundleDelegate<NsdServiceInfo?>()
```

The above is nice, but not very flexible as it’s an extension on the `Bundle `type itself. The more interesting usages of `Bundles `in Android tend to be via proxy; [`Intent `](https://developer.android.com/reference/android/content/Intent)extras, [`Activity `](https://developer.android.com/reference/android/app/Activity)deep link params and [`Fragment `](https://developer.android.com/guide/fragments)arguments all internally delegate to a `Bundle `instance. What would be really nice is if we could write a `Delegate `that itself delegated to something else that provides a type we already know how to delegate to; or ***delegation by inception ***as I like to call it:

```kt
private class MappedDelegate<In, Out, T>(
    private val source: ReadWriteProperty<In, T>,
    private val postWrite: ((Out, In) -> Unit)? = null,
    private val mapper: (Out) -> In
) : ReadWriteProperty<Out, T> {

    override fun getValue(thisRef: Out, property: KProperty<*>): T =
        source.getValue(mapper(thisRef), property)

    override fun setValue(thisRef: Out, property: KProperty<*>, value: T) {
        val mapped = mapper(thisRef)
        source.setValue(mapped, property, value)
        postWrite?.invoke(thisRef, mapped)
    }
}

fun <In, Out, T> ReadWriteProperty<In, T>.map(
    postWrite: ((Out, In) -> Unit)? = null,
    mapper: (Out) -> In
): ReadWriteProperty<Out, T> =
    MappedDelegate(source = this, postWrite = postWrite, mapper = mapper)
```

With the above, we can compose `Delegates `to arbitrarily read and write to any type, provided the type has a reference to another type that has a ready to use `Delegate.` So for `Intents,` `Activities `and `Fragments `we can write:

```kt
fun <T> bundleDelegate(default: T? = null): ReadWriteProperty<Bundle, T> =
    BundleDelegate(default)

fun <T> intentExtras(default: T? = null): ReadWriteProperty<Intent, T> = bundleDelegate(default).map(
    postWrite = Intent::replaceExtras,
    mapper = Intent::ensureExtras
)

fun <T> activityIntent(default: T? = null): ReadWriteProperty<Activity, T> = intentExtras(default).map(
    postWrite = Activity::setIntent,
    mapper = Activity::getIntent
)

fun <T> fragmentArgs(): ReadWriteProperty<Fragment, T> = bundleDelegate<T>().map(
    mapper = Fragment::ensureArgs
)

fun <T> Bundle.asDelegate(default: T? = null): ReadWriteProperty<Any?, T> = bundleDelegate(default).map(
    mapper = { this }
)

private val Intent.ensureExtras get() = extras ?: putExtras(Bundle()).let { extras!! }

private val Fragment.ensureArgs get() = arguments ?: Bundle().also(::setArguments)
```

With this `Bundles `become so much more convenient to work with:

```kt
class MainActivity : AppCompatActivity() {
    ...
    private val deepLinkTab by activityIntent<Int?>(-1)
}

class DoggoFragment : Fragment(R.layout.fragment_image_detail) {
    ...
    private var doggo: Doggo by fragmentArgs()
}

data class UserBlob(val bundle: Bundle) {
    val firstName by bundle.asDelegate<String>()
    val lastName by bundle.asDelegate<String>()
    val age by bundle.asDelegate<Int>()
}
```

With this, a full User edit flow using the new [FragmentResult API ](https://proandroiddev.com/android-fragments-fragment-result-805a6b2522ea)may look something like this:

```kt
@Parcelize
class UserBlob constructor(
    val bundle: Bundle = Bundle(),
    firstName: String? = null,
    lastName: String? = null,
    age: Int? = null
): Parcelable {
    
    var firstName by bundle.asDelegate(firstName)
        private set
    var lastName by bundle.asDelegate(lastName)
        private set
    var age by bundle.asDelegate(age)
        private set

    init {
        // Only necessary bc the default value is only used if no existing value is present.
        firstName?.let(this::firstName::set)
        lastName?.let(this::lastName::set)
        age?.let(this::age::set)
    }
    
    companion object {
        val EDITED = "UserEdited"
    }
}

class UserViewFragment : Fragment() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        parentFragmentManager
            .setFragmentResultListener(UserBlob.EDITED, this) { _, bundle ->
                viewModel.postUser(UserBlob(bundle))
            }
    }
}

class UserEditFragment : Fragment() {
    private var existingUser by fragmentArgs<UserBlob>()

    override fun onResume() {
        super.onResume()
        val newUser = UserBlob(existingUser.bundle, firstName = "Blake")
        parentFragmentManager
            .setFragmentResult(UserBlob.EDITED, newUser.bundle)
    }

    companion object {
        fun newInstance(userBlob: UserBlob) =
            UserEditFragment().apply { this.existingUser = userBlob }
    }
}
```

In the above, the edited user has their name set to “Blake”, wile keeping the existing user’s last name and age. Also in `UserEditFragment,` the user data will survive process death since it is stored in the arguments bundle; all this with no `bundle.getParcelable(“propertyKey”),` or `fragment.arguments.getParcelable(“userKey”) `in sight.

![We need to go deeper INSET_CENTER](https://miro.medium.com/1*07JqqcgDgvCSxIY3FS7w6g.jpeg)

Why stop there though? I wrote recently on how `ViewBinding `[makes it really easy to express `Views `as a function of their State.](https://proandroiddev.com/android-views-as-a-function-of-state-with-viewbinding-case-study-1-the-live-game-stream-c8367ac13ace) In situations like that, it often is very helpful if the `View `could remember the last bit of state it was bound to; typically to memoize animations. Now all Android `View `instances let you save arbitrary bits of data in them via their `setTag `and `getTag `methods with unique integer resource ids. If this is making you start thinking of a `map `like `Delegate `for a `View `that took full advantage of this, you’re in luck:

```kt
private class ViewDelegate< T>(
    private val default: T? = null,
) : ReadWriteProperty<View, T> {
    @Suppress("UNCHECKED_CAST")
    override operator fun getValue(thisRef: View, property: KProperty<*>): T {
        val map = thisRef
            .getOrPutTag<MutableMap<String, Any?>>(R.id.view_delegate_property_map, ::mutableMapOf)
        return (map[property.name] ?: default) as T
    }

    override fun setValue(thisRef: View, property: KProperty<*>, value: T) {
        val map = thisRef
            .getOrPutTag<MutableMap<String, Any?>>(R.id.view_delegate_property_map, ::mutableMapOf)
        map[property.name] = value
    }
}

inline fun <reified T> View.getOrPutTag(@IdRes id: Int, initializer: () -> T) =
        getTag(id) as? T ?: initializer().also { setTag(id, it) }
```

Much like with `Bundles `above, if we have any class that has a reference to a `View,` we can write delegates for it that internally delegate to it:

```kt
fun <T> viewDelegate(default: T? = null): ReadWriteProperty<View, T> =
    ViewDelegate(default)

fun <T> viewBindingDelegate(default: T? = null): ReadWriteProperty<ViewBinding, T> =
    viewDelegate(default).map(mapper = ViewBinding::getRoot)

fun <T> viewHolderDelegate(default: T? = null): ReadWriteProperty<RecyclerView.ViewHolder, T> =
    viewDelegate(default).map(mapper = RecyclerView.ViewHolder::itemView)
```

Again, just like before with `Intents,` `Activities `and `Fragments;` any `ViewBinding `or `RecyclerView.ViewHolder `instance can have any arbitrary property. This is especially useful for:

0. `RecyclerView.ViewHolder i`nstances, because it means you don’t ever need to subclass it again; just add `private ``var `properties that delegate to the type you want. This is the whole foundation for declarative `RecyclerViews `covered [here.](https://proandroiddev.com/declarative-lists-on-android-with-recyclerview-viewbinding-4c1c7ead0e67)

0. `ViewBinding `or `View `instances needing a custom animator. In the below, a `TextView `has a custom `ObjectAnimator `tightly coupled with it without needing to subclass it.

```kt
private val TextView.textColorAnimator by viewDelegate(
    ValueAnimator.ofObject(ArgbEvaluator(), Color.RED)
        .setDuration(400L)
)

var TextView.animatedTextColor
    get() = textColorAnimator.animatedValue as? Int ?: currentTextColor
    set(value) {
        textColorAnimator.apply {
            cancel()
            setIntValues(currentTextColor, value)
            start()
        }
    }
```

The possibilities are quite endless. JSON deserialization is one of the most common things an app has to do and libraries often use reflection at runtime to help with it. With the right `Delegate `however, you could declare fields in a class and read the value from a common JSON type without the need for reflection.

In summary, Kotlin delegates are one of the best features of the language, and seem to be woefully underused. In your codebase there’s probably some utility function that does a transform that a `Delegate `is better suited for. Why not add replacing it with a custom `Delegate `to your New Year’s resolutions?

All the aforementioned `Delegates `are bundled (pun intended) in the following dependency, and more reading about how Kotlin `Delegates `under the hood can be found [here.](https://medium.com/androiddevelopers/delegating-delegates-to-kotlin-ee0a0b21c52b)

