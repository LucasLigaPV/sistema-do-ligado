import Admin from './pages/Admin';
import Formulario from './pages/Formulario';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Formulario": Formulario,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Formulario",
    Pages: PAGES,
    Layout: __Layout,
};