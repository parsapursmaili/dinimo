import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostByUrl, getComments } from "./action";
import myImageLoader from "@/app/components/image-loader";
import ArticleRenderer from "@/app/components/ArticleRenderer";
import { Tags, MessageSquare } from "lucide-react"; // CalendarDays و Eye حذف شدند
import CommentForm from "./CommentForm";
import CommentsList from "./CommentsList";
import PostStats from "./PostStats"; // کامپوننت جدید جایگزین PostViewTracker شد

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const post = await getPostByUrl(params.url);

  if (!post) {
    return {
      title: "پست یافت نشد",
    };
  }

  const imageUrl = post.thumbnail
    ? post.thumbnail.startsWith("http")
      ? post.thumbnail
      : `${process.env.NEXT_PUBLIC_SITE_URL}${post.thumbnail}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/placeholder.jpg`;

  const siteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${params.url}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags ? post.tags.split(",").map((tag) => tag.trim()) : [],
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: siteUrl,
      siteName: "دینیمو",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "fa_IR",
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: ["دینیمو"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [imageUrl],
      creator: "@YourTwitterHandle",
    },
  };
}

export default async function SinglePostPage({ params }) {
  const post = await getPostByUrl(params.url);
  if (!post) {
    notFound();
  }

  const comments = await getComments(post.id);

  const countComments = (commentList) => {
    let count = commentList.length;
    for (const comment of commentList) {
      if (comment.replies && comment.replies.length > 0) {
        count += countComments(comment.replies);
      }
    }
    return count;
  };
  const totalCommentsCount = countComments(comments);

  const postDate = new Date(post.date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categories = post.categories
    ? post.categories.split(",").map((c) => c.trim())
    : [];

  return (
    <>
      {/* PostViewTracker حذف شد */}

      <div className="relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10 animate-gradient-x z-0" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-40 animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-30 animate-pulse-slower" />

        <div className="relative z-10 py-12 md:py-20">
          <article className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 rounded-3xl bg-secondary/40 backdrop-blur-2xl border border-secondary/50 shadow-[0_0_30px_rgba(0,255,255,0.15)]">
            <header className="flex flex-col items-center text-center py-12">
              {categories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs font-semibold uppercase tracking-wider bg-accent/10 text-accent px-4 py-1.5 rounded-full border border-accent/30 shadow-sm transition-all duration-300 hover:bg-accent/30 hover:shadow-[0_0_8px_var(--accent)]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-foreground leading-tight mb-6 drop-shadow-[0_0_12px_rgba(0,255,255,0.25)]">
                {post.title}
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto">
                {post.description}
              </p>

              {/* کامپوننت جدید PostStats جایگزین این بخش شد */}
              <PostStats
                initialViews={post.view}
                postId={post.id}
                postDate={postDate}
              />
            </header>

            <div className="w-full aspect-video relative rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_25px_rgba(0,255,255,0.25)] backdrop-blur-xl bg-primary/5 transform transition-transform duration-500 hover:scale-[1.02] mb-12">
              <Image
                loader={myImageLoader}
                src={post.thumbnail || "/placeholder.jpg"}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 90vw"
                priority
              />
            </div>

            <main className="max-w-3xl mx-auto prose prose-lg dark:prose-invert leading-relaxed mb-0">
              <ArticleRenderer content={post.content} />
            </main>

            <hr className="border-secondary/40 my-8" />

            {post.tags && (
              <footer className="max-w-3xl mx-auto pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Tags className="w-6 h-6 text-accent" />
                  <h3 className="font-semibold text-lg text-foreground/90">
                    تگ‌های مرتبط:
                  </h3>
                  {post.tags.split(",").map((tag) => (
                    <span
                      key={tag.trim()}
                      className="bg-secondary/60 text-foreground/90 px-4 py-2 rounded-full text-sm font-medium border border-secondary/80 transition-all duration-300 hover:bg-secondary/80 hover:text-primary hover:shadow-[0_0_10px_var(--primary)] cursor-pointer"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </footer>
            )}

            <section id="comments" className="max-w-3xl mx-auto py-8 mt-6">
              <div className="flex items-center gap-4 mb-8">
                <MessageSquare className="w-8 h-8 text-primary drop-shadow-[0_0_8px_var(--primary)]" />
                <h2 className="text-2xl font-bold text-foreground drop-shadow-[0_0_8px_var(--primary-rgb,0_255,255_/_0.3)]">
                  {totalCommentsCount > 0
                    ? `${new Intl.NumberFormat("fa-IR").format(
                        totalCommentsCount
                      )} دیدگاه`
                    : "دیدگاه‌ها"}
                </h2>
              </div>

              {comments && comments.length > 0 ? (
                <div className="mb-10">
                  <CommentsList
                    comments={comments}
                    postInfo={{ postId: post.id, postUrl: params.url }}
                  />
                </div>
              ) : (
                <div className="text-center py-6 mb-8 text-foreground/60 bg-secondary/20 rounded-xl border border-secondary/50">
                  <p>
                    هنوز دیدگاهی برای این پست ثبت نشده است. اولین نفر باشید!
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground/90 drop-shadow-[0_0_8px_var(--primary-rgb,0_255,255_/_0.2)]">
                  دیدگاه خود را بنویسید
                </h3>
                <CommentForm postId={post.id} postUrl={params.url} />
              </div>
            </section>
          </article>
        </div>
      </div>
    </>
  );
}
