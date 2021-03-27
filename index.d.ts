declare module 'medium-parser' {
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
    static parseFromURL(url: string): Promise<MediumData>
    static parseFromHTML(url: string): MediumData
  }

  export default MediumParser
}