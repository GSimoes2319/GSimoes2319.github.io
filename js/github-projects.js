(function () {
  var config = window.PROFILE_CONFIG || {};
  var username = config.githubUsername;

  if (!username || username === "YOUR_GITHUB_USERNAME") {
    return;
  }

  document
    .querySelectorAll("#github-profile-link, #github-contact-link, #github-footer-link")
    .forEach(function (el) {
      if (el.id === "github-footer-link") {
        el.href =
          "https://github.com/" + username + "/" + username + ".github.io";
      } else {
        el.href = "https://github.com/" + username;
      }
    });

  var maxRepos = config.maxRepos ?? 8;
  if (!maxRepos) return;

  var container = document.getElementById("github-projects");
  if (!container) return;

  container.classList.add("loading");

  fetch(
    "https://api.github.com/users/" +
      encodeURIComponent(username) +
      "/repos?sort=updated&per_page=" +
      maxRepos
  )
    .then(function (res) {
      if (!res.ok) throw new Error("GitHub API " + res.status);
      return res.json();
    })
    .then(function (repos) {
      var filtered = repos.filter(function (r) {
        return !r.fork && r.name !== username + ".github.io";
      });

      if (!filtered.length) {
        container.innerHTML =
          '<p class="loading-msg">No public repos yet — <a href="https://github.com/' +
          escapeHtml(username) +
          '">view GitHub</a></p>';
        return;
      }

      container.innerHTML = filtered
        .map(function (repo) {
          var desc = repo.description
            ? escapeHtml(repo.description)
            : "Open on GitHub →";
          return (
            '<a class="project-card" href="' +
            escapeHtml(repo.html_url) +
            '" target="_blank" rel="noopener noreferrer">' +
            '<h3 class="project-card-title">' +
            escapeHtml(repo.name) +
            "</h3>" +
            '<p class="project-card-desc">' +
            desc +
            "</p>" +
            '<p class="project-card-meta">' +
            escapeHtml(repo.language || "code") +
            " · ★ " +
            repo.stargazers_count +
            "</p>" +
            "</a>"
          );
        })
        .join("");

      if (window.initProjects) {
        window.initProjects(container, filtered);
      }
    })
    .catch(function () {
      container.innerHTML =
        '<p class="loading-msg">Could not load repos — <a href="https://github.com/' +
        escapeHtml(username) +
        '">github.com/' +
        escapeHtml(username) +
        "</a></p>";
    })
    .finally(function () {
      container.classList.remove("loading");
    });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
