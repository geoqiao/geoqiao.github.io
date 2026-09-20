"""Build Geo's catalog and product pages with the pinned escaping components.

This is site-owned composition, not a compiler plugin or a built-in Theme API.
One complete SiteModel and RouteRegistry reach rendering and artifact validation.
"""

from __future__ import annotations

import argparse
import os
from collections.abc import Callable, Sequence
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from pathlib import Path
from typing import Self

import yaml
from github import GithubException
from jinja2 import TemplateError
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from escaping.artifact_validation import SiteArtifactValidator
from escaping.build_result import Diagnostic
from escaping.config import (
    Link,
    LocalThemeConfig,
    ProjectCatalogEntry,
    Settings,
    read_config_overrides,
    security_from_config,
)
from escaping.content_compiler import ContentCompiler
from escaping.models.issue_snapshot import IssueSnapshot
from escaping.models.projects import (
    Project,
    ProjectCompilationResult,
    ProjectLink,
    ProjectsPage,
)
from escaping.models.site import SiteModel
from escaping.output_staging import OutputStagingError, OutputStagingService
from escaping.projects import ProjectCompiler, ProjectEnrichment
from escaping.routes import Route, RouteRegistry
from escaping.services.github_service import GitHubService
from escaping.services.render_service import RenderService
from escaping.site_builder import SiteBuilder
from escaping.site_inputs import resolve_settings
from escaping.theme import LoadedTheme, ThemeLoader


class CatalogEntry(ProjectCatalogEntry):
    repository: str = ""
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=1)
    website: str = ""

    @field_validator("repository")
    @classmethod
    def validate_repository(cls, v: str) -> str:
        return super().validate_repository(v) if v else v

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str) -> str:
        if value:
            Link(name="Website", url=value)
            if not value.startswith("https://"):
                raise ValueError("project website must use HTTPS")
        return value

    @model_validator(mode="after")
    def require_destination(self) -> Self:
        if not self.repository and not self.website:
            raise ValueError("project requires a public repository or website")
        return self


class ProjectCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")
    projects: tuple[CatalogEntry, ...]

    @model_validator(mode="after")
    def unique_slugs(self) -> Self:
        if len({p.slug for p in self.projects}) != len(self.projects):
            raise ValueError("duplicate project slug")
        return self


@dataclass(frozen=True)
class ProjectPage:
    project: Project
    route: Route
    template_name: str


@dataclass(frozen=True)
class GeoSiteModel(SiteModel):
    project_pages: tuple[ProjectPage, ...] = ()


def compile_site(
    settings: Settings,
    snapshots: Sequence[IssueSnapshot],
    catalog: ProjectCatalog,
    *,
    enrich: Callable[[str], ProjectEnrichment] | None = None,
) -> GeoSiteModel:
    if settings.theme.source != "local" or settings.theme.name != "Geo":
        raise ValueError("this build entry point belongs to the local Geo theme")
    if settings.projects:
        raise ValueError(
            "Geo's complete project catalog belongs in theme/projects.yaml"
        )
    routes = RouteRegistry(str(settings.site.url))
    content = ContentCompiler(settings, route_registry=routes).compile(snapshots)
    compiled = ProjectCompiler(enrich).compile(
        [p for p in catalog.projects if p.repository], route=routes.projects()
    )
    repository_projects = {p.slug: p for p in compiled.page.projects}
    pages = []
    for entry in sorted(catalog.projects, key=lambda p: (p.order, p.slug)):
        route = routes.register(
            f"project-{entry.slug}",
            f"/projects/{entry.slug}/",
            f"projects/{entry.slug}/index.html",
        )
        project = repository_projects.get(entry.slug)
        if project is None:
            fallback = entry.fallback_metadata
            project = Project(
                slug=entry.slug,
                title=entry.title,
                repository="",
                summary=entry.summary,
                url=entry.website,
                featured=entry.featured,
                order=entry.order,
                image=entry.image,
                language=fallback.language if fallback else None,
                topics=tuple(fallback.topics or ()) if fallback else (),
                links=tuple(ProjectLink(link.name, link.url) for link in entry.links),
            )
        project = replace(project, url=route.canonical_path)
        pages.append(ProjectPage(project, route, f"projects/{entry.slug}.html"))
    projects = tuple(page.project for page in pages)
    site = SiteBuilder(settings, routes).build(
        content,
        ProjectCompilationResult(
            ProjectsPage(
                projects, tuple(p for p in projects if p.featured), routes.projects()
            ),
            compiled.diagnostics,
        ),
        build_start_time=datetime.now(UTC),
    )
    return GeoSiteModel(**vars(site), project_pages=tuple(pages))


