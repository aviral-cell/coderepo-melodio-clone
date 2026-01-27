import { useState, useCallback } from "react";
import { UserPlus } from "lucide-react";

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
import { useToast } from "@/shared/hooks/useToast";
import { familyService } from "@/shared/services/family.service";

interface AddFamilyMemberModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

interface FormErrors {
	name?: string;
	email?: string;
	age?: string;
}

function validateName(value: string): string | undefined {
	if (!value.trim()) return "Name is required";
	if (value.trim().length < 2) return "Name must be at least 2 characters";
	if (value.trim().length > 50) return "Name must be less than 50 characters";
	return undefined;
}

function validateEmail(value: string): string | undefined {
	if (!value.trim()) return "Email is required";
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(value.trim())) return "Invalid email address";
	return undefined;
}

function validateAge(value: string): string | undefined {
	if (!value) return undefined; // Age is optional
	const age = parseInt(value, 10);
	if (isNaN(age)) return "Age must be a number";
	if (age < 0 || age > 150) return "Invalid age";
	return undefined;
}

export function AddFamilyMemberModal({
	open,
	onOpenChange,
	onSuccess,
}: AddFamilyMemberModalProps) {
	const { addToast } = useToast();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [age, setAge] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = useCallback(() => {
		setName("");
		setEmail("");
		setAge("");
		setErrors({});
	}, []);

	const handleClose = useCallback(() => {
		if (!isSubmitting) {
			resetForm();
			onOpenChange(false);
		}
	}, [isSubmitting, resetForm, onOpenChange]);

	const validateForm = useCallback((): boolean => {
		const newErrors: FormErrors = {
			name: validateName(name),
			email: validateEmail(email),
			age: validateAge(age),
		};

		setErrors(newErrors);
		return !Object.values(newErrors).some(Boolean);
	}, [name, email, age]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!validateForm()) {
				return;
			}

			setIsSubmitting(true);

			try {
				await familyService.addFamilyMember({
					name: name.trim(),
					email: email.trim().toLowerCase(),
					age: age ? parseInt(age, 10) : undefined,
				});

				resetForm();
				onSuccess();
			} catch (error) {
				addToast({
					type: "error",
					message:
						error instanceof Error
							? error.message
							: "Failed to add family member",
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[validateForm, name, email, age, resetForm, onSuccess, addToast]
	);

	const handleNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setName(e.target.value);
			if (errors.name) {
				setErrors((prev) => ({ ...prev, name: undefined }));
			}
		},
		[errors.name]
	);

	const handleEmailChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setEmail(e.target.value);
			if (errors.email) {
				setErrors((prev) => ({ ...prev, email: undefined }));
			}
		},
		[errors.email]
	);

	const handleAgeChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.replace(/\D/g, "");
			setAge(value);
			if (errors.age) {
				setErrors((prev) => ({ ...prev, age: undefined }));
			}
		},
		[errors.age]
	);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="border-melodio-light-gray bg-melodio-dark-gray sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-white">
						<UserPlus className="h-5 w-5 text-melodio-green" />
						Add Family Member
					</DialogTitle>
					<DialogDescription>
						Add a new family member to share your benefits
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Name */}
						<div className="space-y-2">
							<label
								htmlFor="family-member-name"
								className="text-sm font-medium text-white"
							>
								Name
							</label>
							<Input
								id="family-member-name"
								type="text"
								placeholder="Enter name"
								value={name}
								onChange={handleNameChange}
								className={`bg-melodio-light-gray ${
									errors.name ? "border-red-500" : ""
								}`}
								autoFocus
								data-testid="family-member-name-input"
							/>
							{errors.name && (
								<p className="text-xs text-red-500">{errors.name}</p>
							)}
						</div>

						{/* Email */}
						<div className="space-y-2">
							<label
								htmlFor="family-member-email"
								className="text-sm font-medium text-white"
							>
								Email
							</label>
							<Input
								id="family-member-email"
								type="email"
								placeholder="Enter email address"
								value={email}
								onChange={handleEmailChange}
								className={`bg-melodio-light-gray ${
									errors.email ? "border-red-500" : ""
								}`}
								data-testid="family-member-email-input"
							/>
							{errors.email && (
								<p className="text-xs text-red-500">{errors.email}</p>
							)}
						</div>

						{/* Age (Optional) */}
						<div className="space-y-2">
							<label
								htmlFor="family-member-age"
								className="text-sm font-medium text-white"
							>
								Age{" "}
								<span className="text-melodio-text-subdued">(optional)</span>
							</label>
							<Input
								id="family-member-age"
								type="text"
								placeholder="Enter age"
								value={age}
								onChange={handleAgeChange}
								className={`bg-melodio-light-gray ${
									errors.age ? "border-red-500" : ""
								}`}
								data-testid="family-member-age-input"
							/>
							{errors.age && (
								<p className="text-xs text-red-500">{errors.age}</p>
							)}
						</div>

						<div className="rounded-md bg-melodio-light-gray/50 p-3 text-xs text-melodio-text-subdued">
							Family members will have access to features and can be
							switched to from your account.
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							disabled={isSubmitting}
							data-testid="family-member-cancel-btn"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !name.trim() || !email.trim()}
							className="bg-melodio-green text-black hover:bg-melodio-green/90"
							data-testid="family-member-submit-btn"
						>
							{isSubmitting ? "Adding..." : "Add Member"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
