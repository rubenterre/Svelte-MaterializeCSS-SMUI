import Inicio from './Paginas/Inicio.svelte'
import Ajustes from './Paginas/Ajustes.svelte'
import Informacion from './Paginas/Informacion.svelte'
import ApoloPerfil from './Paginas/ApoloPerfil.svelte'
import JupiterPerfil from './Paginas/JupiterPerfil.svelte'
import JunoPerfil from './Paginas/JunoPerfil.svelte'
import MartePerfil from './Paginas/MartePerfil.svelte'
import MercurioPerfil from './Paginas/MercurioPerfil.svelte'
import NeptunoPerfil from './Paginas/NeptunoPerfil.svelte'
import PlutonPerfil from './Paginas/PlutonPerfil.svelte'
import VenusPerfil from './Paginas/VenusPerfil.svelte'
import VulcanoPerfil from './Paginas/VulcanoPerfil.svelte'

import NotFound from './Paginas/NotFound.svelte'

const routes = {
    '/': Inicio,
    '/ajustes': Ajustes,
    '/informacion': Informacion,
    '/ApoloPerfil': ApoloPerfil,
    '/JupiterPerfil': JupiterPerfil,
    '/JunoPerfil': JunoPerfil,
    '/MartePerfil': MartePerfil,
    '/MercurioPerfil': MercurioPerfil,
    '/NeptunoPerfil': NeptunoPerfil,
    '/PlutonPerfil': PlutonPerfil,
    '/VenusPerfil': VenusPerfil,
    '/VulcanoPerfil': VulcanoPerfil,

    // Catch-all route last
    '*': NotFound
}

export default routes