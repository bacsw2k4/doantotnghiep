import React, { useState, useRef, useEffect } from "react";
import {
	ChevronDown,
	ChevronRight,
	Globe,
	User,
	Menu,
	Search,
	LogOut,
	LogIn,
	UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/components/ui/sheet";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CartComponent } from "@/components/cart-component";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useLanguageItem } from "@/hooks/useLanguageItem";
import { useCart } from "@/hooks/useCart";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { checkAuth, logoutUser } from "@/store/auth/auth-slice";
import { resetCart } from "@/store/cart/cart-slice";

interface MenuItem {
	id: string;
	lang_id: number;
	parentid: number | null;
	parentsid: string | null;
	name: string;
	href?: string;
	order: number;
	status: string;
	badge?: string;
	isNew?: boolean;
	isSale?: boolean;
	children?: MenuItem[];
}

interface Language {
	id: number;
	name: string;
	image: string;
	desc: string;
	order: number;
	status: string;
}

interface DesktopDropdownProps {
	items: MenuItem[];
	level?: number;
	onClose?: () => void;
}

const DesktopDropdown: React.FC<DesktopDropdownProps> = ({
	items,
	level = 0,
	onClose
}) => {
	const [activeItem, setActiveItem] = useState<string | null>(null);
	const timeoutRef = useRef<number | null>(null);

	const handleMouseEnter = (itemId: string) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		setActiveItem(itemId);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = setTimeout(() => {
			setActiveItem(null);
		}, 100);
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<div
			className={cn(
				"absolute bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/20 py-2 min-w-[240px] z-50 animate-in fade-in-0 zoom-in-95 duration-300",
				level === 0 ? "top-full left-0 mt-2" : "top-0 left-full ml-[2px]"
			)}
			onMouseLeave={handleMouseLeave}
		>
			{items.map((item) => (
				<div
					key={item.id}
					className="relative"
					onMouseEnter={() =>
						item.children &&
						item.children.length > 0 &&
						handleMouseEnter(item.id)
					}
				>
					<Link
						to={item.href || "#"}
						className={cn(
							"flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300 rounded-xl mx-1 group"
						)}
						onClick={item.href ? onClose : undefined}
					>
						<div className="flex items-center gap-3">
							<span>{item.name}</span>
							{item.badge && (
								<Badge
									variant={
										item.isSale
											? "destructive"
											: item.isNew
											? "default"
											: "secondary"
									}
									className="text-xs px-2 py-0.5"
								>
									{item.badge}
								</Badge>
							)}
							{item.isNew && !item.badge && (
								<Badge variant="default" className="text-xs px-2 py-0.5">
									New
								</Badge>
							)}
							{item.isSale && !item.badge && (
								<Badge variant="destructive" className="text-xs px-2 py-0.5">
									Sale
								</Badge>
							)}
						</div>
						{item.children && item.children.length > 0 && (
							<ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300" />
						)}
					</Link>

					{item.children &&
						item.children.length > 0 &&
						activeItem === item.id && (
							<DesktopDropdown
								items={item.children}
								level={level + 1}
								onClose={onClose}
							/>
						)}
				</div>
			))}
		</div>
	);
};

interface MobileMenuItemProps {
	item: MenuItem;
	level?: number;
	onClose: () => void;
}

const MobileMenuItem: React.FC<MobileMenuItemProps> = ({
	item,
	level = 0,
	onClose
}) => {
	if (!item.children || item.children.length === 0) {
		return (
			<Link
				to={item.href || "#"}
				className={cn(
					"flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300",
					level === 0 &&
						"bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm"
				)}
				onClick={onClose}
			>
				<span className="font-medium text-gray-900 dark:text-gray-100">
					{item.name}
				</span>
				{item.badge && (
					<Badge
						variant={
							item.isSale ? "destructive" : item.isNew ? "default" : "secondary"
						}
						className="text-xs px-2 py-0.5"
					>
						{item.badge}
					</Badge>
				)}
				{item.isNew && !item.badge && (
					<Badge variant="default" className="text-xs px-2 py-0.5">
						New
					</Badge>
				)}
				{item.isSale && !item.badge && (
					<Badge variant="destructive" className="text-xs px-2 py-0.5">
						Sale
					</Badge>
				)}
			</Link>
		);
	}

	const [isOpen, setIsOpen] = useState(false);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div
				className={cn(
					"space-y-1",
					level > 0 &&
						"ml-4 border-l-2 border-blue-200 dark:border-blue-800 pl-4"
				)}
			>
				<CollapsibleTrigger asChild>
					<div
						className={cn(
							"flex items-center justify-between w-full p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300 cursor-pointer group",
							level === 0 &&
								"bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm"
						)}
					>
						<div className="flex items-center gap-3">
							<span className="font-medium text-gray-900 dark:text-gray-100">
								{item.name}
							</span>
							{item.badge && (
								<Badge
									variant={
										item.isSale
											? "destructive"
											: item.isNew
											? "default"
											: "secondary"
									}
									className="text-xs px-2 py-0.5"
								>
									{item.badge}
								</Badge>
							)}
							{item.isNew && !item.badge && (
								<Badge variant="default" className="text-xs px-2 py-0.5">
									New
								</Badge>
							)}
							{item.isSale && !item.badge && (
								<Badge variant="destructive" className="text-xs px-2 py-0.5">
									Sale
								</Badge>
							)}
						</div>
						<ChevronDown
							className={cn(
								"w-4 h-4 text-gray-400 transition-transform duration-300",
								isOpen && "rotate-180"
							)}
						/>
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="space-y-1 animate-in slide-in-from-top-2 duration-300">
					{item.children.map((child) => (
						<MobileMenuItem
							key={child.id}
							item={child}
							level={level + 1}
							onClose={onClose}
						/>
					))}
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
};

