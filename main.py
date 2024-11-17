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

from feedgen.feed import FeedGenerator  # type: ignore
from github import Github
from github.Issue import Issue
from github.PaginatedList import PaginatedList
from github.Repository import Repository
from jinja2 import Environment, FileSystemLoader
from lxml.etree import CDATA  # type: ignore
from marko import Markdown

from configs.config_utils import Config

config = Config()


def main(token: str, repo_name: str):
    dir_init(content_dir=config.content_dir, blog_dir=config.blog_dir)
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


def dir_init(content_dir: Path, blog_dir: Path):
    """
    A function to initialize directories by removing existing ones and creating new ones.
    """
    if os.path.exists(content_dir):
        shutil.rmtree(content_dir)

    os.mkdir(content_dir)
    os.mkdir(content_dir / blog_dir)


def login(token: str) -> Github:
    """
    Authenticate with GitHub using a token and return a Github instance.

    Args:
        token (str): A GitHub personal access token.

    Returns:
        Github: An authenticated Github instance.
    """
    return Github(token)


def get_me(user: Github) -> str:
    """
    Get the login name of the authenticated user.

    Args:
        user (Github): An authenticated Github instance.

    Returns:
        str: The login name of the authenticated user.
    """
    return user.get_user().login


def get_repo(user: Github, repo_name: str) -> Repository:
    """
    Get a repository by name for a given authenticated user.

    Args:
        user (Github): An authenticated Github instance.
        repo_name (str): The name of the repository to retrieve.

    Returns:
        Repository: A Github repository object.
    """
    return user.get_repo(repo_name)


def is_me(issue: Issue, me: str) -> bool:
    """
    Check if an issue was created by the authenticated user.

    Args:
        issue (Issue): The issue to check.
        me (str): The login name of the authenticated user.

    Returns:
        bool: True if the issue was created by the authenticated user, False otherwise.
    """
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
    path = config.content_dir / "index.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def markdown2html(mdstr: str) -> str:
    markdown = Markdown(extensions=["pangu"])
    html = markdown.convert(mdstr)
    return html


def render_issue_body(issue: Issue) -> str:
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
    path = config.content_dir / config.blog_dir / f"{issue.number}.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def gen_rss_feed(issues: PaginatedList[Issue]):
    """Generate an RSS feed for the given issues.

    Args:
        issues (PaginatedList): A paginated list of GitHub issue objects.

    Returns:
        None
    """
    fg = FeedGenerator()
    fg.id(config.blog_url)  # type: ignore
    fg.title(config.blog_title)  # type: ignore
    fg.author({"name": config.author_name, "email": config.author_email})  # type: ignore
    fg.link(href=config.blog_url, rel="alternate")  # type: ignore
    fg.description(f"""{config.meta_description}""")  # type: ignore

    for issue in issues:
        fe = fg.add_entry()  # type: ignore
        fe.id(f"{config.blog_url}{config.blog_dir}/{issue.number}.html")  # type: ignore
        fe.title(issue.title)  # type: ignore
        fe.link(href=f"{config.blog_url}{config.blog_dir}/{issue.number}.html")  # type: ignore
        fe.description(issue.body[:100])  # type: ignore
        fe.published(issue.created_at)  # type: ignore
        fe.updated(issue.updated_at)  # type: ignore
        fe.content(CDATA(markdown2html(issue.body)), type="html")  # type: ignore

    fg.atom_file(config.content_dir / config.rss_atom_path)  # type: ignore


@contextmanager
def timer_context():
    """
    A context manager that measures the execution time of the code within its scope.

    This context manager starts a timer when entering the context and stops the timer when exiting the context. It then prints the elapsed time in seconds.

    Usage:
    with timer_context():
        # Code to measure execution time
    """
    start_time = time.perf_counter()
    yield
    end_time = time.perf_counter()
    print(f"The script has finished running, and it took {end_time - start_time} s。")


if __name__ == "__main__":
    with timer_context():
        parser = argparse.ArgumentParser()
        parser.add_argument("github_token", help="<github_token>")
        parser.add_argument("github_repo", help="<github_repo>")
        options = parser.parse_args()

        main(options.github_token, options.github_repo)
