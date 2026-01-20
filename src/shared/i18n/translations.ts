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
	"settings.partitions": "Partitions",

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
	"navbar.allowUrlEdit": "Allow URL editing",
	"navbar.showBackButton": "Back button",
	"navbar.showForwardButton": "Forward button",
	"navbar.showRefreshButton": "Refresh button",

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
	"app.urlPlaceholder": "example.com",
	"app.cancel": "Cancel",
	"app.deploy": "Add shortcut",
	"app.undeploy": "Remove shortcut",
	"app.shortcut": "Desktop shortcut",
	"app.shortcutCreated": "Shortcut created",
	"app.shortcutNotCreated": "No shortcut",
	"app.routing": "URL Routing",
	"app.rename": "Rename",
	"app.renameTitle": "Rename application",
	"routing.addRule": "Add rule",
	"routing.pattern": "Pattern (regex)",
	"routing.action": "Action",
	"routing.internal": "Internal",
	"routing.download": "Download",
	"routing.external": "External",
	"routing.ignore": "Ignore",
	"routing.noRules": "No rules - all URLs open externally",
	"routing.invalidPattern": "Invalid regex",

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

	// Partitions
	"partition.orphan": "Unused",
	"partition.active": "Active",
	"partition.noPartitions": "No partitions",
	"partition.usedBy": "Used by",
	"partition.notCreated": "Not yet created",
	"partition.reset": "Reset",
	"partition.delete": "Delete",
	"partition.showSize": "Size",
	"partition.confirmReset": 'Reset partition "{name}"? All cookies and data will be deleted.',
	"partition.confirmDelete": 'Delete partition "{name}"? This cannot be undone.',
	"partition.createNew": "New partition",
	"partition.namePlaceholder": "partition-name",
	"partition.storagePath": "Storage path",
	"partition.details": "Details",
	"partition.actions": "Actions",
	"partition.fragile": "Auto-created",
	"partition.notFound": "Partition not found",
	"partition.cannotModifyActive": "Cannot modify the active partition",
	"partition.noActions": "No actions available",
	"partition.sizeUnknown": "Size unknown",
	"partition.adBlockEnabled": "Block ads and trackers",
	"partition.settings": "Settings",
	"partition.rename": "Rename",
	"partition.renameTitle": "Rename partition",

	// Rename dialog
	"rename.newName": "New name",
	"rename.confirm": "Rename",
	"rename.nameExists": "This name already exists",

	// Name validation
	"name.invalidChars": 'Contains invalid characters (< > : " / \\ | ? *)',
	"name.reserved": "This name is reserved by the system",
	"name.tooLong": "Name is too long (max 255 characters)",
	"name.invalidFormat": "Cannot start/end with a dot or end with a space",
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
	"settings.partitions": "Partitions",

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
	"navbar.allowUrlEdit": "Autoriser modification URL",
	"navbar.showBackButton": "Bouton précédent",
	"navbar.showForwardButton": "Bouton suivant",
	"navbar.showRefreshButton": "Bouton recharger",

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
	"app.urlPlaceholder": "exemple.com",
	"app.cancel": "Annuler",
	"app.deploy": "Créer raccourci",
	"app.undeploy": "Supprimer raccourci",
	"app.shortcut": "Raccourci bureau",
	"app.shortcutCreated": "Raccourci créé",
	"app.shortcutNotCreated": "Pas de raccourci",
	"app.routing": "Routage URL",
	"app.rename": "Renommer",
	"app.renameTitle": "Renommer l'application",
	"routing.addRule": "Ajouter une règle",
	"routing.pattern": "Pattern (regex)",
	"routing.action": "Action",
	"routing.internal": "Interne",
	"routing.download": "Télécharger",
	"routing.external": "Externe",
	"routing.ignore": "Ignorer",
	"routing.noRules": "Aucune règle - toutes les URLs s'ouvrent en externe",
	"routing.invalidPattern": "Regex invalide",

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

	// Partitions
	"partition.orphan": "Inutilisée",
	"partition.active": "Active",
	"partition.noPartitions": "Aucune partition",
	"partition.usedBy": "Utilisée par",
	"partition.notCreated": "Non encore créée",
	"partition.reset": "Réinitialiser",
	"partition.delete": "Supprimer",
	"partition.showSize": "Taille",
	"partition.confirmReset": 'Réinitialiser la partition "{name}" ? Tous les cookies et données seront supprimés.',
	"partition.confirmDelete": 'Supprimer la partition "{name}" ? Cette action est irréversible.',
	"partition.createNew": "Nouvelle partition",
	"partition.namePlaceholder": "nom-partition",
	"partition.storagePath": "Emplacement",
	"partition.details": "Détails",
	"partition.actions": "Actions",
	"partition.fragile": "Créée automatiquement",
	"partition.notFound": "Partition non trouvée",
	"partition.cannotModifyActive": "Impossible de modifier la partition active",
	"partition.noActions": "Aucune action disponible",
	"partition.sizeUnknown": "Taille inconnue",
	"partition.adBlockEnabled": "Bloquer pubs et traceurs",
	"partition.settings": "Paramètres",
	"partition.rename": "Renommer",
	"partition.renameTitle": "Renommer la partition",

	// Rename dialog
	"rename.newName": "Nouveau nom",
	"rename.confirm": "Renommer",
	"rename.nameExists": "Ce nom existe déjà",

	// Name validation
	"name.invalidChars": 'Contient des caractères invalides (< > : " / \\ | ? *)',
	"name.reserved": "Ce nom est réservé par le système",
	"name.tooLong": "Nom trop long (max 255 caractères)",
	"name.invalidFormat": "Ne peut pas commencer/finir par un point ou finir par un espace",
}

export const translations: Record<Locale, typeof en> = { en, fr }

export type TranslationKey = keyof typeof en

export type Translations = typeof en
