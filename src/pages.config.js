import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Formulario from './pages/Formulario';
import Inicio from './pages/Inicio';
import Ferramentas from './pages/Ferramentas';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Dashboard": Dashboard,
    "Formulario": Formulario,
    "Inicio": Inicio,
    "Ferramentas": Ferramentas,
}

export const pagesConfig = {
    mainPage: "Inicio",
    Pages: PAGES,
    Layout: __Layout,
};