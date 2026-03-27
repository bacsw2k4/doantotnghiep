import { Outlet } from "react-router-dom";
import MultilevelMenu from "@/components/multilevel-menu";
import { Footer } from "@/components/footer";
import PromotionPopup from "@/components/promotion-popup";
import ChatBot from "@/components/chatBot";

interface LayoutContext {
	selectedLangId: number;
	setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

interface LayoutProps {
	context: LayoutContext;
}

export default function Layout({ context }: LayoutProps) {
	const { selectedLangId, setSelectedLangId } = context;
	return (
		<div className="min-h-screen bg-background">
			<MultilevelMenu
				selectedLangId={selectedLangId}
				setSelectedLangId={setSelectedLangId}
			/>
			<main>
				<Outlet context={context} />
			</main>
			<ChatBot />
			<PromotionPopup
				variant="elegant"
				delayMs={8000}
				selectedLangId={selectedLangId}
			/>
			<Footer langId={selectedLangId} />
		</div>
	);
}
