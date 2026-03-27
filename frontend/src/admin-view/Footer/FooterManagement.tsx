"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useOutletContext } from "react-router-dom";

interface LayoutContext {
	selectedLangId: number;
	setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

interface Link {
	name: string;
	href: string;
}

interface Section {
	title: string;
	links: Link[];
}

interface Feature {
	title: string;
	description: string;
}

interface Badge {
	name: string;
}

interface PaymentMethod {
	name: string;
	logo?: string | File;
}

interface Footer {
	id?: string;
	lang_id: number;
	company: Section;
	support: Section;
	categories: Section;
	legal: Section;
	features: Feature[];
	company_description: string;
	contact_address: string;
	contact_phone: string;
	contact_email: string;
	social_facebook?: string;
	social_instagram?: string;
	social_twitter?: string;
	social_youtube?: string;
	bottom_copyright: string;
	badges: Badge[];
	payment_methods: PaymentMethod[];
	status: string;
	order: number;
}

const FooterManagement: React.FC = () => {
	const { selectedLangId } = useOutletContext<LayoutContext>();
	const [formData, setFormData] = useState<Footer>({
		lang_id: selectedLangId,
		company: { title: "", links: [] },
		support: { title: "", links: [] },
		categories: { title: "", links: [] },
		legal: { title: "", links: [] },
		features: [],
		company_description: "",
		contact_address: "",
		contact_phone: "",
		contact_email: "",
		social_facebook: "",
		social_instagram: "",
		social_twitter: "",
		social_youtube: "",
		bottom_copyright: "",
		badges: [],
		payment_methods: [],
		status: "active",
		order: 0
	});

	useEffect(() => {
		fetchFooter();
	}, [selectedLangId]);

	const fetchFooter = async () => {
		try {
			const response = await axios.get("http://localhost:8000/api/footers", {
				params: { lang_id: selectedLangId },
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
			});
			const footer = response.data.data?.[0] || {
				lang_id: selectedLangId,
				company: { title: "", links: [] },
				support: { title: "", links: [] },
				categories: { title: "", links: [] },
				legal: { title: "", links: [] },
				features: [],
				company_description: "",
				contact_address: "",
				contact_phone: "",
				contact_email: "",
				social_facebook: "",
				social_instagram: "",
				social_twitter: "",
				social_youtube: "",
				bottom_copyright: "",
				badges: [],
				payment_methods: [],
				status: "active",
				order: 0
			};
			setFormData(footer);
		} catch (error) {
			toast.error("Không thể tải dữ liệu footer");
			console.error("Fetch Footer Error:", error);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const formDataToSend = new FormData();
			formDataToSend.append("lang_id", formData.lang_id.toString());

			// Append section fields
			["company", "support", "categories", "legal"].forEach((section) => {
				const sec =
					formData[
						section as keyof Pick<
							Footer,
							"company" | "support" | "categories" | "legal"
						>
					];
				formDataToSend.append(`${section}[title]`, sec?.title || "");
				sec?.links.forEach((link, index) => {
					formDataToSend.append(`${section}[links][${index}][name]`, link.name);
					formDataToSend.append(`${section}[links][${index}][href]`, link.href);
				});
			});

			// Append features
			formData.features.forEach((feature, index) => {
				formDataToSend.append(`features[${index}][title]`, feature.title);
				formDataToSend.append(
					`features[${index}][description]`,
					feature.description
				);
			});

			// Append badges
			formData.badges.forEach((badge, index) => {
				formDataToSend.append(`badges[${index}][name]`, badge.name);
			});

			// Append payment methods
			formData.payment_methods.forEach((method, index) => {
				formDataToSend.append(`payment_methods[${index}][name]`, method.name);
				// Only append logo if it’s a File object (new upload)
				if (method.logo instanceof File) {
					const validImageTypes = [
						"image/jpeg",
						"image/png",
						"image/gif",
						"image/webp"
					];
					if (validImageTypes.includes(method.logo.type)) {
						formDataToSend.append(
							`payment_methods[${index}][logo]`,
							method.logo
						);
					} else {
						toast.error(
							`Logo cho phương thức thanh toán ${method.name} không phải là tệp hình ảnh hợp lệ.`
						);
					}
				}
				// If logo is a string (URL), skip appending or handle it differently
				// Optionally, you can send the existing URL to the backend if it supports it
				// Example: formDataToSend.append(`payment_methods[${index}][logo_url]`, method.logo || '');
			});

			// Append simple fields
			formDataToSend.append(
				"company_description",
				formData.company_description || ""
			);
			formDataToSend.append("contact_address", formData.contact_address || "");
			formDataToSend.append("contact_phone", formData.contact_phone || "");
			formDataToSend.append("contact_email", formData.contact_email || "");
			formDataToSend.append("social_facebook", formData.social_facebook || "");
			formDataToSend.append(
				"social_instagram",
				formData.social_instagram || ""
			);
			formDataToSend.append("social_twitter", formData.social_twitter || "");
			formDataToSend.append("social_youtube", formData.social_youtube || "");
			formDataToSend.append(
				"bottom_copyright",
				formData.bottom_copyright || ""
			);
			formDataToSend.append("status", formData.status);
			formDataToSend.append("order", formData.order.toString());

			// Debug FormData content
			for (const [key, value] of formDataToSend.entries()) {
				console.log(`${key}: ${value instanceof File ? value.name : value}`);
			}

			if (formData.id) {
				formDataToSend.append("_method", "PUT");
				await axios.post(
					`http://localhost:8000/api/footers/${formData.id}`,
					formDataToSend,
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
							"Content-Type": "multipart/form-data"
						}
					}
				);
				toast.success("Cập nhật footer thành công");
			} else {
				await axios.post("http://localhost:8000/api/footers", formDataToSend, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						"Content-Type": "multipart/form-data"
					}
				});
				toast.success("Tạo footer thành công");
			}
			fetchFooter();
		} catch (error: any) {
			toast.error(
				"Lỗi khi lưu footer: " +
					(error.response?.data?.message || error.message)
			);
			console.error("Save Footer Error:", error.response?.data || error);
		}
	};

	const updateField = (field: keyof Footer, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const addLink = (
		section: keyof Pick<Footer, "company" | "support" | "categories" | "legal">
	) => {
		setFormData((prev) => ({
			...prev,
			[section]: {
				title: prev[section]?.title || "",
				links: [...(prev[section]?.links || []), { name: "", href: "" }]
			}
		}));
	};

	const updateLink = (
		section: keyof Pick<Footer, "company" | "support" | "categories" | "legal">,
		index: number,
		field: "name" | "href",
		value: string
	) => {
		setFormData((prev) => ({
			...prev,
			[section]: {
				title: prev[section]?.title || "",
				links: (prev[section]?.links || []).map((link: Link, i: number) =>
					i === index ? { ...link, [field]: value } : link
				)
			}
		}));
	};

	const removeLink = (
		section: keyof Pick<Footer, "company" | "support" | "categories" | "legal">,
		index: number
	) => {
		setFormData((prev) => ({
			...prev,
			[section]: {
				title: prev[section]?.title || "",
				links: (prev[section]?.links || []).filter(
					(_: Link, i: number) => i !== index
				)
			}
		}));
	};

	const addFeature = () => {
		setFormData((prev) => ({
			...prev,
			features: [...(prev.features || []), { title: "", description: "" }]
		}));
	};

	const updateFeature = (
		index: number,
		field: "title" | "description",
		value: string
	) => {
		setFormData((prev) => ({
			...prev,
			features: (prev.features || []).map((feature: Feature, i: number) =>
				i === index ? { ...feature, [field]: value } : feature
			)
		}));
	};

	const removeFeature = (index: number) => {
		setFormData((prev) => ({
			...prev,
			features: (prev.features || []).filter(
				(_: Feature, i: number) => i !== index
			)
		}));
	};

	const addBadge = () => {
		setFormData((prev) => ({
			...prev,
			badges: [...(prev.badges || []), { name: "" }]
		}));
	};

	const updateBadge = (index: number, value: string) => {
		setFormData((prev) => ({
			...prev,
			badges: (prev.badges || []).map((badge: Badge, i: number) =>
				i === index ? { name: value } : badge
			)
		}));
	};

	const removeBadge = (index: number) => {
		setFormData((prev) => ({
			...prev,
			badges: (prev.badges || []).filter((_: Badge, i: number) => i !== index)
		}));
	};

	const addPaymentMethod = () => {
		setFormData((prev) => ({
			...prev,
			payment_methods: [
				...(prev.payment_methods || []),
				{ name: "", logo: undefined }
			]
		}));
	};

	const updatePaymentMethod = (
		index: number,
		field: "name" | "logo",
		value: string | File
	) => {
		setFormData((prev) => ({
			...prev,
			payment_methods: (prev.payment_methods || []).map(
				(method: PaymentMethod, i: number) =>
					i === index ? { ...method, [field]: value } : method
			)
		}));
	};

	const removePaymentMethod = (index: number) => {
		setFormData((prev) => ({
			...prev,
			payment_methods: (prev.payment_methods || []).filter(
				(_: PaymentMethod, i: number) => i !== index
			)
		}));
	};

	return (
		<div className="w-full mx-auto p-4">
			<Card>
				<CardHeader>
					<CardTitle>Quản lý Footer</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{(["company", "support", "categories", "legal"] as const).map(
							(section) => (
								<div key={section}>
									<Label>
										{section.charAt(0).toUpperCase() + section.slice(1)}
									</Label>
									<Input
										placeholder={`Tiêu đề ${section}`}
										value={formData[section]?.title || ""}
										onChange={(e) =>
											updateField(section, {
												...formData[section],
												title: e.target.value
											})
										}
									/>
									<div className="mt-2 space-y-2">
										{formData[section]?.links?.map(
											(link: Link, index: number) => (
												<div key={index} className="flex gap-2 items-center">
													<Input
														placeholder="Tên liên kết"
														value={link.name}
														onChange={(e) =>
															updateLink(section, index, "name", e.target.value)
														}
													/>
													<Input
														placeholder="URL"
														value={link.href}
														onChange={(e) =>
															updateLink(section, index, "href", e.target.value)
														}
													/>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														onClick={() => removeLink(section, index)}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											)
										)}
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => addLink(section)}
										>
											<Plus className="w-4 h-4 mr-2" /> Thêm liên kết
										</Button>
									</div>
								</div>
							)
						)}

						<div>
							<Label>Tính năng</Label>
							<div className="space-y-2">
								{formData.features?.map((feature: Feature, index: number) => (
									<div key={index} className="flex gap-2 items-center">
										<Input
											placeholder="Tiêu đề tính năng"
											value={feature.title}
											onChange={(e) =>
												updateFeature(index, "title", e.target.value)
											}
										/>
										<Input
											placeholder="Mô tả"
											value={feature.description}
											onChange={(e) =>
												updateFeature(index, "description", e.target.value)
											}
										/>
										<Button
											type="button"
											variant="destructive"
											size="sm"
											onClick={() => removeFeature(index)}
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addFeature}
								>
									<Plus className="w-4 h-4 mr-2" /> Thêm tính năng
								</Button>
							</div>
						</div>

						<div>
							<Label>Mô tả công ty</Label>
							<Textarea
								value={formData.company_description || ""}
								onChange={(e) =>
									updateField("company_description", e.target.value)
								}
							/>
						</div>

						<div>
							<Label>Địa chỉ liên hệ</Label>
							<Input
								value={formData.contact_address || ""}
								onChange={(e) => updateField("contact_address", e.target.value)}
							/>
						</div>

						<div>
							<Label>Số điện thoại</Label>
							<Input
								value={formData.contact_phone || ""}
								onChange={(e) => updateField("contact_phone", e.target.value)}
							/>
						</div>

						<div>
							<Label>Email</Label>
							<Input
								type="email"
								value={formData.contact_email || ""}
								onChange={(e) => updateField("contact_email", e.target.value)}
							/>
						</div>

						<div>
							<Label>Facebook URL</Label>
							<Input
								value={formData.social_facebook || ""}
								onChange={(e) => updateField("social_facebook", e.target.value)}
							/>
						</div>

						<div>
							<Label>Instagram URL</Label>
							<Input
								value={formData.social_instagram || ""}
								onChange={(e) =>
									updateField("social_instagram", e.target.value)
								}
							/>
						</div>

						<div>
							<Label>Twitter URL</Label>
							<Input
								value={formData.social_twitter || ""}
								onChange={(e) => updateField("social_twitter", e.target.value)}
							/>
						</div>

						<div>
							<Label>YouTube URL</Label>
							<Input
								value={formData.social_youtube || ""}
								onChange={(e) => updateField("social_youtube", e.target.value)}
							/>
						</div>

						<div>
							<Label>Bản quyền dưới cùng</Label>
							<Input
								value={formData.bottom_copyright || ""}
								onChange={(e) =>
									updateField("bottom_copyright", e.target.value)
								}
							/>
						</div>

						<div>
							<Label>Huy hiệu</Label>
							<div className="space-y-2">
								{formData.badges?.map((badge: Badge, index: number) => (
									<div key={index} className="flex gap-2 items-center">
										<Input
											placeholder="Tên huy hiệu"
											value={badge.name}
											onChange={(e) => updateBadge(index, e.target.value)}
										/>
										<Button
											type="button"
											variant="destructive"
											size="sm"
											onClick={() => removeBadge(index)}
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addBadge}
								>
									<Plus className="w-4 h-4 mr-2" /> Thêm huy hiệu
								</Button>
							</div>
						</div>

						<div>
							<Label>Phương thức thanh toán</Label>
							<div className="space-y-2">
								{formData.payment_methods?.map(
									(method: PaymentMethod, index: number) => (
										<div key={index} className="flex gap-2 items-center">
											<Input
												placeholder="Tên phương thức"
												value={method.name}
												onChange={(e) =>
													updatePaymentMethod(index, "name", e.target.value)
												}
											/>
											<div className="flex flex-col gap-1">
												<Input
													type="file"
													accept="image/*"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) {
															updatePaymentMethod(index, "logo", file);
														}
													}}
												/>
												{method.logo && typeof method.logo === "string" && (
													<img
														src={method.logo}
														alt={method.name}
														className="h-10 w-auto mt-1 rounded"
													/>
												)}
											</div>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => removePaymentMethod(index)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									)
								)}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addPaymentMethod}
								>
									<Plus className="w-4 h-4 mr-2" /> Thêm phương thức thanh toán
								</Button>
							</div>
						</div>

						<div>
							<Label>Trạng thái</Label>
							<select
								value={formData.status}
								onChange={(e) => updateField("status", e.target.value)}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>

						<div>
							<Label>Thứ tự</Label>
							<Input
								type="number"
								value={formData.order || 0}
								onChange={(e) => updateField("order", parseInt(e.target.value))}
							/>
						</div>

						<Button type="submit">Lưu</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default FooterManagement;
