import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className='ontario-column ontario-small-12 ontario-large-12'>
            <h1 className='ontario-h1'>Form Builder</h1>
            <p className='ontario-lead-statement'>Create and manage your forms with ease.</p>
            <Link
                to="/create"
                className="ontario-button ontario-button--primary"
            >
                Create New Form
            </Link>
            <Link
                to="/saved"
                className="ontario-button ontario-button--primary"
            >
                View Saved Forms
            </Link>
        </div>
    );
}