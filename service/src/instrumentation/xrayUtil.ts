import { SegmentLike } from 'aws-xray-sdk-core'

export type SegmentAnnotations = {
  [key: string]: boolean | string | number | null | undefined
}

export function annotateSegment(segment: SegmentLike, annotations: SegmentAnnotations): void {
  for (const [key, value] of Object.entries(annotations)) {
    if (value != undefined) {
      segment.addAnnotation(key, value)
    }
  }
}
