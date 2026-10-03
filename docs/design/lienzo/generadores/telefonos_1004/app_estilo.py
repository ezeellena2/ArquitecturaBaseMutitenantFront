"""Estilos de las pantallas de app que se repiten (chat, campos, hojas, grupos de ajustes, recorrido)."""

ESTILO_X = """<style data-propuesta="app-piezas">
.ap .w-conv { border-bottom: 0; position: relative; padding: 12px 16px; gap: 14px; text-decoration: none; color: inherit; display: flex; }
.ap .w-conv::after { content: ""; position: absolute; left: 74px; right: 0; bottom: 0; height: 1px; background: var(--borde); }
.ap .w-av { width: 44px; height: 44px; font-size: 15px; }
.ap .w-conv .l1 b { font-size: 15.5px; }
.ap .w-conv .l1 span { font-size: 12.5px; }
.ap .w-conv .l2 { font-size: 14px; }
.ap .w-conv .l3 { font-size: 12.5px; color: var(--t3); }
.ap .w-conv .l3.sin { color: oklch(0.55 0.13 70); }
.ap .w-conv .l3 .w-est { font-size: 12.5px; color: var(--t2); }
.ap-seg { margin: 4px 16px 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 12px; background: var(--s3); flex-shrink: 0; }
.ap-seg span, .ap-seg2 span { height: 38px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 14.5px; font-weight: 600; color: var(--t2); }
.ap-seg span.on, .ap-seg2 span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.ap-seg .c { font-weight: 500; color: var(--t3); }
.ap-seg2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 12px; background: var(--s3); }
.ap-txt { height: 40px; padding: 0 10px; border: 0; background: none; color: var(--marca-tx); font-size: 15.5px; font-weight: 600; flex-shrink: 0; }
.ap-cbar { height: 60px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 0 4px; background: #fff; border-bottom: 1px solid var(--borde); }
.ap-cbar .w-av { width: 38px; height: 38px; font-size: 14px; }
.ap-cbar .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ap-cbar .tx b { font-size: 16.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-cbar .tx span { font-size: 12.5px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-cbar .tx span.sin { color: oklch(0.55 0.13 70); }
.ap-chat { flex: 1; min-height: 0; overflow: hidden; background: oklch(0.965 0.012 78); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ap-dia { align-self: center; font-size: 12px; color: var(--t2); background: #fff; padding: 3px 10px; border-radius: 8px; box-shadow: 0 1px 1px oklch(0.2 0.01 78 / 0.06); }
.ap-m { max-width: 80%; display: flex; flex-direction: column; gap: 2px; }
.ap-m .gl { padding: 8px 12px; border-radius: 14px; font-size: 15px; line-height: 1.4; }
.ap-m.ent { align-self: flex-start; }
.ap-m.ent .gl { background: #fff; border-top-left-radius: 4px; box-shadow: 0 1px 1px oklch(0.2 0.01 78 / 0.06); }
.ap-m.sal { align-self: flex-end; align-items: flex-end; }
.ap-m.sal .gl, .ap-burb { background: oklch(0.93 0.04 180); color: oklch(0.28 0.05 195); }
.ap-m.sal .gl { border-top-right-radius: 4px; }
.ap-m .pie { font-size: 11.5px; color: var(--t3); padding: 0 4px; }
.ap-m .gl .bt, .ap-burb .bt { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid oklch(0.51 0.099 195 / 0.2); text-align: center; font-weight: 600; color: var(--marca-tx); }
.ap-sis { align-self: center; font-size: 12.5px; color: var(--t3); text-align: center; }
.ap-nota { align-self: center; max-width: 88%; background: oklch(0.97 0.05 90); border: 1px solid oklch(0.88 0.08 85); color: oklch(0.38 0.07 70); border-radius: 12px; padding: 8px 12px; font-size: 14px; line-height: 1.45; display: flex; flex-direction: column; gap: 2px; }
.ap-nota .q { font-size: 12px; font-weight: 600; }
.ap-escr { flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 8px 10px 34px; background: #fff; border-top: 1px solid var(--borde); }
.ap-escr .campo { flex: 1; min-width: 0; height: 44px; box-sizing: border-box; border-radius: 22px; border: 1px solid var(--borde2); display: flex; align-items: center; padding: 0 16px; color: var(--t3); font-size: 15px; }
.ap-escr .campo.nota { background: oklch(0.985 0.03 90); border-color: oklch(0.85 0.09 85); color: oklch(0.5 0.08 70); }
.ap-red { width: 44px; height: 44px; border-radius: 50%; border: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; background: transparent; color: var(--t2); }
.ap-red.env { background: var(--marca); color: #fff; }
.ap-red.gua { background: oklch(0.7 0.14 75); color: #fff; }
.ap-red.nt.on { background: oklch(0.94 0.07 88); color: oklch(0.45 0.1 70); }
.ap-24 { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; color: oklch(0.45 0.1 70); font-size: 14px; font-weight: 500; white-space: nowrap; }
.ap-24 .ap-i { color: oklch(0.45 0.1 70); }
.ap-pill { text-decoration: none; height: 44px; padding: 0 18px; border-radius: 22px; background: var(--marca); color: #fff; font-weight: 600; font-size: 14.5px; border: 0; display: inline-flex; align-items: center; flex-shrink: 0; }
.ap-menu { position: absolute; z-index: 8; right: 8px; top: 100px; width: 236px; background: #fff; border-radius: 14px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.2), 0 0 0 1px var(--borde); overflow: hidden; display: flex; flex-direction: column; }
.ap-menu span { min-height: 50px; display: flex; align-items: center; padding: 0 18px; font-size: 15.5px; }
.ap-menu span + span { border-top: 1px solid var(--borde); }
.ap-cmp { display: flex; flex-direction: column; gap: 6px; }
.ap-cmp .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); display: flex; justify-content: space-between; align-items: center; }
.ap-cmp .rq { color: var(--peligro); }
.ap-cmp .ct { min-height: 48px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 14px; font-size: 16px; background: #fff; }
.ap-cmp .ct.area { display: block; padding: 12px 14px; line-height: 1.55; min-height: 104px; }
.ap-cmp .ej { text-decoration: none; font-size: 13.5px; font-weight: 600; color: var(--marca-tx); display: inline-flex; gap: 6px; align-items: center; }
.ap-var { display: inline-flex; padding: 0 7px; border-radius: 6px; background: var(--marca-t); color: var(--marca-tx); font-weight: 600; font-size: 14.5px; }
.ap-chips2 { display: flex; gap: 8px; flex-wrap: wrap; }
.ap-chips2 span { height: 34px; padding: 0 12px; border-radius: 17px; border: 1px solid var(--borde2); display: inline-flex; align-items: center; font-size: 13.5px; font-weight: 500; color: var(--t2); }
.ap-burb { align-self: flex-end; max-width: 92%; border-radius: 14px; border-top-right-radius: 4px; padding: 10px 14px; font-size: 15px; line-height: 1.45; }
.ap-burb b { font-weight: 700; }
.ap-costo { text-align: right; font-size: 13.5px; color: var(--t3); margin-top: -6px; }
.ap-lst { display: flex; flex-direction: column; margin: -4px -20px 0; }
.ap-lst .tit { padding: 10px 20px 4px; font-size: 13px; font-weight: 600; color: var(--t3); }
.ap-lst .it { display: flex; align-items: center; justify-content: space-between; min-height: 54px; padding: 0 20px; font-size: 16px; border-top: 1px solid var(--borde); }
.ap-lst .tit + .it { border-top: 0; }
.ap-lst .it span { font-size: 13.5px; color: var(--t3); }
.ap-tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--borde); flex-shrink: 0; background: #fff; }
.ap-tabs span { height: 48px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 600; color: var(--t2); border-bottom: 2.5px solid transparent; }
.ap-tabs span.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.ap-tabs .c { color: var(--t3); font-weight: 500; }
.ap-chips { display: flex; gap: 8px; padding: 4px 16px 12px; overflow: hidden; flex-shrink: 0; }
.ap-chips span { flex-shrink: 0; display: inline-flex; flex-direction: column; justify-content: center; min-width: 84px; height: 58px; box-sizing: border-box; padding: 0 14px; border: 1px solid var(--borde); border-radius: 14px; line-height: 1.25; }
.ap-chips span b { font-size: 17px; font-weight: 600; }
.ap-chips span i { font-style: normal; font-size: 12.5px; color: var(--t3); }
.ap-chips span.on { border-color: oklch(0.51 0.099 195 / 0.45); background: var(--marca-t); }
.ap-chips span.on b, .ap-chips span.on i { color: var(--marca-tx); }
.ap-fijo { flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 12px 16px 34px; background: #fff; border-top: 1px solid var(--borde); }
.ap-fijo .cb { height: 50px; border-radius: 12px; font-size: 16px; padding: 0 22px; }
.ap-fijo .cb.full { flex: 1; }
.ap-fijo .costo { flex: 1; display: flex; flex-direction: column; line-height: 1.3; }
.ap-fijo .costo b { font-size: 16px; font-weight: 600; }
.ap-fijo .costo span { font-size: 13px; color: var(--t3); }
.ap-gris { background: oklch(0.972 0.006 78); }
.ap-gtit { display: flex; justify-content: space-between; align-items: center; margin: 18px 20px 8px; font-size: 13.5px; font-weight: 600; color: var(--t2); }
.ap-gtit a { color: var(--marca-tx); font-weight: 600; text-decoration: none; font-size: 14.5px; }
.ap-grupo { margin: 0 16px; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 0 0 1px var(--borde); flex-shrink: 0; }
.ap-it { display: flex; align-items: center; gap: 12px; min-height: 56px; box-sizing: border-box; padding: 8px 14px 8px 16px; position: relative; text-decoration: none; color: inherit; }
.ap-it + .ap-it::before { content: ""; position: absolute; top: 0; left: 16px; right: 0; height: 1px; background: var(--borde); }
.ap-it .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ap-it .tx b { font-size: 15.5px; font-weight: 500; }
.ap-it .tx span { font-size: 13px; color: var(--t3); }
.ap-it .chev { color: var(--t3); display: inline-flex; }
.ap-it .num { width: 28px; height: 28px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ap-it .ini { width: 36px; height: 36px; border-radius: 10px; background: var(--s3); color: var(--t2); font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ap-it.apag { opacity: 0.55; }
.ap-it .ok { color: var(--marca); display: inline-flex; }
.ap-it.peligro b { color: var(--peligro); }
.ap-sw { width: 50px; height: 30px; border-radius: 15px; background: var(--marca); position: relative; flex-shrink: 0; }
.ap-sw::after { content: ""; position: absolute; top: 3px; right: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px oklch(0.2 0.01 78 / 0.25); }
.ap-sw.off { background: var(--borde2); }
.ap-sw.off::after { right: auto; left: 3px; }
.ap-selnum { margin: 0 16px 10px; height: 46px; box-sizing: border-box; border-radius: 12px; background: var(--s3); display: flex; align-items: center; justify-content: space-between; padding: 0 14px; font-size: 14.5px; font-weight: 500; flex-shrink: 0; }
.ap-yo { display: flex; align-items: center; gap: 14px; padding: 8px 20px 4px; }
.ap-yo .w-av { width: 56px; height: 56px; font-size: 20px; color: #fff; }
.ap-yo b { display: block; font-size: 18px; font-weight: 600; color: var(--t1); }
.ap-yo span { font-size: 13.5px; color: var(--t3); }
.ap-perfil { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 24px 16px; text-align: center; flex-shrink: 0; }
.ap-perfil .w-av { width: 76px; height: 76px; font-size: 26px; }
.ap-perfil h2 { margin: 8px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.015em; }
.ap-perfil p { margin: 0; font-size: 14px; color: var(--t2); line-height: 1.45; }
.ap-rec { padding: 8px 16px 16px; display: flex; flex-direction: column; }
.ap-n { display: flex; gap: 12px; position: relative; padding-bottom: 14px; }
.ap-n::before { content: ""; position: absolute; left: 11px; top: 24px; bottom: 0; width: 2px; background: var(--borde2); }
.ap-n:last-child::before { display: none; }
.ap-n .pt { width: 24px; height: 24px; border-radius: 50%; background: var(--marca); color: #fff; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; position: relative; z-index: 1; margin-top: 10px; }
.ap-n .pt.q { background: oklch(0.7 0.14 75); }
.ap-n .cj { flex: 1; min-width: 0; background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 10px 14px; }
.ap-n .cj b { font-size: 15px; font-weight: 600; display: block; }
.ap-n .cj > span { font-size: 13px; color: var(--t3); }
.ap-rama { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.ap-rama .r { display: flex; align-items: center; gap: 10px; border-radius: 10px; background: var(--s2); border: 1px solid var(--borde); padding: 9px 12px; font-size: 14.5px; }
.ap-rama .r .et { font-size: 12px; font-weight: 700; color: var(--marca-tx); background: var(--marca-t); border-radius: 6px; padding: 2px 7px; }
.ap-rama .r .d { color: var(--t3); font-size: 12.5px; margin-left: auto; }
.w-est.amb::before { background: oklch(0.72 0.15 70); }
.w-est.azul::before { background: var(--marca); }
</style>"""
