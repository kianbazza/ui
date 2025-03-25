import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ResponsiveImageProps {
  src?: string
  lightSrc?: string
  darkSrc?: string
  alt: string
  caption?: string
  className?: string
  wrapperClassName?: string
  containerClassName?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  priority?: boolean
  quality?: number
  sizes?: string
}

export function ResponsiveImage({
  src,
  lightSrc,
  darkSrc,
  alt,
  caption,
  className,
  wrapperClassName,
  containerClassName,
  objectFit = 'contain',
  priority = false,
  quality,
  sizes = '100vw',
}: ResponsiveImageProps) {
  return (
    <div
      className={cn(
        'aspect-video flex flex-col gap-10 p-8 rounded-xl border border-border dark:bg-black bg-white',
        wrapperClassName,
      )}
    >
      <div className={cn('relative w-full h-full ', containerClassName)}>
        {src && (
          <Image
            src={src || '/placeholder.svg'}
            alt={alt || ''}
            className={cn(className)}
            style={{ objectFit }}
            fill
            priority={priority}
            quality={quality}
            sizes={sizes}
          />
        )}
        {lightSrc && darkSrc && (
          <>
            <Image
              src={lightSrc || '/placeholder.svg'}
              alt={alt || ''}
              className={cn('dark:hidden', className)}
              style={{ objectFit }}
              fill
              priority={priority}
              quality={quality}
              sizes={sizes}
            />
            <Image
              src={darkSrc || '/placeholder.svg'}
              alt={alt || ''}
              className={cn('hidden dark:block', className)}
              style={{ objectFit }}
              fill
              priority={priority}
              quality={quality}
              sizes={sizes}
            />
          </>
        )}
      </div>
      {caption && (
        <span className="text-sm text-muted-foreground text-center">
          {caption}
        </span>
      )}
    </div>
  )
}
