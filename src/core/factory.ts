import server from './context';

export function create(controllers: any[] = []) {
    controllers.forEach(controller => {
        server.addController(controller);
    });    

    return server;
}