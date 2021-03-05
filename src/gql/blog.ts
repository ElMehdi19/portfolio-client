import { gql } from '@apollo/client';

export const getBlogs = gql`
    query {
        blogPostCollection {
            total
            items {
                routeId
                title
                summary
                readTime
                sys {
                    id
                    firstPublishedAt
                }
            }
        }
    }
`;


export const getBlogByRoute = gql`
    query blogPostByRoute($route: String!){
        blogPostCollection(where: { routeId: $route }){
            items {
                title
                readTime
                content {
                    json
                }
                tags
                github
                references
                sys {
                    id
                    firstPublishedAt
                }
            }
        }
    }
`;

export const getBlogAssets = gql`
   query blogAssets($id: String!){
       blogPost(id: $id){
           content {
               links {
                   assets {
                       block {
                           url
                           sys {
                               id
                           }
                       }
                   }
               }
           }
       }
   } 
`;