import { SegmentLike } from 'aws-xray-sdk-core'
import xray from 'aws-xray-sdk'
import ctx from '~/globals'

export type SegmentAnnotations = {
  [key: string]: boolean | string | number
}

export function annotateSegment(segment: SegmentLike, annotations: SegmentAnnotations): void {
  for (const [key, value] of Object.entries(annotations)) {
    if (value != undefined) {
      segment.addAnnotation(key, value)
    }
  }
}

export function annotateCurrentSegment(annotations: SegmentAnnotations): void {
  const seg = xray.getSegment()
  if (seg) {
    annotateSegment(seg, annotations)
  } else {
    ctx.logger.info('No segment (failed to annotate)')
  }
}
