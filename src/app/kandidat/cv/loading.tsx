import { SkeletonKort, SkeletonSidhuvud } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <SkeletonSidhuvud />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonKort rader={2} />
          <SkeletonKort rader={6} />
          <SkeletonKort rader={4} />
        </div>
        <SkeletonKort rader={4} />
      </div>
    </>
  );
}
