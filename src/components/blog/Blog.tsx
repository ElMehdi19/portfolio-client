import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFetch } from "../../hooks";
import BlogSummary from "./Summary";
import { Main } from "../../styles/Main";

type Post = {
  id: number;
  title: string;
  body: string;
  // tags: string[];
  posted: string;
};

const Blog: React.FC = () => {
  const [total, setTotal] = useState<number>(0);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [perPage] = useState<number>(2);
  const [, setPageNum] = useState<number>(0);
  const fetchPosts = useFetch<{ total: number; blogs: Post[] }>("blogs");

  const observer = useRef<any>();
  const lastPostRef = useCallback(
    (node: HTMLElement) => {
      if (observer && observer.current) {
        observer.current!.disconnect();
      }
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPageNum((pageNum) => pageNum + 1);
          setPosts([
            ...posts,
            ...allPosts.slice(posts.length, posts.length + perPage),
          ]);
        }
      });
      if (node) {
        observer.current.observe(node);
      }
    },
    // eslint-disable-next-line
    [total]
  );

  useEffect(() => {
    document.title = "EMR - Blog";
    const postsList = async () => {
      const list = await fetchPosts;
      if (!list) return null;
      const { total, blogs } = list;
      setTotal(total);
      setPosts(blogs.slice(0, perPage));
      setAllPosts(blogs);
    };
    postsList();
    // eslint-disable-next-line
  }, []);

  useEffect(() => setTotal(allPosts.length - posts.length), [allPosts, posts]);

  return (
    <Main width="800px">
      <section className="blogs">
        {posts &&
          posts.map((post, index) => {
            if (posts.length === index + 1) {
              return (
                <BlogSummary {...post} key={post.id} myRef={lastPostRef} />
              );
            }
            return <BlogSummary {...post} key={post.id} />;
          })}
      </section>
    </Main>
  );
};

export default Blog;
