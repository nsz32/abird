export type Locale = "en" | "fr"

const en = {
	// Settings
	"settings.title": "Bird Settings",
	"settings.appearance": "Appearance",
	"settings.theme": "Theme",
	"settings.navbar": "Navigation bar (global)",
	"settings.apps": "Applications",
	"settings.noApps": "No applications configured",
	"settings.configPath": "Configuration",

	// Theme
	"theme.system": "System",
	"theme.light": "Light",
	"theme.dark": "Dark",

	// Position
	"position.top": "Top",
	"position.bottom": "Bottom",

	// Navbar options
	"navbar.position": "Position",
	"navbar.visible": "Visible",
	"navbar.autoHide": "Auto-hide",
	"navbar.urlEditable": "Editable URL",
	"navbar.showBackForward": "Back/Forward buttons",
	"navbar.showReload": "Reload button",

	// App config
	"app.general": "General",
	"app.navbar": "Navigation bar",
	"app.startUrl": "Start URL",
	"app.partition": "Partition",
	"app.icon": "Icon",
	"app.fetchIcons": "Fetch icons",
	"app.importIcon": "Import file",
	"app.create": "New app",
	"app.delete": "Delete",
	"app.deleteConfirm": "Delete this application?",
	"app.notFound": "Application not found",
	"app.name": "Name",
	"app.namePlaceholder": "my-app",
	"app.urlPlaceholder": "https://example.com",
	"app.cancel": "Cancel",
	"app.deploy": "Add shortcut",
	"app.undeploy": "Remove shortcut",
	"app.shortcut": "Desktop shortcut",

	// Inherit state
	"inherit.reset": "Reset",

	// Downloads
	"downloads.title": "Downloads",
	"downloads.empty": "No downloads",
	"downloads.inProgress": "In progress...",
	"downloads.status.completed": "Completed",
	"downloads.status.cancelled": "Cancelled",
	"downloads.status.failed": "Failed",
	"downloads.status.blocked": "Blocked",
	"downloads.status.duplicate": "Already downloaded",
	"downloads.openFile": "Open file",
	"downloads.openFolder": "Show in folder",
	"downloads.cancel": "Cancel",
	"downloads.retry": "Retry",
	"downloads.remove": "Remove from list",

	// Find
	"find.placeholder": "Search...",
	"find.previous": "Previous (Shift+Enter)",
	"find.next": "Next (Enter)",
	"find.close": "Close (Escape)",
}

const fr: typeof en = {
	// Settings
	"settings.title": "Bird - Paramètres",
	"settings.appearance": "Apparence",
	"settings.theme": "Thème",
	"settings.navbar": "Barre de navigation (global)",
	"settings.apps": "Applications",
	"settings.noApps": "Aucune application configurée",
	"settings.configPath": "Configuration",

	// Theme
	"theme.system": "Système",
	"theme.light": "Clair",
	"theme.dark": "Sombre",

	// Position
	"position.top": "Haut",
	"position.bottom": "Bas",

	// Navbar options
	"navbar.position": "Position",
	"navbar.visible": "Visible",
	"navbar.autoHide": "Masquage automatique",
	"navbar.urlEditable": "URL modifiable",
	"navbar.showBackForward": "Boutons précédent/suivant",
	"navbar.showReload": "Bouton recharger",

	// App config
	"app.general": "Général",
	"app.navbar": "Barre de navigation",
	"app.startUrl": "URL de démarrage",
	"app.partition": "Partition",
	"app.icon": "Icône",
	"app.fetchIcons": "Obtenir icônes",
	"app.importIcon": "Importer fichier",
	"app.create": "Nouvelle app",
	"app.delete": "Supprimer",
	"app.deleteConfirm": "Supprimer cette application ?",
	"app.notFound": "Application non trouvée",
	"app.name": "Nom",
	"app.namePlaceholder": "mon-app",
	"app.urlPlaceholder": "https://exemple.com",
	"app.cancel": "Annuler",
	"app.deploy": "Créer raccourci",
	"app.undeploy": "Supprimer raccourci",
	"app.shortcut": "Raccourci bureau",

	// Inherit state
	"inherit.reset": "Réinitialiser",

	// Downloads
	"downloads.title": "Téléchargements",
	"downloads.empty": "Aucun téléchargement",
	"downloads.inProgress": "En cours...",
	"downloads.status.completed": "Terminé",
	"downloads.status.cancelled": "Annulé",
	"downloads.status.failed": "Échec",
	"downloads.status.blocked": "Bloqué",
	"downloads.status.duplicate": "Déjà téléchargé",
	"downloads.openFile": "Ouvrir le fichier",
	"downloads.openFolder": "Afficher dans le dossier",
	"downloads.cancel": "Annuler",
	"downloads.retry": "Relancer",
	"downloads.remove": "Retirer de la liste",

	// Find
	"find.placeholder": "Rechercher...",
	"find.previous": "Précédent (Shift+Entrée)",
	"find.next": "Suivant (Entrée)",
	"find.close": "Fermer (Échap)",
}

export const translations: Record<Locale, typeof en> = { en, fr }

export type TranslationKey = keyof typeof en

export type Translations = typeof en
