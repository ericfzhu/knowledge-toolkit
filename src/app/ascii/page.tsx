import Image from 'next/image';
import Link from 'next/link';

import ASCIIArtConverter from '@/app/ascii/ASCIIArtConverter';

export const dynamic = 'force-static';

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col px-20 py-12">
			<Link href="/" className="uppercase text-xl font-semibold mb-2 w-fit">
				Toolbox
			</Link>
			<Image src="icon.jpg" alt="icon" width={400} height={400} className="absolute top-12 right-20 h-10 w-10" />
			<h1 className="font-semibold text-2xl mb-4 ">ASCII Art Converter</h1>
			<ASCIIArtConverter />
		</main>
	);
}
