import "./NavBar.css";
import { useLocation, useNavigate, Link } from "react-router-dom";

interface NavItem {
	label: string;
	route: string;
}

const NAV_ITEMS: NavItem[] = [
	{ label: "Dashboard", route: "/" },
	{ label: "My Forms", route: "/saved" },
	{ label: "Templates", route: "/templates"  },
	{ label: "Settings", route: "/settings"  },
	{ label: "Help & Resources", route: "/help"  },
];

export default function NavBar() {
	const location = useLocation();
	const navigate = useNavigate()

	return (
		<div className='ontario-column ontario-small-12 ontario-large-12 app-navbar__inner'>
			<a href='/' className='app-navbar__brand' onClick={() => navigate("/")}>
				Form Builder
			</a>

			<ul className='app-navbar__list'>
				{NAV_ITEMS.filter(
					(item) => !(location.pathname === "home" && item.route === "home"),
				).map((item) => {
					const isActive = location.pathname == item.route;
					return (
					<li key={item.route} className="app-navbar__item">
						<Link
						to={item.route}
						className={`app-navbar__link${
							isActive ? " app-navbar__link--active" : ""
						}`}
						aria-current={isActive ? "page" : undefined}
						>
						{item.label}
						</Link>
					</li>
					);
				})}
				<li></li>
			</ul>
		</div>
	);
};
