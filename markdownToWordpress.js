const matter = require("gray-matter");
const { marked } = require("marked");

function formatDate(date) {
  return date instanceof Date && !isNaN(date)
    ? date.toISOString().replace("T", " ").substring(0, 19)
    : "1986-01-01 00:00:00"; // Fallback default date
}

function template({ posts }) {
  return `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0"
        xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
        xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:wfw="http://wellformedweb.org/CommentAPI/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:wp="http://wordpress.org/export/1.2/"
    >
    <channel>
        <title>Markdown to Wordpress</title>
        <link>https://example.org/</link>
        <description>Converted Markdown Posts</description>
        <pubDate>${new Date().toUTCString()}</pubDate>
        <language>en-US</language>
        <wp:wxr_version>1.2</wp:wxr_version>

        <wp:author>
            <wp:author_id>1</wp:author_id>
            <wp:author_login><![CDATA[importer]]></wp:author_login>
            <wp:author_email><![CDATA[importer@example.org]]></wp:author_email>
            <wp:author_display_name><![CDATA[importer]]></wp:author_display_name>
        </wp:author>

        ${posts
          .map(
            (post, i) => `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <link>https://example.org/${post.slug}</link>
            <pubDate>${post.date.toUTCString()}</pubDate>
            <dc:creator><![CDATA[${post.author}]]></dc:creator>
            <guid isPermaLink="false">https://example.org/?p=${i}</guid>
            <description><![CDATA[${post.excerpt}]]></description>
            <content:encoded><![CDATA[${marked(
              (post.image ? `![](${post.image})\n\n` : "") + post.content
            )}]]></content:encoded>
            <wp:post_id>${i}</wp:post_id>
            <wp:post_date><![CDATA[${formatDate(post.date)}]]></wp:post_date>
            <wp:post_date_gmt><![CDATA[${formatDate(post.date)}]]></wp:post_date_gmt>
            <wp:post_modified><![CDATA[${formatDate(post.updated)}]]></wp:post_modified>
            <wp:post_modified_gmt><![CDATA[${formatDate(post.updated)}]]></wp:post_modified_gmt>
            <wp:post_name><![CDATA[${post.slug}]]></wp:post_name>
            <wp:status><![CDATA[publish]]></wp:status>
            <wp:post_parent>0</wp:post_parent>
            <wp:menu_order>0</wp:menu_order>
            <wp:post_type><![CDATA[post]]></wp:post_type>
            ${(post.tags || [])
              .map(
                (tag) => `<category domain="post_tag" nicename="${tag}"><![CDATA[${tag}]]></category>`
              )
              .join("\n")}
        </item>`
          )
          .join("\n")}
    </channel>
    </rss>`;
}

function parseMatter(contentString) {
  try {
    return matter(contentString);
  } catch (e) {
    throw new Error(`Error parsing markdown frontmatter: ${e.message}`);
  }
}

module.exports = function markdownToWordpress({ fileArray }) {
  const posts = fileArray.map(({ path, slug, content }) => {
    const parsed = parseMatter(content);
    const frontmatter = parsed.data || {};

    let date = frontmatter.pubDatetime ? new Date(frontmatter.pubDatetime) : new Date();
    let updated = frontmatter.updated ? new Date(frontmatter.updated) : date;

    return {
      slug,
      title: frontmatter.title || slug,
      author: frontmatter.author || "admin",
      date,
      updated,
      content: parsed.content,
      excerpt: frontmatter.description ? frontmatter.description.trim() : "",
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    };
  });

  return template({ posts });
};