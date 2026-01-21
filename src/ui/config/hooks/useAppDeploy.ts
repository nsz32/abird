import { useEffect, useState } from "react"

export interface UseAppDeployResult {
	supported: boolean
	deployed: boolean
	deploying: boolean
	deploy: () => Promise<void>
	undeploy: () => Promise<void>
}

/**
 * Manages desktop shortcut deployment for an app.
 * Handles deploy status, deploy/undeploy actions, and loading states.
 */
export function useAppDeploy(appName: string): UseAppDeployResult {
	const [supported, setSupported] = useState(false)
	const [deployed, setDeployed] = useState(false)
	const [deploying, setDeploying] = useState(false)

	useEffect(() => {
		window.bird.deploy.isSupported().then(setSupported)
	}, [])

	useEffect(() => {
		if (supported) {
			window.bird.deploy.getStatus(appName).then(setDeployed)
		}
	}, [appName, supported])

	const deploy = async () => {
		if (deploying) return
		setDeploying(true)
		try {
			await window.bird.deploy.deploy(appName)
			setDeployed(true)
		} catch (err) {
			console.error("Failed to deploy:", err)
		} finally {
			setDeploying(false)
		}
	}

	const undeploy = async () => {
		if (deploying) return
		setDeploying(true)
		try {
			await window.bird.deploy.undeploy(appName)
			setDeployed(false)
		} catch (err) {
			console.error("Failed to undeploy:", err)
		} finally {
			setDeploying(false)
		}
	}

	return { supported, deployed, deploying, deploy, undeploy }
}
