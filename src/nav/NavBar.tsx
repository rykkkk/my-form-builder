import React from "react";
import "./NavBar.css";

export type AppView =
	| "home"
	| "create"
	| "saved"
	| "templates"
	| "settings"
	| "help";

interface NavItem {
	view: AppView;
	label: string;
}

const NAV_ITEMS: NavItem[] = [
	{ view: "home", label: "Dashboard" },
	{ view: "saved", label: "My Forms" },
	{ view: "templates", label: "Templates" },
	{ view: "settings", label: "Settings" },
	{ view: "help", label: "Help & Resources" },
];

interface NavBarProps {
	activeView: AppView;
	onNavigate: (view: AppView) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeView, onNavigate }) => {
	const handleClick =
		(view: AppView) => (event: React.MouseEvent<HTMLAnchorElement>) => {
			if (
				!event.metaKey &&
				!event.ctrlKey &&
				!event.shiftKey &&
				event.button === 0
			) {
				event.preventDefault();
				onNavigate(view);
			}
		};

	return (
		<div className='ontario-column ontario-small-12 ontario-large-12 app-navbar__inner'>
			<a href='/' className='app-navbar__brand' onClick={handleClick("home")}>
				Form Builder
			</a>

			<ul className='app-navbar__list'>
				{NAV_ITEMS.filter(
					(item) => !(activeView === "home" && item.view === "home"),
				).map((item) => {
					const isActive = item.view === activeView;
					return (
						<li key={item.view} className='app-navbar__item'>
							<a
								href={`/${item.view === "home" ? "" : item.view}`}
								className={`app-navbar__link${isActive ? " app-navbar__link--active" : ""}`}
								aria-current={isActive ? "page" : undefined}
								onClick={handleClick(item.view)}
							>
								{item.label}
							</a>
						</li>
					);
				})}
				<li></li>
			</ul>
		</div>
	);
};

export default NavBar;
