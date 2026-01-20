/**
 * Utilitaires pour le routage des URLs
 * Génération de patterns pour déterminer les URLs internes/externes
 */

/**
 * Échappe les caractères spéciaux pour une utilisation dans une regex
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Dérive un pattern regex pour les URLs internes à partir d'une URL de départ.
 *
 * Stratégie : autorise toutes les URLs du même domaine de base (domain.tld)
 * et leurs sous-domaines.
 *
 * Exemples :
 * - "https://mail.google.com/inbox" → "^https?://([^/]+\\.)?google\\.com(/|$)"
 * - "https://app.example.org" → "^https?://([^/]+\\.)?example\\.org(/|$)"
 * - "https://localhost:3000" → "^https?://localhost(:\\d+)?(/|$)"
 */
export function deriveInternalPattern(startUrl: string): string {
	try {
		const url = new URL(startUrl)
		const hostname = url.hostname

		// Cas spécial : localhost
		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return `^https?://${escapeRegex(hostname)}(:\\d+)?(/|$)`
		}

		// Cas spécial : IP address
		if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
			return `^https?://${escapeRegex(hostname)}(:\\d+)?(/|$)`
		}

		// Domaine normal : extraire domain.tld (2 derniers segments)
		const parts = hostname.split(".")
		const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname

		return `^https?://([^/]+\\.)?${escapeRegex(baseDomain)}(/|$)`
	} catch {
		// URL invalide : fallback sur préfixe exact
		return startUrl
	}
}
