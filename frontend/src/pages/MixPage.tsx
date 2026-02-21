import { useState, useEffect, useCallback, type JSX } from "react";
import { ArrowLeft, Plus, Music, Check, X, Loader2, Pencil, PlayCircle, PauseCircle } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { AppImage } from "@/shared/components/common/AppImage";
import { TrackCard } from "@/shared/components/common/TrackCard";
import { useToast } from "@/shared/hooks/useToast";
import { usePlayer } from "@/shared/contexts/PlayerContext";
import { useMixCreator } from "@/shared/hooks/useMixCreator";
import { mixService } from "@/shared/services/mix.service";
import type { Mix, MixDetail } from "@/shared/services/mix.service";
import { getImageUrl, formatDate } from "@/shared/utils";
import { FILTER_OPTIONS } from "@/shared/utils/mixUtils";

interface MixCoverGridProps {
	images: string[];
	size?: "sm" | "lg";
}

function MixCoverGrid({ images, size = "sm" }: MixCoverGridProps): JSX.Element {
	const dim = size === "lg" ? "h-64 w-64" : "h-24 w-24";
	const count = images.length;

	if (count === 0) {
		return (
			<div className={`${dim} flex items-center justify-center overflow-hidden rounded-md bg-melodio-dark-gray`}>
				<Music className="h-8 w-8 text-melodio-text-subdued" />
			</div>
		);
	}

	if (count === 1) {
		return (
			<div className={`${dim} overflow-hidden rounded-md`}>
				<AppImage src={getImageUrl(images[0])} alt="" className="h-full w-full object-cover" />
			</div>
		);
	}

	if (count === 2) {
		return (
			<div className={`${dim} grid grid-cols-2 gap-0.5 overflow-hidden rounded-md`}>
				{images.map((img, i) => (
					<AppImage key={i} src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
				))}
			</div>
		);
	}

	if (count === 3) {
		return (
			<div className={`${dim} grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-md`}>
				<AppImage src={getImageUrl(images[0])} alt="" className="col-span-1 row-span-2 h-full w-full object-cover" />
				<AppImage src={getImageUrl(images[1])} alt="" className="h-full w-full object-cover" />
				<AppImage src={getImageUrl(images[2])} alt="" className="h-full w-full object-cover" />
			</div>
		);
	}

	return (
		<div className={`${dim} grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-md`}>
			{images.slice(0, 4).map((img, i) => (
				<AppImage key={i} src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
			))}
		</div>
	);
}

