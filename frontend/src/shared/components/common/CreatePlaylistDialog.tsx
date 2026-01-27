import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Crown } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { useAuth } from "@/shared/contexts/AuthContext";
import { usePlaylistRefresh } from "@/shared/contexts/PlaylistContext";
import { useToast } from "@/shared/hooks/useToast";
import { playlistsService } from "@/shared/services/playlist.service";
import type { Playlist } from "@/shared/types";

const FREE_PLAYLIST_LIMIT = 2;

interface CreatePlaylistDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (playlist: Playlist) => void;
}

export function CreatePlaylistDialog({
	open,
	onOpenChange,
	onSuccess,
}: CreatePlaylistDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [playlistCount, setPlaylistCount] = useState(0);
	const [isLoadingCount, setIsLoadingCount] = useState(true);

	const { user } = useAuth();
	const { addToast } = useToast();
	const { triggerRefresh } = usePlaylistRefresh();

	const isPremium = user?.subscriptionStatus === "premium";
	const isAtLimit = !isPremium && playlistCount >= FREE_PLAYLIST_LIMIT;

	const fetchPlaylistCount = useCallback(async () => {
		try {
			const playlists = await playlistsService.getAll();
			setPlaylistCount(playlists.length);
		} catch {
			// Silently fail
		} finally {
			setIsLoadingCount(false);
		}
	}, []);

	useEffect(() => {
		if (open) {
			fetchPlaylistCount();
		}
	}, [open, fetchPlaylistCount]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			addToast({
				type: "error",
				message: "Please enter a playlist name",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const playlist = await playlistsService.create({
				name: name.trim(),
				description: description.trim() || undefined,
			});

			addToast({
				type: "success",
				message: `"${playlist.name}" has been created successfully`,
			});

			triggerRefresh();
			setName("");
			setDescription("");
			onOpenChange(false);
			onSuccess?.(playlist);
		} catch (error) {
			addToast({
				type: "error",
				message: error instanceof Error ? error.message : "Please try again",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			setName("");
			setDescription("");
			onOpenChange(false);
		}
	};

	// Show upgrade prompt if at limit
	if (isAtLimit && !isLoadingCount) {
		return (
			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-white">
							<Crown className="h-5 w-5 text-yellow-500" />
							Playlist Limit Reached
						</DialogTitle>
						<DialogDescription>
							Free accounts are limited to {FREE_PLAYLIST_LIMIT} playlists.
							Upgrade to Premium for unlimited playlists.
						</DialogDescription>
					</DialogHeader>
					<div className="py-6 text-center">
						<div className="mb-4 text-sm text-melodio-text-subdued">
							You have used {playlistCount} of {FREE_PLAYLIST_LIMIT} playlists
						</div>
						<Link to="/subscription" onClick={() => onOpenChange(false)}>
							<Button
								className="bg-melodio-green text-black hover:bg-melodio-green/90"
								data-testid="playlist-limit-upgrade-btn"
							>
								<Crown className="mr-2 h-4 w-4" />
								Upgrade to Premium
							</Button>
						</Link>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-white">Create Playlist</DialogTitle>
					<DialogDescription>
						Give your playlist a name and an optional description.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Playlist count indicator for free users */}
						{!isPremium && !isLoadingCount && (
							<div className="rounded-md bg-melodio-light-gray/50 p-2 text-center text-xs text-melodio-text-subdued">
								{playlistCount} of {FREE_PLAYLIST_LIMIT} playlists used
							</div>
						)}
						<div className="space-y-2">
							<label
								htmlFor="playlist-name"
								className="text-sm font-medium text-white"
							>
								Name
							</label>
							<Input
								id="playlist-name"
								type="text"
								placeholder="My Awesome Playlist"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-melodio-light-gray"
								autoFocus
								data-testid="playlist-name-input"
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="playlist-description"
								className="text-sm font-medium text-white"
							>
								Description (optional)
							</label>
							<Input
								id="playlist-description"
								type="text"
								placeholder="Add an optional description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="bg-melodio-light-gray"
								data-testid="playlist-description-input"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							disabled={isSubmitting}
							data-testid="playlist-cancel-btn"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !name.trim()}
							data-testid="playlist-create-btn"
						>
							{isSubmitting ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
