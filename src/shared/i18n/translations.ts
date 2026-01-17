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

	// Downloads
	"downloads.title": "Downloads",
	"downloads.empty": "No downloads",
	"downloads.inProgress": "In progress...",
	"downloads.status.completed": "Completed",
	"downloads.status.cancelled": "Cancelled",
	"downloads.status.failed": "Failed",
	"downloads.status.blocked": "Blocked",

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

	// Downloads
	"downloads.title": "Téléchargements",
	"downloads.empty": "Aucun téléchargement",
	"downloads.inProgress": "En cours...",
	"downloads.status.completed": "Terminé",
	"downloads.status.cancelled": "Annulé",
	"downloads.status.failed": "Échec",
	"downloads.status.blocked": "Bloqué",

	// Find
	"find.placeholder": "Rechercher...",
	"find.previous": "Précédent (Shift+Entrée)",
	"find.next": "Suivant (Entrée)",
	"find.close": "Fermer (Échap)",
}

export const translations: Record<Locale, typeof en> = { en, fr }

export type TranslationKey = keyof typeof en

export type Translations = typeof en
