import Formulario from './pages/Formulario';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Formulario": Formulario,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Formulario",
    Pages: PAGES,
    Layout: __Layout,
};