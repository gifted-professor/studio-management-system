export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-xl font-semibold">页面未找到</h2>
      <p className="text-muted-foreground">您访问的页面不存在</p>
    </div>
  )
}