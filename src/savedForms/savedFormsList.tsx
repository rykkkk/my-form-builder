import React, { useState, useEffect } from "react";
import { FormSettings } from "../formRendering/Constants";
import { NewForm } from "../pages/createNewForm";
import { EditForm } from "../pages/editForm";
import { createFormExportPayload, downloadFormExport, parseSavedFormRecord, SavedFormRecord } from "./formExport";

export const SavedFormsList: React.FC = () => {
	const [forms, setForms] = useState<SavedFormRecord[]>([]);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);
	const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
	const [editFormProps, setEditFormProps] = useState<FormSettings | null>(null);

	useEffect(() => {
		const savedForms = JSON.parse(localStorage.getItem("savedForms") ?? "[]") as Partial<SavedFormRecord>[];
		setForms(savedForms.map((form) => parseSavedFormRecord(form)).filter((form): form is SavedFormRecord => !!form));
	}, []);

	const handleEdit = (formId: string) => {
		// TODO: Navigate to edit form page
		setSelectedFormId(formId);
		setShowEditForm(true);
	};

	/** Open the form's metadata/properties editor (the createNewForm screen). */
	const handleEditFormProperties = () => {
		if (!selectedFormId) return;
		const saved = JSON.parse(localStorage.getItem("savedForms") ?? "[]") as Partial<SavedFormRecord>[];
		const form = [...saved].reverse().map((item) => parseSavedFormRecord(item)).find((item): item is SavedFormRecord => !!item && item.formId === selectedFormId);
		if (form) setEditFormProps(form);
	};

	const handleExport = (formId: string) => {
		const form = [...forms].reverse().find((item) => item.formId === formId);
		if (!form) return;
		const payload = createFormExportPayload(form, form.pages ?? []);
		downloadFormExport(payload, `${form.formId}.json`);
	};

	const handleDelete = (_formId: string) => {
		// TODO: Delete form logic
	};

	const handleGoBack = () => {
		window.location.href = "/";
	};

	if (editFormProps) {
		return <NewForm initialForm={editFormProps} />;
	}
	if (showEditForm) {
		if (selectedFormId) {
			const selectedForm = forms.find((f) => f.formId === selectedFormId);
			return (
				<EditForm
					formId={selectedFormId}
					formName={selectedForm?.formName ?? { en: "", fr: "" }}
					onEditProperties={handleEditFormProperties}
				/>
			);
		}
	}
	if (showCreateForm) {
		return <NewForm />;
	}

	return (
		<div className='ontario-column ontario-small-12 ontario-large-12'>
			{/* Page heading */}
			<h1 className='ontario-h1'>Saved Forms</h1>
			<p className='ontario-lead-statement'>View and manage your previously saved forms.</p>

			{/* Forms table/cards section */}
			<section aria-labelledby='saved-forms-heading'>
				<h2 id='saved-forms-heading' className='ontario-h2'>
					Your Forms
				</h2>

				{forms.length > 0 ? (
					<div className='ontario-card__container'>
						{forms.map((form) => (
							<article key={form.formId} className='ontario-card ontario-card--default'>
								<div className='ontario-margin-left-16-!'>
									<h3 className='ontario-card__heading'>
										{form.formName.en}
										<span className='ontario-badge ontario-badge--default-light'>{form.formId}</span>
									</h3>

									<p>
										<strong>Project:</strong> {form.appTitle.en}
									</p>
									<p className='ontario-hint'>
										<strong>Created:</strong> {form.createdDate}
									</p>
									<p className='ontario-hint'>
										<strong>Version:</strong> {form.version}
									</p>

									{/* Form actions */}
									<div className='ontario-margin-top-16-!'>
										<button
											type='button'
											className='ontario-button ontario-button--primary'
											onClick={() => {
												setSelectedFormId(form.formId);
												handleEdit(form.formId);
											}}>
											Edit
										</button>
										<button type='button' className='ontario-button ontario-button--secondary' onClick={() => handleExport(form.formId)}>
											Export JSON payload
										</button>
										<button type='button' className='ontario-button ontario-button--secondary' onClick={() => handleDelete(form.formId)}>
											Delete
										</button>
									</div>
								</div>
							</article>
						))}
					</div>
				) : (
					<p className='ontario-hint'>No saved forms yet. Create your first form to get started.</p>
				)}
			</section>

			{/* Primary actions */}
			<div className='ontario-margin-top-32-!'>
				<button type='button' className='ontario-button ontario-button--primary' onClick={() => setShowCreateForm(true)}>
					Create New Form
				</button>
				<button type='button' className='ontario-button ontario-button--tertiary' onClick={handleGoBack}>
					Back to Home
				</button>
			</div>
		</div>
	);
};

export default SavedFormsList;
