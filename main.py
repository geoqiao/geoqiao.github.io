"""github-blog generator:

`python main.py <github_token> <github_repo>`

Read issues from GitHub and generate HTML articles.

Powered by Jinja2 and PyGithub
"""

import argparse
import os
import shutil

from feedgen.feed import FeedGenerator
from github import Github
from github.Issue import Issue
from github.PaginatedList import PaginatedList
from github.Repository import Repository
from jinja2 import Environment, FileSystemLoader
from lxml.etree import CDATA
from marko import Markdown

CONTENTS_DIR: str = "./contents/"
BACKUP_DIR: str = "./backup/"


def main(token: str, repo_name: str):
    dir_init(content_dir=CONTENTS_DIR, backup_dir=BACKUP_DIR)
    user = login(token)
    me = get_me(user)
    repo = get_repo(user, repo_name)
    issues = get_all_issues(repo, me)

    index_blog = render_blog_index(issues)
    save_blog_index_as_html(content=index_blog)

    for issue in issues:
        content = render_issue_body(issue)
        save_articles_to_content_dir(issue, content=content)

    gen_rss_feed(issues)


def dir_init(content_dir: str, backup_dir: str):
    """
    A function to initialize directories by removing existing ones and creating new ones.
    """
    if os.path.exists(content_dir):
        shutil.rmtree(content_dir)
    if os.path.exists(backup_dir):
        shutil.rmtree(backup_dir)

    os.mkdir(content_dir)
    os.mkdir(content_dir + "blog/")
    os.mkdir(backup_dir)


def login(token: str):
    return Github(token)


def get_me(user: Github):
    return user.get_user().login


def get_repo(user: Github, repo: str):
    return user.get_repo(repo)


def is_me(issue: Issue, me: str):
    return issue.user.login == me


def get_all_issues(repo: Repository, me: str) -> PaginatedList[Issue]:
    """Get all issues for a given GitHub repository.

    Args:
        github_token: GitHub personal access token.
        github_repo: GitHub repository name in the format "owner/name".

    Returns:
        List of GitHub issue objects.
    """
    issues = repo.get_issues(creator=me)
    return issues


def render_blog_index(issues: PaginatedList[Issue]) -> str:
    """
    A function that renders an article list using a provided list of issues.

    Parameters:
    - issues: PaginatedList, a paginated list of issues to render in the article list.

    Returns:
    - str, the rendered article list HTML content.
    """
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("index.html")
    return template.render(issues=issues)


def save_blog_index_as_html(content: str):
    """
    Save the provided content as an HTML file at the specified path.

    Parameters:
    content (str): The content to be written to the HTML file.
    """
    path = CONTENTS_DIR + "index.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


# def markdown2html(mdstr: str):
#     """
#     Convert markdown text to HTML using the GitHub API.

#     Args:
#         mdstr (str): The markdown text to be converted to HTML.

#     Returns:
#         str: The HTML representation of the input markdown text.
#     """
#     payload = {"text": mdstr, "mode": "gfm"}
#     headers = {"Authorization": f"token {options.github_token}"}
#     try:
#         response = requests.post(
#             "https://api.github.com/markdown", json=payload, headers=headers
#         )
#         response.raise_for_status()  # Raises an exception if status code is not 200
#         return response.text
#     except requests.RequestException as e:
#         raise Exception(f"markdown2html error: {e}")


# def markdown2html(mdstr: str):
#     html = gfm.convert(mdstr)
#     return html


def markdown2html(mdstr: str):
    markdown = Markdown(extensions=["pangu"])
    html = markdown.convert(mdstr)
    return html


def render_issue_body(issue: Issue):
    """
    Render the body of an issue by converting markdown to HTML and injecting it into a template.

    Parameters:
    issue (Issue): The issue object containing the body to render.

    Returns:
    str: The rendered HTML body of the issue.
    """
    html_body = markdown2html(issue.body)
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("post.html")
    return template.render(issue=issue, html_body=html_body)


def save_articles_to_content_dir(issue: Issue, content: str):
    path = CONTENTS_DIR + f"blog/{issue.number}.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def gen_rss_feed(issues: PaginatedList[Issue]):
    fg = FeedGenerator()
    fg.id("https://geoqiao.github.io/contents")
    fg.title("GeoQiao's Blog")
    fg.author({"name": "GeoQiao", "email": "geoqiao@example.com"})
    fg.link(href="https://geoqiao.github.io/contents", rel="alternate")
    fg.description("This is GeoQiao's Blog")

    for issue in issues:
        fe = fg.add_entry()
        fe.id(f"https://geoqiao.github.io/contents/blog/{issue.number}.html")
        fe.title(issue.title)
        fe.link(href=f"https://geoqiao.github.io/contents/blog/{issue.number}.html")
        fe.description(issue.body[:100])
        fe.published(issue.created_at)
        # fe.content(markdown2html(issue.body), type="html")
        fe.content(CDATA(markdown2html(issue.body)), type="html")

    fg.atom_file("./contents/atom.xml")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("github_token", help="<github_token>")
    parser.add_argument("github_repo", help="<github_repo>")
    options = parser.parse_args()

    main(options.github_token, options.github_repo)
