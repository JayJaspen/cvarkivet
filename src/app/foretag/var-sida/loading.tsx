import { SkeletonKort, SkeletonSidhuvud } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <SkeletonSidhuvud />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SkeletonKort rader={1} />
        <SkeletonKort rader={1} />
        <SkeletonKort rader={1} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonKort rader={8} />
        </div>
        <SkeletonKort rader={6} />
      </div>
    </>
  );
}
