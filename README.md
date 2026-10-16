# DON LOUNGE 807 — Atualizações

Este repositório serve **apenas para distribuir o instalador** do sistema
DON LOUNGE 807 (Tabacaria & Hookah Lounge). O código-fonte não fica aqui.

## Baixar / instalar

Baixe a versão mais recente:
**[DonLounge807_Setup.exe](https://github.com/dias737/donlounge-updates/releases/latest/download/DonLounge807_Setup.exe)**
e execute (não precisa de administrador).

Todas as versões: [Releases](https://github.com/dias737/donlounge-updates/releases).

## Atualização automática

O programa instalado verifica este repositório ao abrir e a cada 6 horas.
Quando sai uma versão nova ele baixa o instalador, confere o **SHA-256**
(arquivo `DonLounge807_Setup.exe.sha256` publicado junto), faz um **backup do
banco de dados** e se atualiza sozinho — sem interromper uma venda ou um
pagamento. Com contas abertas, ele pergunta antes ("Atualizar agora?" / "Depois").

Os dados da loja ficam em `%APPDATA%\DonLounge807` e **nunca** são apagados
pela atualização ou pela desinstalação.

## Conferir o arquivo manualmente (opcional)

No PowerShell:

```powershell
Get-FileHash .\DonLounge807_Setup.exe -Algorithm SHA256
```

O resultado deve ser igual ao valor publicado na release.

---
O instalador inclui o SumatraPDF (software livre, GPLv3) usado só para imprimir;
licença e endereço do código-fonte dele estão na pasta `SumatraPDF` do programa instalado.
Documentos emitidos pelo sistema não têm valor fiscal.
