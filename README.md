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

## License

MIT [http://gunar.mit-license.org]()