interface MultilevelMenuProps {
	className?: string;
	selectedLangId: number;
	setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

const api = axios.create({
	baseURL: "http://localhost:8000/api/shopping",
	headers: {
		Authorization: `Bearer ${localStorage.getItem("token")}`
	}
});

const MultilevelMenu: React.FC<MultilevelMenuProps> = ({
	className,
	selectedLangId,
	setSelectedLangId
}) => {
	const [languages, setLanguages] = useState<Language[]>([]);
	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const timeoutRef = useRef<number | null>(null);
	const { getLanguageItem } = useLanguageItem(selectedLangId);
	const { totalItems, fetchCartItems } = useCart();
	const dispatch = useDispatch<AppDispatch>();
	const { isAuthenticated, user } = useSelector(
		(state: RootState) => state.auth
	);
	const navigate = useNavigate();

	useEffect(() => {
		dispatch(checkAuth());
	}, [dispatch]);

	useEffect(() => {
		fetchCartItems(selectedLangId);
	}, [selectedLangId]);

	useEffect(() => {
		const fetchLanguages = async () => {
			try {
				const response = await api.get("/languages");
				setLanguages(response.data.data || []);
			} catch (error) {}
		};

		fetchLanguages();
	}, []);

	useEffect(() => {
		const fetchMenus = async () => {
			try {
				const response = await api.get(`/menus?lang_id=${selectedLangId}`);
				setMenuItems(response.data.data || []);
			} catch (error) {}
		};

		fetchMenus();
	}, [selectedLangId]);

	const handleMouseEnter = (itemId: string) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		setActiveDropdown(itemId);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = setTimeout(() => {
			setActiveDropdown(null);
		}, 100);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	const handleLogout = async () => {
		try {
			await dispatch(logoutUser()).unwrap();
			await dispatch(resetCart());
			toast.success(getLanguageItem("logout_success" + " thành công"));
			closeMobileMenu();
		} catch (error: any) {}
	};

	// Hàm xử lý tìm kiếm: chuyển đến /categories với query ?q=...
	const handleSearch = () => {
		if (searchQuery.trim()) {
			navigate(`/categories?q=${encodeURIComponent(searchQuery.trim())}`);
			setSearchQuery(""); // Xóa input sau khi tìm
		}
	};

	// Cho phép Enter trong input cũng trigger tìm kiếm
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	return (
		<nav
			className={cn(
				"fixed top-0 left-0 w-full z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50",
				className
			)}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex-shrink-0">
						<Link
							to="/"
							className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
						>
							ShopLogo
						</Link>
					</div>

					<div className="hidden lg:flex items-center space-x-1">
						{menuItems.map((item) => (
							<div
								key={item.id}
								className="relative"
								onMouseEnter={() =>
									item.children &&
									item.children.length > 0 &&
									handleMouseEnter(item.id)
								}
								onMouseLeave={() =>
									item.children &&
									item.children.length > 0 &&
									handleMouseLeave()
								}
							>
								<Link
									to={item.href || "#"}
									className={cn(
										"flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 group cursor-pointer relative"
									)}
								>
									{item.name}
									{item.children && item.children.length > 0 && (
										<ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:rotate-180" />
									)}
									{item.badge && (
										<Badge
											variant={
												item.isSale
													? "destructive"
													: item.isNew
													? "default"
													: "secondary"
											}
											className="text-xs px-2 py-0.5 ml-1"
										>
											{item.badge}
										</Badge>
									)}
								</Link>

								{item.children &&
									item.children.length > 0 &&
									activeDropdown === item.id && (
										<DesktopDropdown
											items={item.children}
											onClose={() => setActiveDropdown(null)}
										/>
									)}
							</div>
						))}
					</div>

					<div className="flex items-center gap-3">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									className="
                    flex items-center gap-2 text-sm font-medium 
                    p-2 rounded-xl 
                    bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-900/50
                    border border-blue-100/50 dark:border-gray-700/50
                    hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 
                    dark:hover:from-gray-700/60 dark:hover:to-gray-800/60
                    hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-indigo-500/10
                    transition-all duration-300 ease-out
                    group
                  "
								>
									<div className="relative">
										<Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors" />
										<div className="absolute -inset-1 bg-blue-200/20 dark:bg-blue-400/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
									</div>
									<span className="hidden sm:inline transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
										{languages.find((lang) => lang.id === selectedLangId)
											?.name || "VN"}
									</span>
									<span className="sm:hidden">
										{languages.find((lang) => lang.id === selectedLangId)?.image
											? "🌐"
											: "VN"}
									</span>
									<ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="
                  w-56 z-50 min-w-0 
                  bg-white/95 dark:bg-gray-900/95 
                  backdrop-blur-xl
                  border border-white/20 dark:border-gray-700/50
                  rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/20
                  animate-in slide-in-from-top-2 fade-in-0 zoom-in-95 duration-300
                "
								sideOffset={12}
							>
								<div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800/50 dark:to-gray-900/50">
									<h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
										{getLanguageItem("language", "")}
									</h4>
								</div>

								{languages.length > 0 ? (
									<div className="py-1">
										{languages.map((lang) => {
											const isActive = selectedLangId === lang.id;
											return (
												<DropdownMenuItem
													key={lang.id}
													onClick={() => setSelectedLangId(lang.id)}
													className={cn(
														"flex items-center gap-3 cursor-pointer py-3 px-4 w-full min-w-0 mx-1 rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50",
														isActive &&
															"bg-gradient-to-r from-blue-500/10 to-indigo-500/10 shadow-inner shadow-blue-500/20 dark:shadow-indigo-500/20"
													)}
												>
													<div
														className={cn(
															"relative flex-shrink-0 w-8 h-5 rounded-lg overflow-hidden border-2 transition-all duration-200",
															isActive
																? "border-blue-500 shadow-md shadow-blue-200/50 dark:shadow-blue-500/20"
																: "border-gray-200 dark:border-gray-700"
														)}
													>
														<img
															width={24}
															height={16}
															src={`http://localhost:8000${lang.image}`}
															alt={lang.name}
															className="w-full h-full object-cover rounded-md"
														/>
														{isActive && (
															<div className="absolute inset-0 bg-blue-500/20 rounded-lg animate-pulse" />
														)}
													</div>

													<div className="flex-1 min-w-0">
														<span
															className={cn(
																"text-sm font-medium truncate",
																isActive
																	? "text-blue-700 dark:text-blue-300"
																	: "text-gray-700 dark:text-gray-200"
															)}
														>
															{lang.name}
														</span>
														<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
															{lang.desc || lang.name}
														</p>
													</div>

													{isActive && (
														<div
															className="
                                w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 
                                rounded-full flex items-center justify-center
                                shadow-lg shadow-blue-500/25
                              "
														>
															<div className="w-2 h-2 bg-white rounded-full animate-bounce" />
														</div>
													)}
												</DropdownMenuItem>
											);
										})}
									</div>
								) : (
									<DropdownMenuItem disabled className="py-8 justify-center">
										<div className="flex flex-col items-center space-y-2">
											<div className="w-6 h-6 border-2 border-blue-200 dark:border-blue-800 border-t-blue-500 rounded-full animate-spin" />
											<span className="text-gray-500 dark:text-gray-400 text-sm">
												Loading...
											</span>
										</div>
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>

						<div className="hidden sm:flex items-center max-w-xs w-80">
							<div className="relative w-full group">
								<Input
									type="text"
									placeholder={getLanguageItem(
										"home_search",
										"Tìm kiếm sản phẩm..."
									)}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onKeyDown={handleKeyDown}
									className="w-full pl-4 py-3 rounded-2xl 
                bg-white dark:bg-gray-900
                border-2 border-gray-200 dark:border-gray-700
                text-gray-800 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:border-blue-500
                transition-all duration-300
                group-hover:border-blue-400 dark:group-hover:border-blue-600" 
								/>
								<button
									onClick={handleSearch}
									className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl cursor-pointer bg-transparenttext-gray-400 hover:text-blue-500 group-hover:text-blue-500 group-focus-within:text-blue-500"
									title="Tìm kiếm"
								>
									<Search className="w-5 h-5" />
								</button>
							</div>
						</div>

						<CartComponent selectedLangId={selectedLangId} />

						{isAuthenticated ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className="hidden sm:flex p-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300">
										<User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56 z-50 rounded-2xl"
								>
									<Link to="/profile">
										<div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
											<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
												{getLanguageItem("account")}
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{user?.email || "user@example.com"}
											</p>
										</div>
									</Link>
									<div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
										<DropdownMenuItem
											className="cursor-pointer text-red-600 dark:text-red-400 rounded-xl mx-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
											onClick={handleLogout}
										>
											<LogOut className="w-4 h-4 mr-3" />
											<span>{getLanguageItem("logout")}</span>
										</DropdownMenuItem>
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<div className="hidden sm:flex items-center gap-2">
								<Link
									to="/login"
									className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50"
								>
									<LogIn className="w-4 h-4" />
									<span>{getLanguageItem("login")}</span>
								</Link>
								<Link
									to="/register"
									className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50"
								>
									<UserPlus className="w-4 h-4" />
									<span>{getLanguageItem("register")}</span>
								</Link>
							</div>
						)}

						<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="lg:hidden p-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300"
								>
									<Menu className="w-6 h-6" />
								</Button>
							</SheetTrigger>
							<SheetContent
								side="right"
								className="w-full sm:w-96 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
							>
								<SheetHeader className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
									<SheetTitle className="text-left font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
										Menu
									</SheetTitle>
								</SheetHeader>

								<div className="p-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
									<div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-blue-100/50 dark:border-gray-700/50">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<button className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-900/50">
													<div className="flex items-center gap-3">
														<Globe className="w-5 h-5 text-blue-600" />
														<span className="font-semibold">
															{languages.find(
																(lang) => lang.id === selectedLangId
															)?.name || "VN"}
														</span>
													</div>
													<ChevronDown className="w-5 h-5" />
												</button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="start"
												className="w-full rounded-2xl"
											>
												{languages.map((lang) => {
													const isActive = selectedLangId === lang.id;
													return (
														<DropdownMenuItem
															key={lang.id}
															onClick={() => setSelectedLangId(lang.id)}
															className={cn(
																"flex items-center gap-3 py-3 px-4 w-full rounded-xl mx-1",
																isActive &&
																	"bg-gradient-to-r from-blue-500/10 to-indigo-500/10"
															)}
														>
															<img
																width={20}
																height={14}
																src={`http://localhost:8000${lang.image}`}
																alt={lang.name}
																className="rounded"
															/>
															<span
																className={cn(
																	"font-medium",
																	isActive && "text-blue-600"
																)}
															>
																{lang.name}
															</span>
														</DropdownMenuItem>
													);
												})}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>

									{/* Search trong mobile menu */}
									<div className="flex items-center gap-2 p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
										<Search className="w-4 h-4 text-gray-400" />
										<input
											type="text"
											placeholder={getLanguageItem("home_search", "")}
											className="flex-1 bg-transparent border-none outline-none text-sm"
										/>
									</div>

									<div className="space-y-2">
										{isAuthenticated ? (
											<>
												<Link
													to="/profile"
													className="flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 shadow-sm backdrop-blur-sm transition-all duration-300"
													onClick={closeMobileMenu}
												>
													<User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
													<div className="flex-1">
														<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
															{getLanguageItem("account")}
														</p>
														<p className="text-xs text-gray-500 dark:text-gray-400">
															{user?.email || "user@example.com"}
														</p>
													</div>
												</Link>
												<button
													className="flex items-center gap-3 p-3 w-full text-left text-red-600 dark:text-red-400 bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
													onClick={handleLogout}
												>
													<LogOut className="w-5 h-5" />
													<span className="font-medium">
														{getLanguageItem("logout")}
													</span>
												</button>
											</>
										) : (
											<>
												<Link
													to="/login"
													className="flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 shadow-sm backdrop-blur-sm transition-all duration-300"
													onClick={closeMobileMenu}
												>
													<LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
													<span className="font-medium text-gray-900 dark:text-gray-100">
														{getLanguageItem("login")}
													</span>
												</Link>
												<Link
													to="/register"
													className="flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 shadow-sm backdrop-blur-sm transition-all duration-300"
													onClick={closeMobileMenu}
												>
													<UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
													<span className="font-medium text-gray-900 dark:text-gray-100">
														{getLanguageItem("register")}
													</span>
												</Link>
											</>
										)}
									</div>

									{menuItems.map((item) => (
										<MobileMenuItem
											key={item.id}
											item={item}
											onClose={closeMobileMenu}
										/>
									))}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default MultilevelMenu;
