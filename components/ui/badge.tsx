import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

const badgeVariants = cva(
  'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 !text-[12px] font-semibold transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20 [a]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground bg-background [a]:hover:bg-accent [a]:hover:text-accent-foreground',
        ghost:
          'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'border-transparent text-foreground underline-offset-4 hover:underline bg-transparent px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  })
}

export { Badge, badgeVariants }
