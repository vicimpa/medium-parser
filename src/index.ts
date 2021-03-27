import axios from "axios";
import { load } from "cheerio";
import { writeFileSync } from "fs";
import { processElement } from "./processElement";

export interface MediumData {
  title: string
  poster: string
  headline: string
  author: string
  authorAvatar: string
  publishedTime: Date
  markdown: string
}

export class MediumParser {
  static async parseFromURL(url: string): Promise<MediumData> {
    const request = await axios.get(url)

    if(request.status != 200)
      throw new Error(`Status code ${request.status}`)

    return this.parseFromHTML(request.data)
  }

  static parseFromHTML(html: string): MediumData {
    const $ = load(html)

    const title =
      $('h1')
        .first()
        .text()

    const headline =
      $('h2')
        .first()
        .text()

    const authodHead = 
      $('h1')
        .first()
        .next()
        .find('div > div')
        
    const author =
      authodHead
        .find('span')
        .first()
        .text()

    const authorAvatar =
      authodHead
        .find('img')
        .first()
        .attr('src')

    const poster = 
      $('figure img')
        .first()
        .attr('src')

    const publishedTime =
      $('meta[property="article:published_time"]')
        .attr("content")

    const markdown =
      $('article section > div > div')
        .contents()
        .toArray()
        .splice(2)
        .map(processElement)
        .join('\n')
        .replace(/\n\n\n/g, '\n\n')
        .trim()

    return {
      title,
      poster,
      headline,
      author,
      authorAvatar,
      publishedTime: new Date(publishedTime),
      markdown,
    }
  }
}

export default MediumParser


if(process.argv.indexOf('--test') != -1) {
  MediumParser.parseFromURL('https://medium.com/@hakim.fakher/kotlin-coroutines-basics-part-2-4087ce15ff28')
    .then(e => {
      writeFileSync('./example/test2.md', e.markdown)
    })
    .catch(console.error)
}
