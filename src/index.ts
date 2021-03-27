import axios from "axios";
import { load } from "cheerio";
import { URL } from "url";
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
    const pUrl = new URL(url)

    if (pUrl.hostname != 'medium.com')
      throw new Error('You trying parse not medium.com')

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