def render_site(site: GeoSiteModel, theme: LoadedTheme) -> dict[str, str]:
    artifacts = RenderService(theme).render_site(site)
    environment = theme.environment()
    page_routes = {p.project.slug: p.route for p in site.project_pages}
    for page in site.project_pages:
        artifacts[page.route.output_path] = environment.get_template(
            page.template_name
        ).render(
            project=page.project,
            page_canonical_url=page.route.canonical_url,
            theme_path=site.metadata.theme.asset_path,
            metadata=site.metadata,
            projects_route=site.projects.route,
            page_routes=page_routes,
        )
    return artifacts


def publish_site(
    site: GeoSiteModel,
    theme: LoadedTheme,
    config_root: Path,
    output: str | Path,
) -> tuple[Diagnostic, ...]:
    errors = [d for d in site.diagnostics if d.severity == "error"]
    if errors:
        raise ValueError("; ".join(f"{d.code}: {d.message}" for d in errors))
    staging = OutputStagingService(output, config_root)
    candidate = staging.create_staging_directory()
    try:
        theme.copy_assets(candidate)
        for name, text in render_site(site, theme).items():
            target = (candidate / name).resolve()
            target.relative_to(candidate)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
        diagnostics = SiteArtifactValidator(site).validate(candidate)
        if any(d.severity == "error" for d in diagnostics):
            raise ValueError("; ".join(f"{d.code}: {d.message}" for d in diagnostics))
    except Exception:
        staging.cleanup(candidate)
        raise
    try:
        return (*site.diagnostics, *diagnostics, *staging.publish(candidate))
    except OutputStagingError as exc:
        if not exc.recovery_paths:
            staging.cleanup(candidate)
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the site-owned Geo theme")
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    config = args.config.expanduser().absolute()
    try:
        overrides = read_config_overrides(config)
        security = security_from_config(overrides)
        token = os.environ.get(security.token_env)
        if not token:
            raise ValueError(f"missing token environment: {security.token_env}")
        github = GitHubService(token)
        settings, input_diagnostics = resolve_settings(overrides, github_service=github)
        if (
            not isinstance(settings.theme, LocalThemeConfig)
            or settings.theme.name != "Geo"
        ):
            raise ValueError("this build entry point requires the local Geo theme")
        catalog = ProjectCatalog.model_validate(
            yaml.safe_load(
                (config.parent / settings.theme.path / "projects.yaml").read_text(
                    encoding="utf-8"
                )
            )
        )
        snapshots = github.fetch_issue_snapshots(github.get_repo(settings.github.repo))

        def enrich(name: str) -> ProjectEnrichment:
            repository = github.get_repo(name)
            return ProjectEnrichment(
                stars=repository.stargazers_count,
                forks=repository.forks_count,
                language=repository.language,
                topics=tuple(repository.get_topics()),
                name=repository.name,
                description=repository.description,
            )

        site = compile_site(settings, snapshots, catalog, enrich=enrich)
        diagnostics = publish_site(
            site,
            ThemeLoader(config.parent).load(settings.theme),
            config.parent,
            settings.paths.output,
        )
        for diagnostic in (*input_diagnostics, *diagnostics):
            print(f"{diagnostic.severity}: {diagnostic.code}: {diagnostic.message}")
        print(
            f"Geo built: {len(site.project_pages)} product pages, {len(site.blogs)} posts."
        )
    except GithubException:
        parser.exit(1, "Geo build failed: GitHub source fetch failed.\n")
    except (
        OSError,
        ValueError,
        RuntimeError,
        TemplateError,
        OutputStagingError,
    ) as exc:
        parser.exit(1, f"Geo build failed: {exc}\n")


if __name__ == "__main__":
    main()
