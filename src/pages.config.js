import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Formulario from './pages/Formulario';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Dashboard": Dashboard,
    "Formulario": Formulario,
}

export const pagesConfig = {
    mainPage: "Formulario",
    Pages: PAGES,
    Layout: __Layout,
};