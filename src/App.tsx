import { NewForm } from "./pages/createNewForm";
import SavedFormsList from "./routes/SavedFormList/SavedFormsList";
import NavBar from "./nav/NavBar";
import Home from "./routes/Home";
import Help from "./routes/Help";
import Settings from "./routes/Settings";
import Templates from "./routes/Templates";

import { FormEditor } from "./routes/EditForm/FormEditor";

import {
  createBrowserRouter,
  RouterProvider,
  Outlet
} from "react-router-dom";

const router = createBrowserRouter([{
	element: <>
		<NavBar />
		<main id='main-content'>
			<div className='ontario-column ontario-small-12 ontario-large-12'>
				<Outlet />
			</div>
		</main>
	</>,
	children: [
		{
			path: "/",
			element: <Home />,
		},
		{
			path: "/help",
			element: <Help />,
		},
		{
			path: "/settings",
			element: <Settings />,
		},
		{
			path: "/templates",
			element: <Templates />,
		},
		{
			path: "/create",
			element: <NewForm />,
		},
		{
			path: "/saved",
			element: <SavedFormsList />,
		},

		{
			path: "/test",
			element: <FormEditor />,
		},
	]
}])

export default function App() {
	return <RouterProvider router={router} />;
};