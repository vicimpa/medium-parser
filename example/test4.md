*Parsed from* [URL](https://medium.com/google-developer-experts/how-to-handle-navigation-in-jetpack-compose-a9ac47f7f975?_branch_match_id=879042917137435364)

 You can see [JSON](./test4.json) output

----

### How to handle Navigation in Jetpack Compose

![ INSET_CENTER](https://miro.medium.com/1*IjXRLGfAQlpDdAt3fUT9DQ.jpeg)

Since I started using Jetpack Compose I fell in love with it, there are so much new ways to create interactive UI’s with just a few lines of code, no need of boilerplate, NullPointers when binding views, and anything like we use to deal before.

After spending some time understanding the whole concept of compose to create declarative UI’s I started questioning myself how to handle navigation with it, then I just deg into reading the example apps and understanding how it's done, and in this post, I gonna show you how to use navigation before an official approach comes up.

All the code we are gonna use is extracted from the official jetpack compose examples, more on **jetSnack** and **Owl** app, since the Navigator they provide handles multiple backstacks.

### How we used to handle navigation

Before Jetpack Compose we used to handle Navigation with Navigation Components library, Simple Stack library, intents, or with the FragmentManager itself.

Navigation with jetpack navigation looks like this

![ INSET_CENTER](https://miro.medium.com/1*9bZuBb2U2F2ZsgjrKfNfiQ.png)

This is how we actually do navigation with multiple destinations, the concept is one Activity and multiple fragments, the navigation components library handles all the backstack logic of poping fragments and pushing them into the stack, this is a really useful and easy API to handle navigation nowadays, but with the arrival of Jetpack Compose things became a little different.

### What about Fragments?

The concept of Fragments in Jetpack Compose is described [here,](https://developer.android.com/jetpack/compose/interop) basically, in Fragments we don't have the extension **setContent { } t**hat we usually have in our Activity component when we create a fresh Jetpack Compose example, instead, we need to add to our fragment a **ComposeView** that is used to bundle the **setContent { }** into the Fragment and start working into it.

After this, we can start writing our **@Composable** functions inside our Fragments, but take in mind that if we write Composables inside our Fragments we are gonna need to also handle the Fragment lifecycle with our Composables, this will make it hard for us to be less prone to problems.

### What about Jetpack Compose?

In Jetpack Compose, composables does not rely on a lifecycle (they only live untill the composition ends, hence, any observers that are attached to these composables also die), and this is great because we only host the composables inside our MainActivity and we only care about writing our views.

#### Quick note

The importance of a clean way to write composables is really important since what we want to accomplish with Composable functions is to remove the state of many composables that we can (state hoisting), doing this we can just have in the Composable tree just a few or one composable that depends on the state, making the rest of the Composables stateless, this is great to avoid any problems when the composables need to recompose.

When we talk about Navigation in Jetpack Compose, we don't talk about Fragments or Activities, we talk about poping and pushing Views into the current Screen, and this is what we are going to do next.

Without any fragments and just 1 Activity we are gonna build a 2 screen app that handles Navigation, a backstack and no Fragments.

#### Important

Since all of these examples provide now are running on the 1.0.0-alpha03 version of Jetpack Compose, this could change in favor of a new compose version, also, take in mind that the Jetpack Navigation team will work an easy to use API in the future to integrate it with Jetpack Compose, making all the navigation simpler than what we are going to see right now.

> The example provide below takes the Navigation code from the official jetpack compose example repo.

### How to handle Navigation

Let's start coding our app, this app is a Poll app that I’m currently working on in my public repo, you can check it here



The app is called JetPoll and is an interactive Poll app where users can create polls and others can vote them up, it uses Firebase to store the polls and register all the interactions, currently, this app is **WIP,** so any changes to the app will be updated on the repo.

![ INSET_CENTER](https://miro.medium.com/1*RDTMMGrrpuIzL_w2COpJPA.jpeg)

What we are gonna do is to add Navigation to the **Create** poll button to navigate to another screen that will let the user Create a Poll

Since this article will not cover how to create composables but how to handle navigation, I’m gonna talk about Navigation itself instead of how to create this UI.

### Define a Navigator

First of all, what we need to do is to define our Navigator class, this class will be the one that will handle the backstack of our current navigation and will

The Navigator that we are gonna use can be found on the OWL example of the official Jetpack Compose example repo.



```kt
import android.os.Parcelable
import androidx.activity.OnBackPressedCallback
import androidx.activity.OnBackPressedDispatcher
import androidx.compose.runtime.Composable
import androidx.compose.runtime.onCommit
import androidx.compose.runtime.remember
import androidx.compose.runtime.savedinstancestate.listSaver
import androidx.compose.runtime.staticAmbientOf
import androidx.compose.runtime.toMutableStateList

/**
 * A simple navigator which maintains a back stack.
 */
class Navigator<T : Parcelable> private constructor(
    initialBackStack: List<T>,
    backDispatcher: OnBackPressedDispatcher
) {
    constructor(
        initial: T,
        backDispatcher: OnBackPressedDispatcher
    ) : this(listOf(initial), backDispatcher)

    private val backStack = initialBackStack.toMutableStateList()
    private val backCallback = object : OnBackPressedCallback(canGoBack()) {
        override fun handleOnBackPressed() {
            back()
        }
    }.also { callback ->
        backDispatcher.addCallback(callback)
    }
    val current: T get() = backStack.last()

    fun back() {
        backStack.removeAt(backStack.lastIndex)
        backCallback.isEnabled = canGoBack()
    }

    fun navigate(destination: T) {
        backStack += destination
        backCallback.isEnabled = canGoBack()
    }

    private fun canGoBack(): Boolean = backStack.size > 1

    companion object {
        /**
         * Serialize the back stack to save to instance state.
         */
        fun <T : Parcelable> saver(backDispatcher: OnBackPressedDispatcher) =
            listSaver<Navigator<T>, T>(
                save = { navigator -> navigator.backStack.toList() },
                restore = { backstack -> Navigator(backstack, backDispatcher) }
            )
    }
}

/**
 * An effect for handling presses of the device back button.
 */
@Composable
fun backHandler(
    enabled: Boolean = true,
    onBack: () -> Unit
) {
    val backCallback = remember(onBack) {
        object : OnBackPressedCallback(enabled) {
            override fun handleOnBackPressed() {
                onBack()
            }
        }
    }
    onCommit(enabled) {
        backCallback.isEnabled = enabled
    }

    val dispatcher = BackDispatcherAmbient.current
    onCommit(backCallback) {
        dispatcher.addCallback(backCallback)
        onDispose {
            backCallback.remove()
        }
    }
}

/**
 * An [androidx.compose.runtime.Ambient] providing the current [OnBackPressedDispatcher]. You must
 * [provide][androidx.compose.runtime.Providers] a value before use.
 */
internal val BackDispatcherAmbient = staticAmbientOf<OnBackPressedDispatcher> {
    error("No Back Dispatcher provided")
}

```

First of all this Navigator takes 2 arguments, first one is the Initial destination, we are gonna call this destination the Home destination, is the first screen of our app, and then it takes a backDispatcher, this one is in charge of handling the back button press and handle the poping of the views of the backstack.

With all that said, there is no much more about this class, what it does is it takes navigations and add them to a backstack with the **navigate()** method, then it pops off the backstack on backButton press or calling the **back()** method.

After we define this, what we need to do is to create a NavGraph, something similar as we use to do with Jetpack Navigation but without XML.

### NavGraph

```kt
import android.os.Parcelable
import androidx.compose.runtime.Immutable
import kotlinx.android.parcel.Parcelize

sealed class Destination : Parcelable {

    @Parcelize
    object Home : Destination()

    @Parcelize
    object CreatePoll : Destination()
}

class Actions(navigator: Navigator<Destination>) {

    val createPoll: () -> Unit = {
        navigator.navigate(Destination.CreatePoll)
    }

    val pressOnBack: () -> Unit = {
        navigator.back()
    }
}
```

The **NavGraph** is responsible of knowing where we want to go, in this example, we just define a sealed class named Destination, this class will contain our current Destinations, in this case, I have 2, the Home destination and the CreatePoll destination (the one I need to go after pressing the **Create** poll button on the home screen)

After that, there is a **Actions** class which takes a **Navigator** initialized with the **Destinations** that we wrote before, this Actions class will be responsible of defining the actions we will do to navigate to a certain screen in our app.

This is actually 80% of the work done, what we need to add next is one more thing that will help us measure the insets of the screen to populate with the new composable that will be called as the other screen.

### DisplayInsets

```kt
import android.view.View
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.platform.ViewAmbient
import androidx.compose.ui.unit.*
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Taken from https://goo.gle/compose-insets. Requires androidx.core:core v1.5.0-alpha02+
 */

/**
 * Main holder of our inset values.
 */
@Stable
class DisplayInsets {
  /**
   * Inset values which match [WindowInsetsCompat.Type.systemBars]
   */
  val systemBars = Insets()

  /**
   * Inset values which match [WindowInsetsCompat.Type.systemGestures]
   */
  val systemGestures = Insets()

  /**
   * Inset values which match [WindowInsetsCompat.Type.navigationBars]
   */
  val navigationBars = Insets()

  /**
   * Inset values which match [WindowInsetsCompat.Type.statusBars]
   */
  val statusBars = Insets()

  /**
   * Inset values which match [WindowInsetsCompat.Type.ime]
   */
  val ime = Insets()
}

@Stable
class Insets {
  /**
   * The left dimension of these insets in pixels.
   */
  var left by mutableStateOf(0)
    internal set

  /**
   * The top dimension of these insets in pixels.
   */
  var top by mutableStateOf(0)
    internal set

  /**
   * The right dimension of these insets in pixels.
   */
  var right by mutableStateOf(0)
    internal set

  /**
   * The bottom dimension of these insets in pixels.
   */
  var bottom by mutableStateOf(0)
    internal set

  /**
   * Whether the insets are currently visible.
   */
  var isVisible by mutableStateOf(true)
    internal set
}

val InsetsAmbient = staticAmbientOf<DisplayInsets>()

/**
 * Applies any [WindowInsetsCompat] values to [InsetsAmbient], which are then available
 * within [content].
 *
 * @param consumeWindowInsets Whether to consume any [WindowInsetsCompat]s which are dispatched to
 * the host view. Defaults to `true`.
 */
@Composable
fun ProvideDisplayInsets(
  consumeWindowInsets: Boolean = true,
  content: @Composable () -> Unit
) {
  val view = ViewAmbient.current

  val displayInsets = remember { DisplayInsets() }

  onCommit(view) {
    ViewCompat.setOnApplyWindowInsetsListener(view) { _, windowInsets ->
      displayInsets.systemBars.updateFrom(windowInsets, WindowInsetsCompat.Type.systemBars())
      displayInsets.systemGestures.updateFrom(
        windowInsets,
        WindowInsetsCompat.Type.systemGestures()
      )
      displayInsets.statusBars.updateFrom(windowInsets, WindowInsetsCompat.Type.statusBars())
      displayInsets.navigationBars.updateFrom(
        windowInsets,
        WindowInsetsCompat.Type.navigationBars()
      )
      displayInsets.ime.updateFrom(windowInsets, WindowInsetsCompat.Type.ime())

      if (consumeWindowInsets) WindowInsetsCompat.CONSUMED else windowInsets
    }

    // Add an OnAttachStateChangeListener to request an inset pass each time we're attached
    // to the window
    val attachListener = object : View.OnAttachStateChangeListener {
      override fun onViewAttachedToWindow(v: View) = v.requestApplyInsets()
      override fun onViewDetachedFromWindow(v: View) = Unit
    }
    view.addOnAttachStateChangeListener(attachListener)

    if (view.isAttachedToWindow) {
      // If the view is already attached, we can request an inset pass now
      view.requestApplyInsets()
    }

    onDispose {
      view.removeOnAttachStateChangeListener(attachListener)
    }
  }

  Providers(InsetsAmbient provides displayInsets) {
    content()
  }
}

/**
 * Updates our mutable state backed [Insets] from an Android system insets.
 */
private fun Insets.updateFrom(windowInsets: WindowInsetsCompat, type: Int) {
  val insets = windowInsets.getInsets(type)
  left = insets.left
  top = insets.top
  right = insets.right
  bottom = insets.bottom

  isVisible = windowInsets.isVisible(type)
}

/**
 * Apply additional space which matches the height of the status bars height along the top edge
 * of the content.
 */
fun Modifier.statusBarsPadding() = composed {
  insetsPadding(insets = InsetsAmbient.current.statusBars, top = true)
}

/**
 * Apply additional space which matches the height of the navigation bars height
 * along the [bottom] edge of the content, and additional space which matches the width of
 * the navigation bars on the respective [left] and [right] edges.
 *
 * @param bottom Whether to apply padding to the bottom edge, which matches the navigation bars
 * height (if present) at the bottom edge of the screen. Defaults to `true`.
 * @param left Whether to apply padding to the left edge, which matches the navigation bars width
 * (if present) on the left edge of the screen. Defaults to `true`.
 * @param right Whether to apply padding to the right edge, which matches the navigation bars width
 * (if present) on the right edge of the screen. Defaults to `true`.
 */
fun Modifier.navigationBarsPadding(
  bottom: Boolean = true,
  left: Boolean = true,
  right: Boolean = true
) = composed {
  insetsPadding(
    insets = InsetsAmbient.current.navigationBars,
    left = left,
    right = right,
    bottom = bottom
  )
}

/**
 * Declare the height of the content to match the height of the navigation bars, plus some
 * additional height passed in via [additional]
 *
 * As an example, this could be used with `Spacer` to push content above the navigation bar
 * and bottom app bars:
 *
 * ```
 * Column {
 *     // Content to be drawn above navigation bars and bottom app bar (y-axis)
 *
 *     Spacer(Modifier.statusBarHeightPlus(48.dp))
 * }
 * ```
 *
 * Internally this matches the behavior of the [Modifier.height] modifier.
 *
 * @param additional Any additional height to add to the status bars size.
 */
fun Modifier.navigationBarsHeightPlus(additional: Dp) = composed {
  InsetsSizeModifier(
    insets = InsetsAmbient.current.navigationBars,
    heightSide = VerticalSide.Bottom,
    additionalHeight = additional
  )
}

enum class HorizontalSide {
  Left,
  Right
}

enum class VerticalSide {
  Top,
  Bottom
}

/**
 * Allows conditional setting of [insets] on each dimension.
 */
private fun Modifier.insetsPadding(
  insets: Insets,
  left: Boolean = false,
  top: Boolean = false,
  right: Boolean = false,
  bottom: Boolean = false
) = this then InsetsPaddingModifier(insets, left, top, right, bottom)

private data class InsetsPaddingModifier(
  private val insets: Insets,
  private val applyLeft: Boolean = false,
  private val applyTop: Boolean = false,
  private val applyRight: Boolean = false,
  private val applyBottom: Boolean = false
) : LayoutModifier {
  override fun MeasureScope.measure(
    measurable: Measurable,
    constraints: Constraints
  ): MeasureScope.MeasureResult {
    val left = if (applyLeft) insets.left else 0
    val top = if (applyTop) insets.top else 0
    val right = if (applyRight) insets.right else 0
    val bottom = if (applyBottom) insets.bottom else 0
    val horizontal = left + right
    val vertical = top + bottom

    val placeable = measurable.measure(constraints.offset(-horizontal, -vertical))

    val width = (placeable.width + horizontal)
      .coerceIn(constraints.minWidth, constraints.maxWidth)
    val height = (placeable.height + vertical)
      .coerceIn(constraints.minHeight, constraints.maxHeight)
    return layout(width, height) {
      placeable.place(left, top)
    }
  }
}

private data class InsetsSizeModifier(
  private val insets: Insets,
  private val widthSide: HorizontalSide? = null,
  private val additionalWidth: Dp = 0.dp,
  private val heightSide: VerticalSide? = null,
  private val additionalHeight: Dp = 0.dp
) : LayoutModifier {
  private val Density.targetConstraints: Constraints
    get() {
      val additionalWidthPx = additionalWidth.toIntPx()
      val additionalHeightPx = additionalHeight.toIntPx()
      return Constraints(
        minWidth = additionalWidthPx + when (widthSide) {
          HorizontalSide.Left -> insets.left
          HorizontalSide.Right -> insets.right
          null -> 0
        },
        minHeight = additionalHeightPx + when (heightSide) {
          VerticalSide.Top -> insets.top
          VerticalSide.Bottom -> insets.bottom
          null -> 0
        },
        maxWidth = when (widthSide) {
          HorizontalSide.Left -> insets.left + additionalWidthPx
          HorizontalSide.Right -> insets.right + additionalWidthPx
          null -> Constraints.Infinity
        },
        maxHeight = when (heightSide) {
          VerticalSide.Top -> insets.top + additionalHeightPx
          VerticalSide.Bottom -> insets.bottom + additionalHeightPx
          null -> Constraints.Infinity
        }
      )
    }

  override fun MeasureScope.measure(
    measurable: Measurable,
    constraints: Constraints
  ): MeasureScope.MeasureResult {
    val wrappedConstraints = targetConstraints.let { targetConstraints ->
      val resolvedMinWidth = if (widthSide != null) {
        targetConstraints.minWidth
      } else {
        constraints.minWidth.coerceAtMost(targetConstraints.maxWidth)
      }
      val resolvedMaxWidth = if (widthSide != null) {
        targetConstraints.maxWidth
      } else {
        constraints.maxWidth.coerceAtLeast(targetConstraints.minWidth)
      }
      val resolvedMinHeight = if (heightSide != null) {
        targetConstraints.minHeight
      } else {
        constraints.minHeight.coerceAtMost(targetConstraints.maxHeight)
      }
      val resolvedMaxHeight = if (heightSide != null) {
        targetConstraints.maxHeight
      } else {
        constraints.maxHeight.coerceAtLeast(targetConstraints.minHeight)
      }
      Constraints(
        resolvedMinWidth,
        resolvedMaxWidth,
        resolvedMinHeight,
        resolvedMaxHeight
      )
    }
    val placeable = measurable.measure(wrappedConstraints)
    return layout(placeable.width, placeable.height) {
      placeable.place(0, 0)
    }
  }

  override fun IntrinsicMeasureScope.minIntrinsicWidth(
    measurable: IntrinsicMeasurable,
    height: Int
  ) = measurable.minIntrinsicWidth(height).let {
    val constraints = targetConstraints
    it.coerceIn(constraints.minWidth, constraints.maxWidth)
  }

  override fun IntrinsicMeasureScope.maxIntrinsicWidth(
    measurable: IntrinsicMeasurable,
    height: Int
  ) = measurable.maxIntrinsicWidth(height).let {
    val constraints = targetConstraints
    it.coerceIn(constraints.minWidth, constraints.maxWidth)
  }

  override fun IntrinsicMeasureScope.minIntrinsicHeight(
    measurable: IntrinsicMeasurable,
    width: Int
  ) = measurable.minIntrinsicHeight(width).let {
    val constraints = targetConstraints
    it.coerceIn(constraints.minHeight, constraints.maxHeight)
  }

  override fun IntrinsicMeasureScope.maxIntrinsicHeight(
    measurable: IntrinsicMeasurable,
    width: Int
  ) = measurable.maxIntrinsicHeight(width).let {
    val constraints = targetConstraints
    it.coerceIn(constraints.minHeight, constraints.maxHeight)
  }
}
```

As the Documentation it provides

> ## Applies any [WindowInsetsCompat] values to [InsetsAmbient], which are then available * within [content]. *@param consumeWindowInsets Whether to consume any [WindowInsetsCompat]s which are dispatched to * the host view. Defaults to `true`.

There is no much to say about this class, it will only measure the current composables that we are navigating and will take only composables in the **ProvideDisplayInsets** Composable

### Let's create the Navigation

Now that we already have all the classes we need for navigation and defining the destinations in the **NavGraph** file we are ready to start implementing it into our current code

First of all, in our MainActivity we will need to launch our Composable with the on *onBackPressedDispatcher w*hich will know when we do a backPress, passing this dispatcher lets us handle the backPress button and apply logic into it.

#### MainActivity

```kt
class MainActivity : AppCompatActivity() {

    private val viewModel by viewModels<PollViewModel> { PollViewModelFactory(RepoImpl(DataSource())) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PollMain(viewModel = viewModel,backDispatcher = onBackPressedDispatcher)
        }
    }
}
```

Now that we already passed the *onBackPressedDispatcher* , now we need to create the Navigation into our PollMain composable.

#### PollMain

```kt
@Composable
fun PollMain(viewModel: PollViewModel, backDispatcher: OnBackPressedDispatcher) {
    val navigator: Navigator<Destination> = rememberSavedInstanceState(
        saver = Navigator.saver(backDispatcher)
    ) {
        Navigator(Destination.Home, backDispatcher)
    }
    val actions = remember(navigator) { Actions(navigator) }

    Providers(BackDispatcherAmbient provides backDispatcher) {
        ProvideDisplayInsets {
            Crossfade(navigator.current) { destination ->
                when (destination) {
                    is Destination.Home -> {
                        PollHome(viewModel = viewModel,onCreatePollClick = actions.createPoll)
                    }
                    is Destination.CreatePoll -> {
                        CreatePollScreen()
                    }
                }
            }
        }
    }
}
```

This is the most important step, here we will define our **Navigator,** as you can see the first line of code defines the **Navigator** with the **Destinations** we provided on the **NavGraph,** then we use the **rememberSavedInstanceState,** and this is really great because it survives process death !!

Then the Navigator defines the saver, and here is what I was talking about before, we pass the *onBackPressedDispatcher* that will be configured to handle poping of the backstack.

Now, we need to initialize our **Navigator,** we will initialize it with the Home destination, so the first screen that pops up is the Home screen

We then create an action variable that will remember our actions (current navigated screen) and will be responsible to push our new destinations into our screen.

Lastly, we provide the **BackStackDispatcherAmbient** to handle the backstack and then the ProvideDisplayInsets we talked about before, this function just takes Composables as it child.

Here, **CrossFade** will just play a nicer CrossFade animation on the **navigator.current** which represents the new navigations that we are going

And lastly, we already have our destinations !! we use a when() expression to inflate one or the other, and this inflation will be caused with the action we created before, now, for example, my Home screen has the Create button, what I just need to do is that when I press that button to execute the **actions.createPoll** that we defined in our **NavGraph,** that's all.

#### PollHome

```kt
@Composable
fun PollHome(viewModel: PollViewModel, onCreatePollClick: () -> Unit){
    val pollResult: Result<List<Poll>> by viewModel.fetchAllPolls.observeAsState(Result.Success(emptyList()))
    when (pollResult) {
        is Result.Loading -> ShowProgress()
        is Result.Success -> {
            PollScreen(
                pollList = (pollResult as Result.Success<List<Poll>>).data,
                user = User("Gaston","https://avatars2.githubusercontent.com/u/24615408?s=460&u=8a985792aa795ada276b4d567baba1c732ab02fb&v=4"),
                onCreatePollClick = onCreatePollClick)
        }
        is Result.Failure -> ShowError((pollResult as Result.Failure<List<Poll>>).exception)
    }
}

@Composable
private fun PollScreen(pollList:List<Poll>, user: User, onCreatePollClick: () -> Unit){
    Column(modifier = Modifier.fillMaxHeight()) {
        CreatePollComponent(modifier = Modifier.fillMaxWidth().padding(start = 32.dp,end = 32.dp,top = 32.dp).weight(1f),username = user.userName, onCreatePollClick = onCreatePollClick, userphoto = user.userPhoto)
        PollListComponent(modifier = Modifier.padding(bottom = 32.dp),pollList = pollList)
    }
}


@Composable
private fun ShowProgress() {
    Box(modifier = Modifier.fillMaxSize(), gravity = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ShowError(exception: Exception) {
    Box(modifier = Modifier.fillMaxSize(), gravity = Alignment.Center) {
        Text(text = "An error ocurred fetching the polls.")
    }
    Log.e("PollFetchError", exception.message!!)
}

```

Lastly, we just propagate the click to the **CreatePollComponent** which holds the Create button that we need to handle interaction with

#### CreatePollComponent

```kt
@Composable
fun CreatePollComponent(modifier: Modifier = Modifier, username:String, onCreatePollClick: () -> Unit, userphoto:String) {
    Column(modifier = modifier){
        Row {
            Text(text = "Welcome $username",modifier = Modifier.weight(1f),style = typography.h5,fontWeight = FontWeight.Bold)
            val imageModifier = Modifier.preferredSize(45.dp).drawShadow(elevation = 4.dp, shape = CircleShape).background(color = Color.White, shape = CircleShape)
            CoilImage(data = userphoto,modifier = imageModifier,contentScale = ContentScale.Crop)
        }
        Spacer(modifier = Modifier.padding(top = 4.dp))
        Text(modifier = Modifier.width(240.dp).wrapContentHeight(),text = "Create poll and ask your friends about their opinions.",textAlign = TextAlign.Start,style = typography.body1)
        Spacer(modifier = Modifier.padding(16.dp))
        Button(modifier = Modifier.preferredSize(120.dp,50.dp),shape = CircleShape,onClick = onCreatePollClick ){
            Text("Create")
        }
    }
}
```

And thats all ! , when we press Create we will navigate to our **CreatePollScreen(),** which only shows a Text for now

#### CreatePollScreen

```kt
@Composable
fun CreatePollScreen(){
    Box(modifier = Modifier.fillMaxHeight()){
    Text("Create poll screen ;)")
    }
}
```

### Output

![ INSET_CENTER](https://miro.medium.com/1*2kKCpJcrEJSS11s734ENJQ.gif)

All of this code can be found in my repository, I will keep it up to date, also you can find a lot of Jetpack Compose example components there, the repo is here

