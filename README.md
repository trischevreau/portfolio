# Portfolio statique

Portfolio simple et statique, avec des filtres par type de projet, outils utilisés et thèmes.
Déployable sur **GitHub Pages**.

## Modifier les projets

Les projets sont définis dans [`projects.json`](./projects.json). Dans VS Code, le schéma JSON du dépôt fournit l'auto-complétion et signale les champs ou valeurs invalides.

Le validateur vérifie la structure des projets ainsi que l'existence des images et des fichiers locaux référencés. Pour lancer la vérification manuellement avec Python 3 :

```powershell
py -3 scripts/validate_projects.py
```

Pour faire exécuter automatiquement le contrôle avant chaque commit dans un nouveau clone, lance ces commandes dans Git Bash (ou un terminal Unix) :

```sh
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

Le hook vérifie la version indexée de `projects.json` et s'assure que chaque fichier référencé est lui aussi suivi dans le commit. Il nécessite Python 3 et bloque le commit si une donnée ou un fichier référencé est invalide ou manquant.