export default function MixPage(): JSX.Element {
	const { addToast } = useToast();
	const { state: playerState, playTracks, togglePlayPause } = usePlayer();
	const creator = useMixCreator();

	const [view, setView] = useState<"browse" | "create" | "detail">("browse");
	const [mixes, setMixes] = useState<Mix[]>([]);
	const [isMixesLoading, setIsMixesLoading] = useState(true);
	const [selectedMix, setSelectedMix] = useState<MixDetail | null>(null);
	const [isDetailLoading, setIsDetailLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isRenaming, setIsRenaming] = useState(false);
	const [renameValue, setRenameValue] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

	const fetchMixes = useCallback(async () => {
		try {
			setIsMixesLoading(true);
			const result = await mixService.getAll();
			setMixes(result);
		} catch {
			addToast({ type: "error", message: "Failed to load mixes" });
		} finally {
			setIsMixesLoading(false);
		}
	}, [addToast]);

	useEffect(() => {
		fetchMixes();
	}, [fetchMixes]);

	const handleViewMix = useCallback(
		async (mix: Mix) => {
			try {
				setIsDetailLoading(true);
				const detail = await mixService.getById(mix._id);
				setSelectedMix(detail);
				setView("detail");
			} catch {
				addToast({ type: "error", message: "Failed to load mix details" });
			} finally {
				setIsDetailLoading(false);
			}
		},
		[addToast],
	);

	const requestDelete = useCallback((id: string, title: string) => {
		setDeleteConfirm({ id, title });
	}, []);

	const handleDeleteMix = useCallback(
		async (id: string) => {
			setDeleteConfirm(null);
			try {
				await mixService.delete(id);
				setMixes((prev) => prev.filter((m) => m._id !== id));
				if (selectedMix?._id === id) {
					setSelectedMix(null);
					setView("browse");
				}
				addToast({ type: "success", message: "Mix deleted" });
			} catch {
				addToast({ type: "error", message: "Failed to delete mix" });
			}
		},
		[selectedMix, addToast],
	);

	const handleStartRename = useCallback(() => {
		if (selectedMix) {
			setRenameValue(selectedMix.title);
			setIsRenaming(true);
		}
	}, [selectedMix]);

	const handleConfirmRename = useCallback(async () => {
		if (!selectedMix || !renameValue.trim()) return;
		try {
			await mixService.rename(selectedMix._id, renameValue.trim());
			setSelectedMix({ ...selectedMix, title: renameValue.trim() });
			setMixes((prev) =>
				prev.map((m) =>
					m._id === selectedMix._id ? { ...m, title: renameValue.trim() } : m,
				),
			);
			setIsRenaming(false);
			addToast({ type: "success", message: "Mix renamed" });
		} catch {
			addToast({ type: "error", message: "Failed to rename mix" });
		}
	}, [selectedMix, renameValue, addToast]);

	const handleCancelRename = useCallback(() => {
		setIsRenaming(false);
	}, []);

	const handleStartCreate = useCallback(() => {
		creator.reset();
		setView("create");
	}, [creator]);

	const handleDone = useCallback(async () => {
		const generatedTracks = creator.generateAndAdvance();

		setIsSaving(true);
		try {
			await mixService.create({
				title: creator.mixTitle,
				artistIds: creator.selectedArtistIds,
				config: creator.config,
				trackIds: generatedTracks.map((t) => t._id),
				coverImages: creator.coverImages,
			});
			addToast({ type: "success", message: "Mix saved" });
		} catch {
			addToast({ type: "error", message: "Failed to save mix" });
		} finally {
			setIsSaving(false);
		}
	}, [creator, addToast]);

	const handleBackToMixes = useCallback(async () => {
		setView("browse");
		creator.reset();
		await fetchMixes();
	}, [creator, fetchMixes]);

	if (creator.isLoading || isDetailLoading) {
		return (
			<div className="p-6" data-testid="mix-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Mix</h1>
				<div className="space-y-6">
					<Skeleton className="h-48 w-full rounded-lg" />
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex gap-4 rounded-lg bg-melodio-dark-gray/50 p-3">
								<Skeleton className="h-24 w-24 shrink-0 rounded-md" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-3/4 rounded" />
									<Skeleton className="h-4 w-1/3 rounded" />
									<Skeleton className="h-3 w-1/4 rounded" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (creator.error) {
		return (
			<div className="p-6" data-testid="mix-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Mix</h1>
				<div className="py-12 text-center text-red-400">
					<p>{creator.error}</p>
					<Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	const deleteDialog = (
		<Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
			<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-white">Delete mix</DialogTitle>
					<DialogDescription className="text-melodio-text-subdued">
						Are you sure you want to delete <span className="font-semibold text-white">{deleteConfirm?.title}</span>? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="mix-delete-cancel">
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={() => deleteConfirm && handleDeleteMix(deleteConfirm.id)}
						data-testid="mix-delete-confirm"
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	if (view === "detail" && selectedMix) {
		return (
			<div className="p-6" data-testid="mix-detail-view">
				{deleteDialog}
				<button
					type="button"
					onClick={() => setView("browse")}
					className="mb-6 flex items-center gap-2 text-sm font-medium text-melodio-green transition-colors hover:text-melodio-green-dark hover:underline"
					data-testid="mix-detail-back-btn"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to mixes
				</button>

				<div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
					<MixCoverGrid images={selectedMix.coverImages} size="lg" />
					<div className="flex w-full flex-col items-center sm:w-auto sm:items-start">
						<span className="mb-1 text-xs font-medium uppercase tracking-wider text-melodio-text-subdued">
							Mix
						</span>
						{isRenaming ? (
							<div className="mb-1 flex w-full items-center gap-2">
								<input
									type="text"
									value={renameValue}
									onChange={(e) => setRenameValue(e.target.value)}
									maxLength={50}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleConfirmRename();
										if (e.key === "Escape") handleCancelRename();
									}}
									className="min-w-0 flex-1 rounded-md border border-melodio-light-gray bg-melodio-dark-gray px-3 py-1.5 text-xl font-bold text-white outline-none focus:border-melodio-green sm:text-3xl"
									data-testid="mix-rename-input"
									autoFocus
								/>
								<button
									type="button"
									onClick={handleConfirmRename}
									className="flex-shrink-0 rounded p-1 text-melodio-green hover:bg-melodio-green/10"
									data-testid="mix-rename-confirm"
								>
									<Check className="h-5 w-5" />
								</button>
								<button
									type="button"
									onClick={handleCancelRename}
									className="flex-shrink-0 rounded p-1 text-melodio-text-subdued hover:bg-white/10"
									data-testid="mix-rename-cancel"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
						) : (
							<div className="mb-1 flex items-center gap-2">
								<h2 className="text-center text-3xl font-bold text-white sm:text-left">
									{selectedMix.title}
								</h2>
								<button
									type="button"
									onClick={handleStartRename}
									className="rounded p-1 text-melodio-text-subdued transition-colors hover:text-white"
									data-testid="mix-rename-btn"
								>
									<Pencil className="h-4 w-4" />
								</button>
							</div>
						)}
						<p className="mb-3 text-sm text-melodio-text-subdued">
							{selectedMix.trackCount} tracks
						</p>
						<button
							type="button"
							onClick={() => requestDelete(selectedMix._id, selectedMix.title)}
							className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
							data-testid={`mix-delete-detail-${selectedMix._id}`}
						>
							<X className="h-4 w-4" />
							Delete
						</button>
					</div>
				</div>

				{selectedMix.trackIds.length > 0 && (() => {
					const isMixPlaying = playerState.isPlaying && selectedMix.trackIds.some((t) => t._id === playerState.currentTrack?._id);
					return (
						<div className="mb-6 flex items-center gap-4">
							<button
								type="button"
								onClick={() => {
									if (isMixPlaying) {
										togglePlayPause();
									} else {
										playTracks(selectedMix.trackIds, 0);
									}
								}}
								className="flex items-center gap-2 rounded-full bg-melodio-green px-5 py-1.5 text-sm font-semibold text-black transition-all hover:brightness-110"
								data-testid="mix-detail-play-all-btn"
							>
								{isMixPlaying ? (
									<PauseCircle className="h-4 w-4" />
								) : (
									<PlayCircle className="h-4 w-4" />
								)}
								{isMixPlaying ? "Pause" : "Play All"}
							</button>
						</div>
					);
				})()}

				<div
					data-testid="mix-detail-tracks"
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
				>
					{selectedMix.trackIds.map((track) => (
						<TrackCard key={track._id} track={track} />
					))}
				</div>
			</div>
		);
	}

	if (view === "create") {
		if (creator.step === "select") {
			return (
				<div className="p-6" data-testid="mix-create-view">
					<div data-testid="mix-step-select">
						<button
							type="button"
							onClick={handleBackToMixes}
							className="mb-6 flex items-center gap-2 text-sm font-medium text-melodio-green transition-colors hover:text-melodio-green-dark hover:underline"
							data-testid="mix-select-back-btn"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to mixes
						</button>

						<h2 className="mb-6 text-2xl font-bold text-white">Pick your artists</h2>

						<div
							data-testid="mix-artists-grid"
							className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
						>
							{creator.availableArtists.map((artist) => {
								const isSelected = creator.selectedArtistIds.includes(artist.id);
								return (
									<button
										key={artist.id}
										type="button"
										data-testid={`mix-artist-${artist.id}`}
										onClick={() => creator.toggleArtist(artist.id)}
										className="group flex flex-col items-center gap-2"
									>
										<div className="relative h-20 w-20 overflow-hidden rounded-full">
											<AppImage
												src={getImageUrl(artist.imageUrl)}
												alt={artist.name}
												className="h-full w-full object-cover"
											/>
											{isSelected && (
												<div className="absolute inset-0 flex items-center justify-center bg-black/40">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-melodio-green">
														<Check className="h-4 w-4 text-black" />
													</div>
												</div>
											)}
										</div>
										<span className="w-full truncate text-center text-xs font-medium text-white">
											{artist.name}
										</span>
									</button>
								);
							})}
						</div>

						<div className="mt-8 flex justify-end">
							<Button
								data-testid="mix-next-btn"
								disabled={!creator.canProceed}
								onClick={creator.nextStep}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			);
		}

		if (creator.step === "configure") {
			return (
				<div className="p-6" data-testid="mix-create-view">
					<div data-testid="mix-step-configure">
						<button
							type="button"
							onClick={creator.prevStep}
							className="mb-6 flex items-center gap-2 text-sm font-medium text-melodio-green transition-colors hover:text-melodio-green-dark hover:underline"
							data-testid="mix-configure-back-btn"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</button>

						<h2 className="mb-6 text-2xl font-bold text-white">Adjust your mix</h2>

						<section className="mb-8">
							<h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-melodio-text-subdued">
								Artist Variety
							</h3>
							<div className="flex flex-wrap gap-2">
								{(["low", "medium", "high"] as const).map((level) => (
									<Button
										key={level}
										data-testid={`mix-variety-${level}`}
										variant={creator.config.variety === level ? "default" : "outline"}
										onClick={() => creator.updateConfig({ variety: level })}
										className="capitalize"
									>
										{level}
									</Button>
								))}
							</div>
						</section>

						<section className="mb-8">
							<h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-melodio-text-subdued">
								Music Discovery
							</h3>
							<div className="flex flex-wrap gap-2">
								{(["familiar", "blend", "discover"] as const).map((level) => (
									<Button
										key={level}
										data-testid={`mix-discovery-${level}`}
										variant={creator.config.discovery === level ? "default" : "outline"}
										onClick={() => creator.updateConfig({ discovery: level })}
										className="capitalize"
									>
										{level}
									</Button>
								))}
							</div>
						</section>

						<section className="mb-8">
							<h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-melodio-text-subdued">
								Filters
							</h3>
							<div data-testid="mix-filters" className="flex flex-wrap gap-2">
								{FILTER_OPTIONS.map((filter) => {
									const isSelected = creator.config.filters.includes(filter);
									const testId = "mix-filter-" + filter.toLowerCase().replace(/\s+/g, "-");
									return (
										<Button
											key={filter}
											data-testid={testId}
											variant={isSelected ? "default" : "outline"}
											onClick={() => creator.toggleFilter(filter)}
										>
											{filter}
										</Button>
									);
								})}
							</div>
						</section>

						<div className="flex justify-end">
							<Button data-testid="mix-done-btn" onClick={handleDone} disabled={isSaving}>
								{isSaving ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									"Done"
								)}
							</Button>
						</div>
					</div>
				</div>
			);
		}

		if (creator.step === "result") {
			return (
				<div className="p-6" data-testid="mix-create-view">
					<div data-testid="mix-step-result">
						<button
							type="button"
							onClick={handleBackToMixes}
							className="mb-6 flex items-center gap-2 text-sm font-medium text-melodio-green transition-colors hover:text-melodio-green-dark hover:underline"
							data-testid="mix-back-to-mixes-btn"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to mixes
						</button>

						<div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
							<MixCoverGrid images={creator.coverImages} size="lg" />
							<div className="flex flex-col items-center sm:items-start">
								<span className="mb-1 text-xs font-medium uppercase tracking-wider text-melodio-text-subdued">
									Mix
								</span>
								<h2 data-testid="mix-title" className="mb-1 text-center text-3xl font-bold text-white sm:text-left">
									{creator.mixTitle}
								</h2>
								<p className="text-sm text-melodio-text-subdued">
									{creator.mix.length} tracks
								</p>
							</div>
						</div>

						<div
							data-testid="mix-result-tracks"
							className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
						>
							{creator.mix.map((track) => (
								<TrackCard key={track._id} track={track} />
							))}
						</div>

					</div>
				</div>
			);
		}
	}

	return (
		<div className="p-6" data-testid="mix-page">
			{deleteDialog}
			<h1 className="mb-8 text-3xl font-bold text-white">Mix</h1>

			<section className="mb-10">
				<h2 className="mb-5 text-xl font-semibold text-white">Create Mix</h2>
				<div
					data-testid="mix-create-card"
					role="button"
					tabIndex={0}
					onClick={handleStartCreate}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handleStartCreate();
						}
					}}
					className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg bg-gradient-to-br from-teal-800 to-emerald-900 p-10 transition-all hover:brightness-110"
				>
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
						<Plus className="h-8 w-8 text-teal-800" />
					</div>
					<p className="text-sm text-white/80">Pick artists and fine-tune your mix</p>
				</div>
			</section>

			<section data-testid="mix-your-mixes">
				<h2 className="mb-5 text-xl font-semibold text-white">Your Mixes</h2>
				{isMixesLoading ? (
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex gap-4 rounded-lg bg-melodio-dark-gray/50 p-3">
								<Skeleton className="h-24 w-24 shrink-0 rounded-md" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-3/4 rounded" />
									<Skeleton className="h-4 w-1/3 rounded" />
								</div>
							</div>
						))}
					</div>
				) : mixes.length === 0 ? (
					<div className="py-8 text-center">
						<p className="text-melodio-text-subdued">No mixes yet. Create your first one!</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{mixes.map((mix) => (
							<div
								key={mix._id}
								data-testid={`mix-card-${mix._id}`}
								role="button"
								tabIndex={0}
								onClick={() => handleViewMix(mix)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleViewMix(mix);
									}
								}}
								className="group flex cursor-pointer gap-4 rounded-lg bg-melodio-dark-gray/50 p-3 transition-colors hover:bg-melodio-light-gray"
							>
								<MixCoverGrid images={mix.coverImages} size="sm" />
								<div className="flex min-w-0 flex-1 flex-col justify-center">
									<p className="truncate font-semibold text-white">{mix.title}</p>
									<p className="text-sm text-melodio-text-subdued">
										{mix.trackCount} tracks
									</p>
									<p className="mt-1 text-xs text-melodio-text-subdued">
										{formatDate(mix.createdAt)}
									</p>
								</div>
								<button
									type="button"
									data-testid={`mix-delete-${mix._id}`}
									onClick={(e) => {
										e.stopPropagation();
										requestDelete(mix._id, mix.title);
									}}
									className="self-start rounded-full bg-red-500/20 p-1.5 text-red-400 opacity-0 transition-all hover:bg-red-500/30 group-hover:opacity-100"
									aria-label={`Delete ${mix.title}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
