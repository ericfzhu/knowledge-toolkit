'use client';

import { IconDownload } from '@tabler/icons-react';
import Image from 'next/image';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

export default function DotPatternConverter() {
	const [originalImage, setOriginalImage] = useState<string | null>(null);
	const [convertedImage, setConvertedImage] = useState<string | null>(null);
	const [dotSize, setDotSize] = useState<number>(5); // Default dot size in pixels
	const [comparePosition, setComparePosition] = useState<number>(50);
	const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const compareContainerRef = useRef<HTMLDivElement>(null);
	const sliderRef = useRef<HTMLDivElement>(null);

	const handleImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setOriginalImage(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	}, []);

	const handleDotSizeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setDotSize(Number(event.target.value));
	}, []);

	const convertImage = useCallback(() => {
		if (!originalImage || !canvasRef.current) return;

		const img = new window.Image();
		img.onload = () => {
			const canvas = canvasRef.current!;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			canvas.width = img.width;
			canvas.height = img.height;
			setImageDimensions({ width: img.width, height: img.height });

			// Draw original image
			ctx.drawImage(img, 0, 0);

			// Get image data
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;

			// Create a new canvas for the dot pattern
			const dotCanvas = document.createElement('canvas');
			dotCanvas.width = canvas.width;
			dotCanvas.height = canvas.height;
			const dotCtx = dotCanvas.getContext('2d')!;

			// Create dot pattern
			for (let y = 0; y < canvas.height; y += dotSize) {
				for (let x = 0; x < canvas.width; x += dotSize) {
					let r = 0,
						g = 0,
						b = 0,
						count = 0;

					// Calculate average color for the dot area
					for (let dy = 0; dy < dotSize && y + dy < canvas.height; dy++) {
						for (let dx = 0; dx < dotSize && x + dx < canvas.width; dx++) {
							const i = ((y + dy) * canvas.width + (x + dx)) * 4;
							r += data[i];
							g += data[i + 1];
							b += data[i + 2];
							count++;
						}
					}

					// Draw the dot
					dotCtx.fillStyle = `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
					dotCtx.beginPath();
					dotCtx.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
					dotCtx.fill();
				}
			}

			// Set the converted image
			setConvertedImage(dotCanvas.toDataURL('image/png'));
		};
		img.src = originalImage;
	}, [originalImage, dotSize]);

	useEffect(() => {
		if (originalImage) {
			convertImage();
		}
	}, [originalImage, dotSize, convertImage]);

	const handleSliderDrag = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const container = compareContainerRef.current;
			if (!container || !imageDimensions) return;

			const containerRect = container.getBoundingClientRect();

			const handleDrag = (e: MouseEvent) => {
				const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
				setComparePosition(Math.min(Math.max(newPosition, 0), 100));
			};

			const handleDragEnd = () => {
				document.removeEventListener('mousemove', handleDrag);
				document.removeEventListener('mouseup', handleDragEnd);
			};

			document.addEventListener('mousemove', handleDrag);
			document.addEventListener('mouseup', handleDragEnd);
		},
		[imageDimensions],
	);

	const handleDownload = useCallback(() => {
		if (convertedImage) {
			const link = document.createElement('a');
			link.href = convertedImage;
			link.download = 'converted-image.png';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}, [convertedImage]);

	return (
		<div className="space-y-4">
			<input
				type="file"
				accept="image/*"
				onChange={handleImageUpload}
				className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100"
			/>
			<div className="flex items-center space-x-2">
				<label htmlFor="dotSize">Dot Size: {dotSize}px</label>
				<input type="range" id="dotSize" value={dotSize} onChange={handleDotSizeChange} min="1" max="50" className="w-full" />
			</div>
			{originalImage && convertedImage && imageDimensions && (
				<div className="flex flex-col items-center space-y-4">
					<div
						className="relative"
						ref={compareContainerRef}
						style={{
							width: `min(50vw, ${imageDimensions.width}px)`,
							height: `min(50vw, ${imageDimensions.height}px)`,
							aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
						}}>
						<Image
							src={originalImage}
							alt="Original"
							className="absolute top-0 left-0 select-none pointer-events-none object-contain"
							style={{
								clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
							}}
							fill
							sizes="50vw"
						/>
						<Image
							src={convertedImage}
							alt="Converted"
							className="absolute top-0 left-0 select-none pointer-events-none object-contain"
							style={{
								clipPath: `inset(0 0 0 ${comparePosition}%)`,
							}}
							fill
							sizes="50vw"
						/>
						<div
							ref={sliderRef}
							style={{
								position: 'absolute',
								top: 0,
								left: `${comparePosition}%`,
								width: '4px',
								height: '100%',
								backgroundColor: 'white',
								cursor: 'ew-resize',
							}}
							onMouseDown={handleSliderDrag}
						/>
					</div>
					<button
						onClick={handleDownload}
						className="bg-zinc-500 hover:bg-zinc-700 text-white font-bold p-2"
						aria-label="Download converted image">
						<IconDownload size={24} />
					</button>
				</div>
			)}
			<canvas ref={canvasRef} style={{ display: 'none' }} />
		</div>
	);
}
