// La franja "no molestar" se evalúa en la hora del dispositivo, así que los tests necesitan una
// zona horaria fija, igual en cualquier máquina (el CI va en UTC). Hay que fijarla aquí, antes
// de que arranquen los tests: cambiar process.env.TZ dentro de un test no tiene efecto.
module.exports = async () => {
  process.env.TZ = 'Europe/Madrid';
};
