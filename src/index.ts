import axios from "axios";
import { writeFileSync } from "fs";
import { createContext, runInContext } from "vm";

export interface MediumData {
  title: string
  poster: string
  headline: string
  author: string
  authorAvatar: string
  publishedTime: Date
  markdown: string
}

export interface Mark {
  __typename: string
  start: number
  end: number
  type: string
  href: string
  anchorType: string
  userId: string
  linkMetadata: string
}

export interface Par {
  id: string
  __typename: string
  name: string
  text: string
  type: string
  href: string | null
  layout: string | null
  metadata: object | null
  hasDropCap: any | null
  iframe: any | null
  mixtapeMetadata: any | null
  markups: Mark[]
  dropCapImage: any | null
}

const media = (id: string) => {
  [id] = id.split(':').reverse()
  return `https://medium.com/media/${id}`
}

const image = (id: string) => {
  [id] = id.split(':').reverse()
  return `https://miro.medium.com/${id}`
}

const youtubeImg = (id: string) => {
  return `https://img.youtube.com/vi/${id}/0.jpg`
}
const youtubeUrl = (id: string, time?: string) => {
  return `https://www.youtube.com/watch?v=${id}${time ? `&${time}` : ''})`
}


const par = async (e: Par) => {
  try {
    if (e.type == 'H3')
      return `### ${await textMarks(e.text, e.markups)}`

    if (e.type == 'H4')
      return `#### ${await textMarks(e.text, e.markups)}`

    if (e.type == 'P')
      return `${await textMarks(e.text, e.markups)}`

    if (e.type == 'BQ')
      return `> ${await textMarks(e.text, e.markups)}`

    if (e.type == 'PQ')
      return `> ## ${await textMarks(e.text, e.markups)}`

    if (e.type == 'ULI')
      return `- ${await textMarks(e.text, e.markups)}`

    if (e.type == 'OLI')
      return `0. ${await textMarks(e.text, e.markups)}`

    if (e.type == 'IMG')
      return `![${await textMarks(e.text, e.markups)} ${e.layout || ''}]`
        + `(${image(e.metadata['__ref'].split(':')[1])})`

    if (e.type == 'PRE')
      return '```\n' + e.text + '\n```'

    let out = ''

    if (e.type == 'IFRAME') {
      if (!out && e.iframe?.mediaResource)
        out = await tryGetMedia(e.iframe.mediaResource.__ref)
    }

    if (!out)
      throw ''

    return out
  } catch (error) {
    if (error) console.error(error)

    console.log('Unknow type ' + e.type)

    if (e.type == 'IFRAME')
      console.log(e)

    return ''
  }
}

const startMarks = async (m: Mark[]) => {
  return m.map(e => {
    if (e.type == 'CODE')
      return '`'

    if (e.type == 'A')
      return `[`

    if (e.type == 'EM')
      return `*`

    if (e.type == 'STRONG')
      return `**`

    console.log(e.type)
    return ''
  }).join('')
}

const endMarks = async (m: Mark[]) => {
  return m.map(e => {
    if (e.type == 'CODE')
      return '`'

    if (e.type == 'A')
      return `](${e.href})`

    if (e.type == 'EM')
      return `*`

    if (e.type == 'STRONG')
      return `**`

    console.log(e.type)
    return ''
  }).join('')
}

const textMarks = async (text = '', marks: Mark[]) => {
  const old = text
  text = ''

  for (let i = 0; i < old.length + 1; i++) {
    const m = marks.filter(e => e.start == i).reverse()
    const e = marks.filter(e => e.end == i)

    text += (await startMarks(m)) + (old[i] || '') + (await endMarks(e))
  }

  return text
}

const tryGetMedia = async (id: string) => {
  const req = await axios.get(media(id))
  const dataString = req.data as string

  if (typeof dataString != 'string')
    return ''

  if (dataString.indexOf('gist.github.com') != -1) {
    const re = /(https:\/\/gist.github.com\/([^\/]+)\/([^\.]+))\.js/
    const m = re.exec(dataString)

    if (!m) return '';

    const gistUrl = m[1]
    const nick = m[2]
    const id = m[3]

    const req = await axios.get(gistUrl)
    const gistString = req.data as string

    if (typeof gistString != 'string')
      return ''

    const re2 = new RegExp(`(/${nick}/${id}/raw/[^.]+\.([^"]+))`)
    const m2 = re2.exec(gistString)

    if (!m2) return ''

    const codeUrl = `https://gist.githubusercontent.com/${m2[1]}`
    const codeString = (await axios.get(codeUrl)).data as string

    return '```' + (m2[2] || '') + '\n' + codeString + '\n```'
  }

  {
    const re = /"href":"https:\/\/www\.youtube\.com\/watch\?v=([^"]+)"/
    const m = re.exec(dataString)
    if (m) return `[![](${youtubeImg(m[1])})](${youtubeUrl(m[1])})`
  }

  {
    const re = /"href":"https:\/\/youtu\.be\/([^\?"]+)\??([^"]+)?"/
    const m = re.exec(dataString)
    if (m) return `[![](${youtubeImg(m[1])})](${youtubeUrl(m[1], m[2])})`
  }

  return ''
}

