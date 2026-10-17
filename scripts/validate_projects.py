import json
import subprocess
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
PROJECTS_FILE = ROOT / "projects.json"
PROJECT_TYPES = {"Personnel", "Universitaire"}
LEGACY_FIELDS = {"title", "description", "image", "tags", "date", "links"}
CURRENT_FIELDS = {
    "title",
    "description",
    "image",
    "type",
    "tools_used",
    "themes",
    "date",
    "links",
}


class ValidationError(Exception):
    pass


def fail(message):
    raise ValidationError(message)


def staged_projects():
    result = subprocess.run(
        ["git", "show", ":projects.json"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        fail("projects.json must be added to Git before it can be validated.")
    return result.stdout


def check_file(relative_path, location, staged):
    normalized = relative_path.replace("\\", "/")
    path = PurePosixPath(normalized)
    if path.is_absolute() or not normalized or ".." in path.parts:
        fail(f"{location}: invalid or unsafe file path {relative_path!r}.")

    if staged:
        result = subprocess.run(
            [
                "git",
                "--literal-pathspecs",
                "ls-files",
                "--error-unmatch",
                "--",
                normalized,
            ],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        exists = result.returncode == 0
    else:
        target = ROOT.joinpath(*path.parts)
        exists = target.is_file()

    if not exists:
        context = "staged in Git" if staged else "present on disk"
        fail(f"{location}: {normalized!r} does not exist ({context}).")


def check_image(image, project_number, staged):
    images = image if isinstance(image, list) else [image]
    if not images:
        fail(f"Project {project_number}: image must not be an empty array.")

    for image_path in images:
        if not isinstance(image_path, str) or not image_path.strip():
            fail(f"Project {project_number}: image paths must be non-empty strings.")
        if "?" in image_path or "#" in image_path:
            fail(f"Project {project_number}: image paths cannot contain a query or fragment.")
        check_file(
            f"assets/images/{image_path}",
            f"Project {project_number} image",
            staged,
        )


def check_links(links, project_number, staged):
    if links is None:
        return
    if not isinstance(links, list):
        fail(f"Project {project_number}: links must be an array or null.")

    for link_number, link in enumerate(links, start=1):
        location = f"Project {project_number} link {link_number}"
        if not isinstance(link, dict):
            fail(f"{location}: expected an object.")
        for field in ("url", "label"):
            if not isinstance(link.get(field), str) or not link[field].strip():
                fail(f"{location}: {field} must be a non-empty string.")
        if set(link) != {"url", "label"}:
            fail(f"{location}: only url and label properties are allowed.")

        url = link["url"].strip()
        try:
            parsed = urlsplit(url)
        except ValueError as error:
            fail(f"{location}: invalid URL: {error}")
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue

        local_path = unquote(parsed.path).lstrip("/")
        check_file(local_path, location, staged)


def check_project(project, project_number, staged):
    if not isinstance(project, dict):
        fail(f"Project {project_number}: expected an object.")

    legacy = "tags" in project and not (
        {"type", "tools_used", "themes"} & set(project)
    )
    allowed_fields = LEGACY_FIELDS if legacy else CURRENT_FIELDS
    missing = allowed_fields - set(project)
    extra = set(project) - allowed_fields
    if missing:
        fail(
            f"Project {project_number}: missing required field(s): "
            f"{', '.join(sorted(missing))}."
        )
    if extra:
        fail(
            f"Project {project_number}: unexpected field(s): "
            f"{', '.join(sorted(extra))}."
        )

    for field in ("title", "description", "date"):
        if not isinstance(project[field], str) or not project[field].strip():
            fail(f"Project {project_number}: {field} must be a non-empty string.")

    if legacy:
        tags = project["tags"]
        if not isinstance(tags, list) or not tags or any(
            not isinstance(tag, str) or not tag.strip() for tag in tags
        ):
            fail(f"Project {project_number}: tags must be a non-empty string array.")
    else:
        if (
            not isinstance(project["type"], str)
            or project["type"] not in PROJECT_TYPES
        ):
            fail(
                f"Project {project_number}: type must be one of "
                f"{', '.join(sorted(PROJECT_TYPES))}."
            )
        for field in ("tools_used", "themes"):
            values = project[field]
            if not isinstance(values, list) or not values or any(
                not isinstance(value, str) or not value.strip() for value in values
            ):
                fail(
                    f"Project {project_number}: {field} must be a non-empty "
                    "string array."
                )

    check_image(project["image"], project_number, staged)
    check_links(project["links"], project_number, staged)


def main():
    staged = len(sys.argv) == 2 and sys.argv[1] == "--staged"
    if len(sys.argv) > 2 or (len(sys.argv) == 2 and not staged):
        fail("Usage: py -3 scripts/validate_projects.py [--staged]")

    content = staged_projects() if staged else PROJECTS_FILE.read_text(encoding="utf-8")
    try:
        projects = json.loads(content)
    except json.JSONDecodeError as error:
        fail(f"projects.json is not valid JSON: {error}")

    if not isinstance(projects, list) or not projects:
        fail("projects.json must contain a non-empty array.")

    for number, project in enumerate(projects, start=1):
        check_project(project, number, staged)

    data_source = "staged projects.json" if staged else "projects.json"
    print(f"Validated {len(projects)} projects in {data_source}; all referenced files exist.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, UnicodeError, ValidationError) as error:
        print(f"Project validation failed: {error}", file=sys.stderr)
        sys.exit(1)
