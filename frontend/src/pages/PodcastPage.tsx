import type { JSX } from "react";
import { Clock, PlayCircle, PauseCircle, ArrowLeft, Play } from "lucide-react";
import { AppImage } from "@/shared/components/common/AppImage";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { usePodcastBrowser } from "@/shared/hooks/usePodcastBrowser";
import { formatEpisodeDuration } from "@/shared/utils/podcastUtils";
import { getImageUrl } from "@/shared/utils";

export default function PodcastPage(): JSX.Element {
	const {
		shows,
		topShows,
		isLoading,
		error,
		selectedShow,
		handleSelectShow,
		handleBackToShows,
		showEpisodes,
		formattedDuration,
		formattedEpisodeDates,
		formattedPlayCount,
		episodeSortOrder,
		handleSortChange,
		selectedEpisode,
		handleSelectEpisode,
		handleBackToShow,
		upNextEpisodes,
		episodeDescription,
		handlePlayAll,
		handlePlayEpisode,
		currentlyPlayingId,
		isPlaying,
		handlePauseEpisode,
	} = usePodcastBrowser();

	if (isLoading) {
		return (
			<div className="p-6" data-testid="podcast-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Podcasts</h1>
				<div data-testid="podcast-loading" className="space-y-6">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="rounded-md bg-melodio-dark-gray p-4">
								<Skeleton className="mb-4 aspect-square w-full rounded-md" />
								<Skeleton className="mb-2 h-4 w-3/4 rounded" />
								<Skeleton className="h-3 w-1/2 rounded" />
							</div>
						))}
					</div>
					<div className="space-y-3 pt-4">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="flex items-center gap-4">
								<Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-2/3 rounded" />
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

	if (error) {
		return (
			<div className="p-6" data-testid="podcast-page">
				<h1 className="mb-8 text-3xl font-bold text-white">Podcasts</h1>
				<div
					data-testid="podcast-error"
					className="py-12 text-center text-red-400"
				>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	if (selectedEpisode && selectedShow) {
		return (
			<div className="p-6" data-testid="podcast-page">
				<div data-testid="podcast-selected-episode">
					<button
						data-testid="podcast-back-to-show"
						onClick={handleBackToShow}
						className="mb-6 flex items-center gap-2 text-sm font-medium text-melodio-green transition-colors hover:text-melodio-green-dark hover:underline"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to {selectedShow.album.title}
					</button>

					<div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
						<div className="relative h-56 w-56 shrink-0 overflow-hidden rounded-lg shadow-2xl sm:h-64 sm:w-64">
							<AppImage
								src={getImageUrl(selectedEpisode.coverImageUrl)}
								alt={selectedEpisode.title}
								className="h-full w-full object-cover"
							/>
						</div>

						<div className="flex flex-col items-center sm:items-start">
							<span className="mb-1 text-xs font-medium uppercase tracking-wider text-melodio-green">
								Episode
							</span>
							<h2 className="mb-2 text-center text-2xl font-bold text-white sm:text-left">
								{selectedEpisode.title}
							</h2>
							<p className="mb-4 text-sm text-melodio-text-subdued">
								{selectedShow.album.artistId?.name}
							</p>

							<p
								data-testid="podcast-episode-description"
								className="mb-6 max-w-xl text-sm leading-relaxed text-melodio-text-subdued"
							>
								{episodeDescription}
							</p>

							<div className="flex items-center gap-4">
								{(() => {
									const isEpisodePlaying = currentlyPlayingId === selectedEpisode._id && isPlaying;
									return (
										<button
											data-testid={`podcast-play-episode-${selectedEpisode._id}`}
											onClick={() => isEpisodePlaying ? handlePauseEpisode() : handlePlayEpisode(selectedEpisode)}
											className="flex items-center gap-2 rounded-full bg-melodio-green px-6 py-2 text-sm font-semibold text-black hover:brightness-110"
										>
											{isEpisodePlaying ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
											{isEpisodePlaying ? "Pause Episode" : "Play Episode"}
										</button>
									);
								})()}
								<span className="flex items-center gap-1 text-sm text-melodio-text-subdued">
									<Clock className="h-3.5 w-3.5" />
									{formatEpisodeDuration(selectedEpisode.durationInSeconds)}
								</span>
							</div>
						</div>
					</div>

					<section data-testid="podcast-up-next">
					{upNextEpisodes.length > 0 && (
						<>
							<h3 className="mb-4 text-lg font-semibold text-white">Up Next</h3>
							<div className="space-y-2">
								{upNextEpisodes.map((episode) => (
									<div
										key={episode._id}
										data-testid={`podcast-up-next-episode-${episode._id}`}
										onClick={() => handleSelectEpisode(episode)}
										className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-melodio-dark-gray"
									>
										<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
											<AppImage
												src={getImageUrl(episode.coverImageUrl)}
												alt={episode.title}
												className="h-full w-full object-cover"
											/>
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-white">
												{episode.title}
											</p>
										</div>
										<span className="text-xs text-melodio-text-subdued">
											{formatEpisodeDuration(episode.durationInSeconds)}
										</span>
										<PlayCircle className="h-4 w-4 text-melodio-text-subdued opacity-0 transition-opacity group-hover:opacity-100" />
									</div>
								))}
							</div>
						</>
					)}
				</section>
				</div>
			</div>
		);
	}

	if (selectedShow) {
		return (
			<div className="p-6" data-testid="podcast-page">
				<div data-testid="podcast-selected-show">
					<button
						data-testid="podcast-back-to-shows"
						onClick={handleBackToShows}
						className="mb-6 flex items-center gap-2 text-sm font-medium text-melodio-green transition-colors hover:text-melodio-green-dark hover:underline"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to shows
					</button>

					<div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
						<div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-lg shadow-2xl sm:h-52 sm:w-52">
							<AppImage
								src={getImageUrl(selectedShow.album.coverImageUrl)}
								alt={selectedShow.album.title}
								className="h-full w-full object-cover"
							/>
						</div>

						<div className="flex flex-col items-center sm:items-start">
							<span className="mb-1 text-xs font-medium uppercase tracking-wider text-melodio-text-subdued">
								Podcast
							</span>
							<h2
								data-testid="podcast-show-detail-title"
								className="mb-1 text-center text-3xl font-bold text-white sm:text-left"
							>
								{selectedShow.album.title}
							</h2>
							<p
								data-testid="podcast-show-detail-host"
								className="mb-3 text-sm font-medium text-melodio-text-subdued"
							>
								{selectedShow.album.artistId?.name}
							</p>
							<div className="flex items-center gap-4 text-xs text-melodio-text-subdued">
								<span
									data-testid="podcast-show-detail-duration"
									className="flex items-center gap-1"
								>
									<Clock className="h-3.5 w-3.5" />
									{formattedDuration}
								</span>
								<span className="text-melodio-text-subdued/40">|</span>
								<span data-testid="podcast-show-detail-play-count">
									{formattedPlayCount} plays
								</span>
							</div>
						</div>
					</div>

					<div className="mb-5 flex flex-wrap items-center gap-2">
						{(["default", "latest", "oldest"] as const).map((sortOption) => (
							<button
								key={sortOption}
								data-testid={`podcast-sort-${sortOption}`}
								onClick={() => handleSortChange(sortOption)}
								className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
									episodeSortOrder === sortOption
										? "bg-melodio-green text-black"
										: "bg-melodio-dark-gray text-melodio-text-subdued hover:bg-melodio-light-gray hover:text-white"
								}`}
							>
								{sortOption}
							</button>
						))}
						<button
							data-testid="podcast-play-all"
							onClick={() => {
								const isShowPlaying = showEpisodes.some((ep) => ep._id === currentlyPlayingId) && isPlaying;
								if (isShowPlaying) {
									handlePauseEpisode();
								} else {
									handlePlayAll();
								}
							}}
							className="ml-auto flex items-center gap-2 rounded-full bg-melodio-green px-5 py-1.5 text-sm font-semibold text-black transition-all hover:brightness-110"
						>
							{showEpisodes.some((ep) => ep._id === currentlyPlayingId) && isPlaying ? (
								<>
									<PauseCircle className="h-4 w-4" />
									Pause All
								</>
							) : (
								<>
									<PlayCircle className="h-4 w-4" />
									Play All
								</>
							)}
						</button>
					</div>

					<div data-testid="podcast-episodes" className="space-y-1">
						{showEpisodes.map((episode) => (
							<div
								key={episode._id}
								data-testid={`podcast-episode-${episode._id}`}
								onClick={() => handleSelectEpisode(episode)}
								className="group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-melodio-dark-gray"
							>
								<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
									<AppImage
										src={getImageUrl(episode.coverImageUrl)}
										alt={episode.title}
										className="h-full w-full object-cover"
									/>
									{currentlyPlayingId !== episode._id && (
										<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
											<Play className="h-5 w-5 fill-white text-white" />
										</div>
									)}
								</div>

								{currentlyPlayingId === episode._id ? (
									<span
										data-testid={`podcast-now-playing-${episode._id}`}
										className="flex w-4 items-center justify-center gap-0.5"
									>
										<span className="h-2 w-0.5 animate-pulse bg-melodio-green" />
										<span
											className="h-3 w-0.5 animate-pulse bg-melodio-green"
											style={{ animationDelay: "0.2s" }}
										/>
										<span
											className="h-1.5 w-0.5 animate-pulse bg-melodio-green"
											style={{ animationDelay: "0.4s" }}
										/>
									</span>
								) : (
									<span className="w-4" />
								)}

								<div className="min-w-0 flex-1">
									<p
										className={`truncate text-sm font-medium ${
											currentlyPlayingId === episode._id
												? "text-melodio-green"
												: "text-white"
										}`}
									>
										{episode.title}
									</p>
								</div>
								<span
									data-testid={`podcast-episode-date-${episode._id}`}
									className="hidden text-xs text-melodio-text-subdued sm:block"
								>
									{formattedEpisodeDates.get(episode._id) || ""}
								</span>
								<span className="text-xs text-melodio-text-subdued">
									{formatEpisodeDuration(episode.durationInSeconds)}
								</span>
								{(() => {
									const isThisPlaying = currentlyPlayingId === episode._id && isPlaying;
									return (
										<button
											data-testid={`podcast-play-episode-${episode._id}`}
											onClick={(e) => {
												e.stopPropagation();
												isThisPlaying ? handlePauseEpisode() : handlePlayEpisode(episode);
											}}
											className="rounded-full p-1.5 text-melodio-text-subdued transition-colors hover:text-melodio-green"
										>
											{isThisPlaying ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
										</button>
									);
								})()}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6" data-testid="podcast-page">
			<h1 className="mb-8 text-3xl font-bold text-white">Podcasts</h1>

			<section className="mb-10" data-testid="podcast-top-shows">
				<h2 className="mb-5 text-xl font-semibold text-white">Top Shows</h2>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{topShows.map((show) => (
						<div
							key={show.album._id}
							data-testid={`podcast-top-show-${show.album._id}`}
							onClick={() => handleSelectShow(show)}
							className="group cursor-pointer rounded-md bg-melodio-dark-gray p-4 transition-all duration-300 hover:bg-melodio-light-gray"
						>
							<div className="relative mb-4 aspect-square overflow-hidden rounded-md shadow-lg">
								<AppImage
									src={getImageUrl(show.album.coverImageUrl)}
									alt={show.album.title}
									className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-melodio-green shadow-xl hover:scale-105 hover:bg-melodio-green-dark transition-transform">
										<Play className="h-5 w-5 fill-black text-black ml-0.5" />
									</div>
								</div>
							</div>
							<p className="truncate text-sm font-semibold text-white">
								{show.album.title}
							</p>
							<p className="truncate text-xs text-melodio-text-subdued">
								{show.album.artistId?.name}
							</p>
							<div className="mt-1 flex items-center gap-2 text-xs text-melodio-text-subdued">
								<span>{show.episodeCount} episodes</span>
								<span className="text-melodio-text-subdued/40">&middot;</span>
								<span>{formatEpisodeDuration(show.totalDuration)}</span>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="mb-8" data-testid="podcast-shows">
				<h2 className="mb-5 text-xl font-semibold text-white">All Shows</h2>
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{shows.map((show) => (
						<div
							key={show.album._id}
							data-testid={`podcast-show-${show.album._id}`}
							onClick={() => handleSelectShow(show)}
							className="group flex cursor-pointer gap-4 rounded-lg bg-melodio-dark-gray/50 p-3 transition-colors hover:bg-melodio-light-gray"
						>
							<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
								<AppImage
									src={getImageUrl(show.album.coverImageUrl)}
									alt={show.album.title}
									className="h-full w-full object-cover"
								/>
							</div>
							<div className="flex min-w-0 flex-1 flex-col justify-center">
								<p
									data-testid={`podcast-show-title-${show.album._id}`}
									className="truncate font-semibold text-white"
								>
									{show.album.title}
								</p>
								<p
									data-testid={`podcast-show-host-${show.album._id}`}
									className="truncate text-sm text-melodio-text-subdued"
								>
									{show.album.artistId?.name}
								</p>
								<div className="mt-2 flex items-center gap-2 text-xs text-melodio-text-subdued">
									<span data-testid={`podcast-show-episode-count-${show.album._id}`}>
										{show.episodeCount} episodes
									</span>
									<span className="text-melodio-text-subdued/40">&middot;</span>
									<span data-testid={`podcast-show-duration-${show.album._id}`}>
										{formatEpisodeDuration(show.totalDuration)}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
