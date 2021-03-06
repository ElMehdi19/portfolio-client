import React, { useState, useEffect, useContext } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import {
  documentToReactComponents,
  Options,
} from "@contentful/rich-text-react-renderer";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { Document, INLINES } from "@contentful/rich-text-types";
import dayjs from "dayjs";
import { useLazyQuery, useQuery } from "@apollo/client";
import Highlighter from "react-syntax-highlighter";
import { getBlogAssets, getBlogByRoute, getCodeSnippets } from "../../gql/blog";
import { Main } from "../../styles/Main";
import {
  Asset,
  BlogPostAsset,
  CodeSnippets,
  Post,
  PostData,
} from "./interfaces";
import {
  getAssetsFromPost,
  getPostFromCollection,
  findAssetURL,
} from "./utils";
import highlighter from "../../styles/highlighter";
import { globalContext } from "../../store/globalContext";
import { FaGithub } from "react-icons/fa";

type BlogPostCollection = {
  blogPostCollection: { items: PostData[] };
};

type BlogPostWithAssets = {
  blogPost: BlogPostAsset;
};

type BlogPostSnippetsItems = {
  language: string;
  sys: {
    id: string;
  };
  snippets: {
    json: Document;
  };
};

type BlogPostsWithCode = {
  codeBlockCollection: { items: BlogPostSnippetsItems[] };
};

const BlogDetails: React.FC<RouteComponentProps<{ routeId: string }>> = ({
  match,
}) => {
  const { routeId } = match.params;
  const [post, setPost] = useState<Post>();
  const [exists, setExists] = useState<boolean>(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snippets, setSnippets] = useState<CodeSnippets[]>([]);
  const {
    globalState: { theme, menuToggle },
  } = useContext(globalContext);

  const { data, loading } = useQuery<BlogPostCollection>(getBlogByRoute, {
    variables: { route: routeId },
  });

  const [loadAssets, { data: assetsData }] =
    useLazyQuery<BlogPostWithAssets>(getBlogAssets);
  const [loadSnippets, { data: snippetsData }] =
    useLazyQuery<BlogPostsWithCode>(getCodeSnippets);

  const renderOptions: Options = {
    renderNode: {
      "embedded-asset-block": (node) => {
        const url = findAssetURL(assets, node);
        if (!url) return null;
        return (
          <div>
            <img src={url} alt="output" />
          </div>
        );
      },
      "embedded-entry-block": (node) => {
        const snippet = snippets.find(
          ({ id }) => node.data.target.sys.id === id
        );
        if (!snippet) return null;
        return (
          <Highlighter style={highlighter[theme]} language={snippet.language}>
            {documentToPlainTextString(snippet.content)}
          </Highlighter>
        );
      },
      [INLINES.HYPERLINK]: (node: any) => {
        if (!node || !node.data) return null;
        const { uri } = node.data;
        if (uri.startsWith(window.origin)) {
          const href = (uri as string).replace(window.origin, "");
          return (
            <Link className={`link-${theme}-mode`} to={href}>
              {node.content[0].value}
            </Link>
          );
        }
        return (
          <a
            href={uri}
            className={`link-${theme}-mode`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {node.content[0].value}
          </a>
        );
      },
    },
  };

  useEffect(() => {
    document.title = "EMR - Blog";
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!loading && data) {
      const {
        blogPostCollection: { items },
      } = data;
      const blogPost = getPostFromCollection(items, 0);
      if (!blogPost) {
        setExists(false);
        return;
      }
      setPost(blogPost);
    }
  }, [data, loading]);

  useEffect(() => {
    if (post) {
      loadAssets({ variables: { id: post.id } });
      loadSnippets({ variables: { tags: post.codeSnippetsTags } });
    }
    // eslint-disable-next-line
  }, [post]);

  useEffect(() => {
    if (assetsData && assetsData.blogPost) {
      const postAssets = getAssetsFromPost(assetsData.blogPost);
      if (!postAssets) return;
      setAssets(postAssets);
    }
  }, [assetsData]);

  useEffect(() => {
    if (!snippetsData || !snippetsData.codeBlockCollection) return;

    const { items } = snippetsData.codeBlockCollection;

    if (!items.length) return;

    const postSnippets: CodeSnippets[] = [];
    items.forEach(({ snippets, sys, language }) => {
      if (snippets) {
        const { id } = sys;
        const { json } = snippets;
        postSnippets.push({ id, content: json, language });
      }
    });

    setSnippets(postSnippets);
  }, [snippetsData]);

  if (!loading && !exists) return <h2>NOT FOUND</h2>;

  if (!post) return null;

  return (
    <Main width="800px" isHidden={menuToggle}>
      <header style={{ display: "flex" }}>
        <span style={{ flex: 3 }}>{post.title}</span>
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 5 }}>
          {post.github && (
            <a href={post.github} target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </a>
          )}
          <small className="date" style={{ fontSize: 12 }}>
            {dayjs(post!.firstPublishedAt).format("DD/MM/YYYY")}
          </small>
        </div>
      </header>
      {documentToReactComponents(post.content, renderOptions)}
    </Main>
  );
};

export default BlogDetails;
