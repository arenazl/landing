#!/bin/sh
# Deja los .dc.html listos para abrir con DOBLE CLIC.
# El handoff referencia `assets/...` y `uploads/*.mp4` como si los .dc
# estuvieran en la raiz del paquete, pero viven en pages/. Y los videos
# no vienen en el handoff (pesan). Esto resuelve las dos cosas usando los
# videos REALES de la landing.
cd "$(dirname "$0")" || exit 1
mkdir -p pages/assets pages/uploads
cp -f assets/* pages/assets/ 2>/dev/null
V=../../../videos
cp -f "$V/loop-atencion.mp4"      "pages/uploads/Employee_helping_neighbor_at_cou..._202606131735.mp4"
cp -f "$V/loop-oficina.mp4"       "pages/uploads/Employees_working_in_modern_office_202606122357.mp4"
cp -f "$V/loop-oficina2.mp4"      "pages/uploads/Employees_working_in_office_202606131532.mp4"
cp -f "$V/loop-atencion-muni.mp4" "pages/uploads/Municipal_employee_helping_neigh..._202606131626.mp4"
cp -f "$V/loop-vecina.mp4"        "pages/uploads/Older_woman_looking_at_smartphone_202606122349.mp4"
cp -f "$V/loop-townhall.mp4"      "pages/uploads/Woman_speaking_at_town_hall_202606130039.mp4"
cp -f "$V/loop-charla.mp4"        "pages/uploads/Woman_speaking_in_office_202606131344.mp4"
echo "listo: assets $(ls pages/assets | wc -l) | uploads $(ls pages/uploads | wc -l)"
