
type healthResponse = {
    status:"ok";
}


export const checkHealth = (): healthResponse => {
    return { status: "ok" };
}