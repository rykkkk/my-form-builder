import React, { useState } from "react";
import { NewForm } from "./pages/createNewForm";
import SavedFormsList from "./savedForms/savedFormsList";
import NavBar, { AppView } from "./nav/NavBar";

const App: React.FC = () => {
	const [view, setView] = useState<AppView>("home");

	const renderView = () => {
		switch (view) {
			case "create":
				return <NewForm />;
			case "saved":
				return <SavedFormsList />;
			case "templates":
				return (
					<div className='ontario-column ontario-small-12 ontario-large-12'>
						<h1 className='ontario-h1'>Templates</h1>
						<p className='ontario-lead-statement'>Start from a pre-built form template.</p>
					</div>
				);
			case "settings":
				return (
					<div className='ontario-column ontario-small-12 ontario-large-12'>
						<h1 className='ontario-h1'>Settings</h1>
						<p className='ontario-lead-statement'>Manage your account and application preferences.</p>
					</div>
				);
			case "help":
				return (
					<div className='ontario-column ontario-small-12 ontario-large-12'>
						<h1 className='ontario-h1'>Help &amp; Resources</h1>
						<p className='ontario-lead-statement'>Guides and documentation for building accessible forms.</p>
					</div>
				);
			case "home":
			default:
				return (
					<div className='ontario-column ontario-small-12 ontario-large-12'>
						<h1 className='ontario-h1'>Form Builder</h1>
						<p className='ontario-lead-statement'>Create and manage your forms with ease.</p>
						<button type='button' className='ontario-button ontario-button--primary' onClick={() => setView("create")}>
							Create New Form
						</button>
						<button type='button' className='ontario-button ontario-button--secondary' onClick={() => setView("saved")}>
							View Saved Forms
						</button>
					</div>
				);
		}
	};

	return (
		<>
			<NavBar activeView={view} onNavigate={setView} />
			<main id='main-content'>
				<div className='ontario-column ontario-small-12 ontario-large-12'>{renderView()}</div>
			</main>
		</>
	);
};

export default App;
