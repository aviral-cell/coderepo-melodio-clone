import { useState } from "react";

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
import { usePlaylistRefresh } from "@/shared/contexts/PlaylistContext";
import { useToast } from "@/shared/hooks/useToast";
import { playlistsService } from "@/shared/services/playlist.service";
import type { Playlist } from "@/shared/types";

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
	const { addToast } = useToast();
	const { triggerRefresh } = usePlaylistRefresh();

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
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !name.trim()}>
							{isSubmitting ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
