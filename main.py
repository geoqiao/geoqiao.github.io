"""github-blog generator:

`python main.py <github_token> <github_repo>`

Read issues from GitHub and generate HTML articles.

Powered by Jinja2 and PyGithub
"""

import argparse
import os
import shutil
import time
from contextlib import contextmanager
from pathlib import Path

from feedgen.feed import FeedGenerator
from github import Github
from github.Issue import Issue
from github.PaginatedList import PaginatedList
from github.Repository import Repository
from jinja2 import Environment, FileSystemLoader
from lxml.etree import CDATA
from marko import Markdown

from configs.config_utils import Config

CONTENTS_DIR: Path = Path("./contents/")
BACKUP_DIR: Path = Path("./backup/")

config = Config()


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


def dir_init(content_dir: Path, backup_dir: Path):
    """
    A function to initialize directories by removing existing ones and creating new ones.
    """
    if os.path.exists(content_dir):
        shutil.rmtree(content_dir)
    if os.path.exists(backup_dir):
        shutil.rmtree(backup_dir)

    os.mkdir(content_dir)
    os.mkdir(content_dir / "blog/")
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
    """Get all issues for a given GitHub repository created by a specific user.

    Args:
        repo: The GitHub repository object to retrieve issues from.
        me: The username of the user whose issues to retrieve.

    Returns:
        A PaginatedList of GitHub issue objects created by the specified user.
    """
    issues = repo.get_issues(creator=me)  # type: ignore
    return issues


def render_blog_index(issues: PaginatedList[Issue]) -> str:
    """
    A function that renders an article list using a provided list of issues.

    Parameters:
    - issues: PaginatedList, a paginated list of issues to render in the article list.

    Returns:
    - str, the rendered article list HTML content.
    """
    blog_title = config.blog_title
    github_name = config.github_name
    meta_description = config.meta_description
    theme_path = config.theme_path
    google_search_verification = config.google_search_verification
    env = Environment(loader=FileSystemLoader(theme_path))
    template = env.get_template("index.html")

    return template.render(
        issues=issues,
        blog_title=blog_title,
        github_name=github_name,
        meta_description=meta_description,
        google_search_verification=google_search_verification,
    )


def save_blog_index_as_html(content: str):
    """
    Save the provided content as an HTML file at the specified path.

    Parameters:
    content (str): The content to be written to the HTML file.
    """
    path = CONTENTS_DIR / "index.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def markdown2html(mdstr: str) -> str:
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
    blog_title = config.blog_title
    github_name = config.github_name
    meta_description = config.meta_description
    theme_path = config.theme_path
    env = Environment(loader=FileSystemLoader(theme_path))
    template = env.get_template("post.html")
    return template.render(
        issue=issue,
        html_body=html_body,
        blog_title=blog_title,
        github_name=github_name,
        meta_description=meta_description,
    )


def save_articles_to_content_dir(issue: Issue, content: str):
    path = CONTENTS_DIR / f"blog/{issue.number}.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def gen_rss_feed(issues: PaginatedList[Issue]):
    fg = FeedGenerator()
    fg.id("https://geoqiao.github.io/contents")
    fg.title("GeoQiao's Blog")
    fg.author({"name": "GeoQiao", "email": "geoqiao@example.com"})
    fg.link(href="https://geoqiao.github.io/contents", rel="alternate")
    fg.description(f"""{config.meta_description}""")

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


@contextmanager
def timer_context():
    start_time = time.time()
    yield
    end_time = time.time()
    print(f"The script has finished running, and it took {end_time - start_time} s。")


if __name__ == "__main__":
    with timer_context():
        parser = argparse.ArgumentParser()
        parser.add_argument("github_token", help="<github_token>")
        parser.add_argument("github_repo", help="<github_repo>")
        options = parser.parse_args()

        main(options.github_token, options.github_repo)
