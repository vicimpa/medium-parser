*Parsed from* [URL](https://medium.com/@hakim.fakher/kotlin-coroutines-basics-part-2-4087ce15ff28)

 You can see [JSON](./test3.json) output

----

### Kotlin Coroutines Basics part-2

Async, withContext, exception handling

![ INSET_CENTER](https://miro.medium.com/1*CcTehqIhXGAYsWn7E_guJQ.jpeg)

### Introduction

This is the part-2 of a series of posts explaining multi-threading using coroutines. If you didn’t check the first part, here is the [link.](https://medium.com/@hakim.fakher/kotlin-coroutines-basics-5ac9d362a1d5) I recommend you to read it before you continue reading this part, it present some of fundamental concept of coroutines. In this part, we will talk about `async,` `withContext` and exception handling.

### Async

So what is an `async` in coroutines and why they are so useful ? Remember the `launch` that we talked about in the last part ? In fact `async` is just like launch it starts a coroutine except that it return a result. The only difference between async and a normal function is that async start a coroutine that run in a different thread with parallel with the main thread so the result returned by async is deferred in time until the coroutine finish the work and return the result. That’s why the async return what we call a `Deferred.` So once we need the result of that coroutine, we call the method `await()` to get the value. In fact this method is a blocking method, that’s mean if the value is ready it will return it immediately otherwise it will block the thread until it become available and at that time it returns the value.

Let’s see in practice how we use an `async` . So we will write a small program that has two `suspend` functions returning each an Integer after some work (for simplicity of the example we will just add a delay), than we will print the sum of these two numbers! easy isn’t it ? :D

```
fun main() {
    runBlocking {
        val firstDeferred = async { getFirstNumber() }
        val secondDeferred = async { getSecondNumber() }

        println("Doing some processing!")
        delay(500)
        println("Waiting for values")

        val firstValue = firstDeferred.await()
        val secondValue = secondDeferred.await()

        println("the sum is ${firstValue + secondValue}")
    }
}

suspend fun getFirstNumber(): Int {
    delay(1000)
    val value = Random.nextInt(100)
    println("returning first value: $value")
    return value
}

suspend fun getSecondNumber(): Int {
    delay(2000)
    val value = Random.nextInt(100)
    println("returning second value: $value")
    return value
}
```

So here we have these two function that will do some work than each return an Integer. In the main program, we launch these two function in an `async` in order to get the result. After launching these two asyncs, let’s say we have a small processing of 500 millis in our program and then, we want to get the values from the two functions in order to print there sum! In order to get the value immediately, we must call the method `await` to force the async to get the value! Actually, it will pause the current thread, execute the work until the value is ready and then return it. Try to run this code and see the output and the delays between each print.

```
main Doing some processing!
Waiting for values
main returning first value: 72
main returning second value: 76
the sum is 148
```

So that’s it for the `async` !

> Remember, use `launch` when you don’t have a value to return from that coroutine, use `async` in case you expect a value !

### withContext

It’s no more than a function! `withContext` is a function that allows us to switch between `Dispatchers` inside a coroutine.

Let’s say we have an Android application that will apply a filter on an Image before showing it. Of course applying a filter is an intensif work we can’t apply it in the UiThread. So we must launch a coroutine with `Dispatchers.Default` (Use Default Dispatchers for CPU processing works) and then once the image is ready, we show it in the UI. Now to show the image in the UI thread, we must switch from the background thread that applied the filter on the image to the UI thread that will show the filtered image. In order to do that, we just call the function `withContext(Dispatchers.Main(){//Show the image}` and that code will be executed in the main dispatcher given to the method `withContext()` which is the UiThread in Android.

Let’s go through an example, we will just print the `coroutineContext` in each scope and see what’s the dispatcher the code is running on.

```
fun main() {
    runBlocking {
        launch (Dispatchers.Default){
            println("First context is $coroutineContext")

            withContext(Dispatchers.IO){
                println("Second context is $coroutineContext")
            }
            println("Third context is $coroutineContext")
        }
    }
}
```

When we run this code we get this output:

```
First context is [StandaloneCoroutine{Active}@d018aa4, DefaultDispatcher]
```

```
Second context is [DispatchedCoroutine{Active}@71b2215, LimitingDispatcher@2c910d33[dispatcher = DefaultDispatcher]]
```

```
Third context is [StandaloneCoroutine{Active}@d018aa4, DefaultDispatcher]
```

For the first and the third message, it’s the same context, the same Dispatcher (in my case it’s @d018aa4) but for the second message which is printed inside a withContext method, the context here is changed (and the dispatcher obviously).

The withContext is very useful method especially when working on Android application and you need to update the UI in the main thread.

### Exception handling

In this section we will talk about exception handling in coroutine. In fact it depends weither we started the coroutine by `launch` or `async` method. The `launch` method return a `Job` , the `async` return a `Deferred` .

`launch` :

- Propagate through the parent-child hierarchy.

- The exception will be thrown immediately and jobs will fail.

- Use try/catch or an exception handling.

`async` :

- Exceptions are deferred until the value is consumed (by calling the `await()` function).

- If the result is not consumed, the exception is never thrown.

- Use try-catch in the coroutine or in the `await` call.

Now let’s try to handle exceptions in both cases.

we will start by `launch` , the example is quiet simple, we are going to launch a coroutine and throw an Exception, then we will join this job to the main context (If we don’t join the job, we will not get the exception).

```
fun main() {
    runBlocking {
        val job = GlobalScope.launch {
            println("Throwing an exception from job")
            throw IllegalStateException("This is an illegal State Exception!")
        }
        job.join()
    }
}
```

Once we run this code we will get a beautiful IllegalStateException!

So the question is how we are going to handle this exception?

Coroutines offers an exception handler that we can create and pass it as parameter to the `launch` method.

First, let’s create the exception handler:

```
val myHandler = CoroutineExceptionHandler { coroutineContext, throwable ->
    println("handling error: ${throwable.message}")
}
```

that’s it! now we can add this handler to our job so we can handle the exception.

```
fun main() {
    runBlocking {
        val job = GlobalScope.launch(myHandler) { //We pass the //handler to the launch function
            println("Throwing an exception from job")
            throw IllegalStateException("This is an illegal State Exception!")
        }
        job.join()
    }
}
```

now try to run this code and you will see that the exception is handled and the program doesn’t crash any more.

Now, what if we want launch the coroutine in a different dispatcher and with an exception handler that we defined ?

it’s quiet easy, we have just to add it as parameter in the launch method this way:

```
val job = GlobalScope.launch(Dispatchers.IO + myHandler){//Code}
```

So now we have a coroutine launched in IO Dispatcher with an exception handler that we defined.

Now let’s talk about `async` function. let’s launch an `async` and call the `await` method and see how we can catch the exception.

```
fun main() {
    runBlocking {
        val deferred = GlobalScope.async {
            println("Throwing an exception from deferred")
            throw IllegalStateException("This is an illegal State Exception!")
        }
        deferred.await()
    }
}
```

Now if you run this code you will get an IllegalStateException. To catch the exception, we can use the classic try-catch bloc. We have two options, we can catch the exception once we call the `await` function or inside the `async` function itself. the code will be:

```
fun main() {
    runBlocking {
        val deferred = GlobalScope.async {
            println("Throwing an exception from deferred")
            throw IllegalStateException("This is an illegal State Exception!")
        }
        try {
            deferred.await()
        } catch (e: java.lang.IllegalStateException) {
            println("Exception caught: ${e.message}")
        }
    }
}
```

And now the exception is caught!

### Sample

To summarize all the knowledge we gained, let’s implement a small Android application. This application will be very simple, we are going to download an image, apply a filter, and then show it in the UI. It’s a small application but it’s enough to use all concepts that we talked about in these two posts.

I assume that you have a knowledge about Android development so I am not going just to explain the coroutines bloc of code.

To start, add the coroutines-core dependencies in your app/build.gradle file

```
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.3.5'
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.3.2'
```

After adding the dependencies, go to your `activity_main` file and place this code:

```
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <ImageView
        android:id="@+id/imageView"
        android:layout_width="300dp"
        android:layout_height="300dp"
        android:scaleType="centerCrop"
        android:visibility="gone"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:srcCompat="@mipmap/ic_launcher" />

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />
</androidx.constraintlayout.widget.ConstraintLayout>
```

The UI will be as simple as possible. We just have an ImageView to show the filtered image and a ProgressBar to show while waiting fetching and processing the image.

Now in your `MainActivity` we are going to download the image, apply a filter and show the filtered image. All this stuff will be done by coroutines!

I will first put the code than we will discuss it.

```
class MainActivity : AppCompatActivity() {

    private val IMAGE_URL = "https://i.ibb.co/Ky9r7jk/440px-Lenna-test-image.png"
    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        coroutineScope.launch {
            //We are in the UI thread!
            val originalDeferredImage = coroutineScope.async(Dispatchers.IO) {
                //We are in IO thread!
                getOriginalImage(IMAGE_URL)
            }

            //We are in UI thread!
            val originalBitmap = originalDeferredImage.await()

            val filteredImageDeferred = coroutineScope.async(Dispatchers.Default) {
                //We are in Default thread!
                Filter.apply(originalBitmap)
            }

            //We are in UI thread!
            val filteredImage = filteredImageDeferred.await()
            loadImage(filteredImage)
        }
    }

    private fun getOriginalImage(imageURL: String): Bitmap {
        URL(imageURL).openStream().use {
            return BitmapFactory.decodeStream(it)
        }
    }

    private fun loadImage(bitmap: Bitmap) {
        progressBar.visibility = View.GONE
        imageView.setImageBitmap(bitmap)
        imageView.visibility = View.VISIBLE
    }

}
```

Let’s start with the two function in the bottom of the class. the `getOriginalImage` will download an image from an url and return a Bitmap. the `loadImage` will hide the progressBar, make the ImageView visible and show the bitmap.

Now as you can see in the top of the class we declared a `coroutineScope` that will be running in `Main` Dispatcher which is UiTread in Android.

We launch this coroutine with `launch` function (we are not waiting a return value from this coroutine). Inside this coroutine, we create a `Deferred` that will download the image. Now, downloading an image is a read/write operation. For that kind of work, we do it in the `Dispatchers.IO` and that’s why in the `async` function we switched the dispatcher to the IO dispatcher so all the bloc inside the `async(Dispatcher.IO){//block}` will be executed in an IO dispatcher.

So now we need the downloaded image to apply the filter, but it’s running in different thread so we must wait for it until it’s downloaded. here comes the utility of `await` function, it will suspend the current thread until we get the value needed. So when here:

```
val originalBitmap = originalDeferredImage.await()
```

The main thread will be suspended until the `deferred` that will return the downloaded image return this image.

After we get the image, we now can apply the filter. Applying a filter is an intensive CPU work. For that kind of work, we must choose the `Default` dispatcher! That’s why in our code we declared a `deferred(`because we are waiting a result from the coroutine) that will be run in `Dispatchers.Default`

```
val filteredImageDeferred = coroutineScope.async(Dispatchers.Default) {
    Filter.apply(originalBitmap)
}
```

calling `await` on this `deferred` will also suspend the current thread until we get the result, in our case the filtered image and now we can set the ImageView with the filtered image! Remember that we are in a coroutine that’s running on the `Main` dispatcher, so we don’t need to switch the context!

> In android, there is another Dispatcher in ViewModels to do your work. All you need to do is `viewModelScope.launch{//your beautiful code}`

### Conclusion

By reading these two parts of coroutines-basics and implementing this sample, you are now must be able to develop a whole application using Coroutines :D

> For some Frameworks that support coroutines like `Room` or `Retrofit` they return suspend functions, use these function in the main thread is safe so you don’t need to define a Dispatcher before calling these functions because they are `main-safe.`