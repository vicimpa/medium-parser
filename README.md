# medium-parser

A simple parser for Medium (html) into Markdown.

## Example usage

`npm install https://github.com/vicimpa/medium-parser`

then

```js
const {MediumParser} = require('medium-parser');

const post1 = MediumParser.parseFromHTML(htmlAsString)
/*
  post1 == {
    poster: 'https://...',
    title: 'Post title',
    headline: 'Headline from h2 tag',
    author: 'Some author',
    authorAvatar: 'https://...',
    publishedTime: '2016-09-19T21:30:45.266Z' as Date,
    markdown: '# Markdown\nAs string...',
  }
*/

MediumParser.parseFromUrl(urlAsString)
  .then(post2 => {
    /*
      post2 == {
        poster: 'https://...',
        title: 'Post title',
        headline: 'Headline from h2 tag',
        author: 'Some author',
        authorAvatar: 'https://...',
        publishedTime: '2016-09-19T21:30:45.266Z' as Date,
        markdown: '# Markdown\nAs string...',
      }
    */
    // .. code .. //
    
  })
  .catch(error => {
    // .. code .. //
  })
```

and

```js
import { MediumParser } from 'medium-parser';

const post1 = MediumParser.parseFromHTML(htmlAsString)
/*
  post1 == {
    poster: 'https://...',
    title: 'Post title',
    headline: 'Headline from h2 tag',
    author: 'Some author',
    authorAvatar: 'https://...',
    publishedTime: '2016-09-19T21:30:45.266Z' as Date,
    markdown: '# Markdown\nAs string...',
  }
*/

MediumParser.parseFromUrl(urlAsString)
  .then(post2 => {
    /*
      post2 == {
        poster: 'https://...',
        title: 'Post title',
        headline: 'Headline from h2 tag',
        author: 'Some author',
        authorAvatar: 'https://...',
        publishedTime: '2016-09-19T21:30:45.266Z' as Date,
        markdown: '# Markdown\nAs string...',
      }
    */
    // .. code .. //
    
  })
  .catch(error => {
    // .. code .. //
  })

```

## Example

1. [Test parse](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) -> [result](example/test1.md)
2. [Test parse](https://proandroiddev.com/kotlin-delegation-by-inception-61f8beaae0db) -> [result](example/test2.md)
3. [Test parse](https://medium.com/@hakim.fakher/kotlin-coroutines-basics-part-2-4087ce15ff28) -> [result](example/test3.md)
4. [Test parse](https://medium.com/google-developer-experts/how-to-handle-navigation-in-jetpack-compose-a9ac47f7f975?_branch_match_id=879042917137435364) -> [result](example/test4.md)
5. [Test parse](https://medium.com/@lukasz.marczak314/how-to-search-with-android-jetpack-ea55307e49a9) -> [result](example/test5.md)
6. [Test parse](https://proandroiddev.com/creating-appbars-in-jetpack-compose-a8b5a5639930) -> [result](example/test6.md)
7. [Test parse](https://medium.com/android-frontier/kelm-kotlin-ui-architecture-ea91fb745478) -> [result](example/test7.md)

## License

MIT [http://gunar.mit-license.org]()