export class MediumParser {
  static async parseFromURL(url: string): Promise<MediumData> {
    const request = await axios.get(url)

    if (request.status != 200)
      throw new Error(`Status code ${request.status}`)

    const data = {
      window: { main() { } },
      document: {},
    }

    const ctx = createContext(data)
    const stringData: string = request.data

    if (typeof stringData != 'string')
      return null

    let start = -1, findS = '<script>', findE = '</script>'

    while ((start = stringData.indexOf(findS, start)) != -1) {
      let end = stringData.indexOf(findE, start + 1)

      if (end == -1)
        break

      let length = end - start - findS.length
      let data = stringData.substr(start + findS.length, length)
      try {
        runInContext(data, ctx)
      } catch (e) {
        throw e
      }

      start = end
    }

    for (let t of ['__PRELOADED_STATE__', '__APOLLO_STATE__'])
      if (!(t in data.window))
        throw new Error('Error test data ' + t + '!')

    const ap = data.window['__APOLLO_STATE__']
    const apollo = Object.values(ap)

    const markdown = (await Promise.all(
      apollo.filter(e => e['__typename'] == 'Paragraph').map(par)
    )).join('\n\n')

    /**
        title: 'Post title',
        poster: 'https://....',
        headline: 'Headline from h2 tag',
        author: 'Some author',
        authorAvatrt: 'https://....',
        publishedAt: '2016-09-19T21:30:45.266Z',
        markdown: '# Markdown\nAs string...',
     */

    const post = apollo.find((e: object) => e['__typename'] == 'Post' && ('canonicalUrl' in e)) as any

    const title = post.title as string || ''
    const creator = post.creator?.__ref as string || ''
    const firstPublishedAt = post.firstPublishedAt as number || 0
    const previewImage = post.previewImage?.__ref as string || ''
    const previewContent = post.previewContent?.subtitle as string || ''

    const poster = image(previewImage)
    const author = ap[creator]?.name as string || ''
    const avatarId = ap[creator]?.imageId as string || ''
    const authorAvatar = image(avatarId)
    const publishedTime = new Date(firstPublishedAt)
    const headline = previewContent

    return {
      poster,
      title,
      headline,
      author,
      authorAvatar,
      publishedTime,
      markdown
    }
  }
}

export default MediumParser

if (process.argv.indexOf('--test') != -1) {
  const urls = [
    'https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0',
    'https://proandroiddev.com/kotlin-delegation-by-inception-61f8beaae0db',
    'https://medium.com/@hakim.fakher/kotlin-coroutines-basics-part-2-4087ce15ff28',
    'https://medium.com/google-developer-experts/how-to-handle-navigation-in-jetpack-compose-a9ac47f7f975?_branch_match_id=879042917137435364',
    'https://medium.com/@lukasz.marczak314/how-to-search-with-android-jetpack-ea55307e49a9',
    'https://proandroiddev.com/creating-appbars-in-jetpack-compose-a8b5a5639930',
    'https://medium.com/android-frontier/kelm-kotlin-ui-architecture-ea91fb745478'
  ]

  async function main(n = -1) {
    for (let i = 0; i < urls.length; i++) {
      if (n != -1 && n != i) continue

      console.log('Running ' + (i + 1))

      const d = await MediumParser.parseFromURL(urls[i])
        .catch(console.error)

      if (!d) continue

      const { markdown, ...data } = d
      const file = `test${i + 1}`
      writeFileSync(`./example/${file}.json`, JSON.stringify(data, null, 2))
      writeFileSync(`./example/${file}.md`, `*Parsed from* [URL](${urls[i]})\n\n You can see [JSON](./${file}.json) output\n\n----\n\n${markdown}`)
    }
  }

  main().catch(console.error)
}