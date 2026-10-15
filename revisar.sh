#!/usr/bin/env bash
# Se pasa antes de cada publicación: si algo de aquí acabara en GitHub, ya no se puede retirar
# (forks, cachés, buscadores). Falla con código 1 si encuentra cualquier cosa sospechosa.
#
# Los nombres privados (clientes, servidores) NO están en este fichero, porque el repo es
# público: se leen de ~/.config/portafolio/prohibidos.txt (uno por línea).
set -uo pipefail
cd "$(dirname "$0")"

# En este Mac `grep` puede ser ugrep, que rechaza algunas expresiones: se usa el del sistema.
GREP=/usr/bin/grep
PROHIBIDOS="${PORTAFOLIO_PROHIBIDOS:-$HOME/.config/portafolio/prohibidos.txt}"
# Teléfonos de ejemplo que sí pueden aparecer (los usan los tests).
TELEFONOS_PERMITIDOS=" 600000000 612345678 622212223 600050709 911234567 "
EXCLUIR=(--exclude-dir=.git --exclude-dir=node_modules --exclude=revisar.sh
         --exclude=package-lock.json --exclude='*.png' --exclude='*.jpg')
fallos=0

avisar() { echo "✗ $1"; printf '%s\n' "$2" | sed 's/^/    /'; fallos=1; }
buscar() { "$GREP" -rInE "${EXCLUIR[@]}" -e "$1" . 2>/dev/null; }

r=$(buscar '(sk-[A-Za-z0-9_-]{20,}|sk_(live|test)_[A-Za-z0-9]{16,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ|key_[a-f0-9]{24,}|AC[a-f0-9]{32}|SK[a-f0-9]{32}|gh[pousr]_[A-Za-z0-9]{30,}|xox[abp]-|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY)')
[ -n "$r" ] && avisar "Posibles claves o tokens" "$r"

# Asignaciones con valor largo (TWILIO_AUTH_TOKEN=…, password: …): cubre las claves sin prefijo conocido.
r=$("$GREP" -rIniE "${EXCLUIR[@]}" -e '(token|secret|secreto|password|passwd|contrase.a|api_?key)[a-z_]*["'"'"']?[[:space:]]*[=:][[:space:]]*["'"'"']?[^[:space:]"'"'"'$<{]{12,}' . 2>/dev/null)
[ -n "$r" ] && avisar "Asignaciones que parecen secretos" "$r"

r=$(buscar '(agent|llm|call|voice)_[a-f0-9]{12,}')
[ -n "$r" ] && avisar "IDs de Retell" "$r"

r=$(buscar '(^|[^0-9.])([0-9]{1,3}\.){3}[0-9]{1,3}([^0-9.]|$)' | "$GREP" -vE '127\.0\.0\.1|0\.0\.0\.0')
[ -n "$r" ] && avisar "Direcciones IP" "$r"

# Teléfonos españoles: se normalizan a 9 cifras y solo pasan los de la lista permitida.
r=""
while IFS= read -r linea; do
  coincidencia="${linea#*:*:}"
  cifras=$(printf '%s' "$coincidencia" | tr -cd '0-9')
  cifras="${cifras: -9}"
  case "$TELEFONOS_PERMITIDOS" in *" $cifras "*) ;; *) r+="$linea"$'\n' ;; esac
done < <("$GREP" -rIonE "${EXCLUIR[@]}" -e '(\+34|0034)?[ .()-]*[6789][0-9]{2}[ .)/-]*([ ./-]?[0-9]){6}' . 2>/dev/null)
[ -n "$r" ] && avisar "Teléfonos que no son de ejemplo" "${r%$'\n'}"

# Sin una lista legible y con contenido no se puede saber si hay nombres de clientes:
# mejor parar que dar por bueno. Los \r se quitan porque una lista guardada en Windows
# no coincidiría con nada.
nombres=""
[ -r "$PROHIBIDOS" ] && nombres=$(tr -d '\r' < "$PROHIBIDOS" | "$GREP" -v '^[[:space:]]*$')
if [ -z "$nombres" ]; then
  avisar "Falta la lista de nombres prohibidos, está vacía o no se puede leer" "$PROHIBIDOS"
else
  r=$("$GREP" -rIniF "${EXCLUIR[@]}" -f <(printf '%s\n' "$nombres") . 2>/dev/null)
  [ -n "$r" ] && avisar "Nombres privados" "$r"
  # También en los nombres de fichero: «cliente-x-notas.md» filtra tanto como su contenido.
  r=$(find . \( -name .git -o -name node_modules \) -prune -o -print | "$GREP" -iF -f <(printf '%s\n' "$nombres"))
  [ -n "$r" ] && avisar "Nombres privados en rutas" "$r"
fi

[ "$fallos" -eq 0 ] && echo "✓ revisar.sh: nada que no deba salir"
exit "$fallos"
